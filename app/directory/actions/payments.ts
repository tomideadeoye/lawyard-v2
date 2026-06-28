'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { initializeTransaction, verifyTransaction } from '@/lib/api/paystack'
import { revalidatePath } from 'next/cache'
import { getPlanByName } from '@/app/directory/actions/plans'
import { generatePaymentReference, getSiteUrl } from '@/lib/utils/payment'

export async function createPayment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'You must be logged in to make a payment' }

  const planName = formData.get('plan_name') as string
  const planRole = formData.get('plan_role') as string
  const chamberId = formData.get('chamber_id') as string | null

  if (!planName || !planRole) {
    return { error: 'Invalid plan details' }
  }

  // Resolve plan price from the database to prevent client-side manipulation
  const dbPlan = await getPlanByName(planName, planRole)
  if (!dbPlan || dbPlan.price <= 0) {
    return { error: 'Invalid plan selected or free tier cannot be paid' }
  }

  const amount = dbPlan.price
  const reference = generatePaymentReference('LWY')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const isChamber = planRole === 'chamber'

  const init = await initializeTransaction({
    email: user.email!,
    amount,
    reference,
    callback_url: `${getSiteUrl()}/pricing?payment=completed`,
    metadata: {
      type: isChamber ? 'chamber_subscription' : 'subscription',
      user_id: user.id,
      plan_name: planName,
      plan_role: planRole,
      full_name: profile?.full_name,
      ...(isChamber && chamberId ? { chamber_id: chamberId } : {}),
    },
  })

  if (!init.status || !init.data) {
    return { error: init.message || 'Failed to initialize payment' }
  }

  const sbAdmin = createServiceRoleClient()

  const { error: dbError } = await sbAdmin.from('transactions').insert({
    user_id: user.id,
    reference,
    amount,
    plan_name: planName,
    plan_role: planRole,
    status: 'pending',
    metadata: { authorization_url: init.data.authorization_url },
  })

  if (dbError) return { error: 'Failed to record transaction' }

  return { authorization_url: init.data.authorization_url, reference }
}

export async function verifyPayment(reference: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const verification = await verifyTransaction(reference)
  if (!verification.status || !verification.data) {
    return { error: 'Payment verification failed' }
  }

  const sbAdmin = createServiceRoleClient()

  const { data: tx } = await sbAdmin
    .from('transactions')
    .select('*')
    .eq('reference', reference)
    .single()

  if (!tx) return { error: 'Transaction not found' }

  const isSuccess = verification.data.status === 'success'

  await sbAdmin.from('transactions').update({
    status: isSuccess ? 'completed' : 'failed',
    metadata: { ...tx.metadata, verification: verification.data },
    updated_at: new Date().toISOString(),
  }).eq('reference', reference)

  if (isSuccess) {
    const meta = tx.metadata as Record<string, unknown> | null
    const isChamber = meta?.type === 'chamber_subscription'

    if (isChamber) {
      const chamberId = meta?.chamber_id as string | null
      if (chamberId) {
        const days = tx.plan_name === 'Enterprise' ? 365 : 365
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        await sbAdmin.from('chambers').update({
          subscription_tier: tx.plan_name === 'Enterprise' ? 'enterprise' : 'free',
          subscription_status: 'active',
          subscription_expires_at: expiresAt,
          is_featured: true,
        }).eq('id', chamberId)
      }
    } else {
      const tierMap: Record<string, string> = {
        'Premium (Package)': 'premium_package',
        'Premium (Single)': 'premium_single',
        'Enterprise': 'enterprise',
      }
      const tier = tierMap[tx.plan_name] || 'free'

      const expiryMap: Record<string, number> = {
        'Premium (Package)': 365,
        'Premium (Single)': 365,
        'Enterprise': 365,
      }
      const days = expiryMap[tx.plan_name] || 365
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

      await supabase.from('profiles').update({
        subscription_tier: tier,
        subscription_status: 'active',
        subscription_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)

      // Upgrade lawyer listing to featured
      await sbAdmin.from('lawyers').update({
        listing_type: 'featured',
        is_featured: true,
      }).eq('id', user.id)
    }
  }

  revalidatePath('/pricing')
  revalidatePath('/dashboard')

  return { success: isSuccess, status: verification.data.status }
}
