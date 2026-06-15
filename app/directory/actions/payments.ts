'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { initializeTransaction, verifyTransaction } from '@/lib/api/paystack'
import { revalidatePath } from 'next/cache'
import pricingData from '@/config/pricing.json'
import { generatePaymentReference, getSiteUrl } from '@/lib/utils/payment'

export async function createPayment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'You must be logged in to make a payment' }

  const planName = formData.get('plan_name') as string
  const planRole = formData.get('plan_role') as string

  if (!planName || !planRole) {
    return { error: 'Invalid plan details' }
  }

  // Resolve plan price on the server side using the JSON config to prevent client-side manipulation
  let foundPrice = -1
  for (const category of Object.values(pricingData)) {
    const matchedPlan = category.find((p: any) => p.name === planName)
    if (matchedPlan) {
      foundPrice = parseFloat(matchedPlan.price.replace('$', ''))
      break
    }
  }

  if (foundPrice <= 0) {
    return { error: 'Invalid plan selected or free tier cannot be paid' }
  }

  const amount = foundPrice
  const reference = generatePaymentReference('LWY')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const init = await initializeTransaction({
    email: user.email!,
    amount,
    reference,
    callback_url: `${getSiteUrl()}/pricing?payment=completed`,
    metadata: {
      user_id: user.id,
      plan_name: planName,
      plan_role: planRole,
      full_name: profile?.full_name,
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
    const tierMap: Record<string, string> = {
      'Premium (Package)': 'premium_package',
      'Premium (Single)': 'premium_single',
      'Enterprise': 'enterprise',
    }
    const tier = tierMap[tx.plan_name] || 'free'

    await supabase.from('profiles').update({
      subscription_tier: tier,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
  }

  revalidatePath('/pricing')
  revalidatePath('/dashboard')

  return { success: isSuccess, status: verification.data.status }
}
