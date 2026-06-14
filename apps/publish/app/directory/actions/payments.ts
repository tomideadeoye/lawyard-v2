'use server'

import { createClient } from '@/lib/supabase/server'
import { initializeTransaction, verifyTransaction } from '@/lib/api/paystack'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

function generateReference(): string {
  return `LWY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

export async function createPayment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'You must be logged in to make a payment' }

  const planName = formData.get('plan_name') as string
  const planRole = formData.get('plan_role') as string
  const amount = parseFloat(formData.get('amount') as string)

  if (!planName || !planRole || isNaN(amount) || amount <= 0) {
    return { error: 'Invalid plan details' }
  }

  const reference = generateReference()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const init = await initializeTransaction({
    email: user.email!,
    amount,
    reference,
    callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/pricing?payment=completed`,
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

  const { error: dbError } = await supabase.from('transactions').insert({
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

  const { data: tx } = await supabase
    .from('transactions')
    .select('*')
    .eq('reference', reference)
    .single()

  if (!tx) return { error: 'Transaction not found' }

  const isSuccess = verification.data.status === 'success'

  await supabase.from('transactions').update({
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
