'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { initializeTransaction, verifyTransaction } from '@/lib/api/paystack'
import { revalidatePath } from 'next/cache'
import { getPlanByName } from '@/app/directory/actions/plans'
import { clampSeats } from '@/lib/directory/seats'
import { generatePaymentReference, getSiteUrl } from '@/lib/utils/payment'

export async function createPayment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'You must be logged in to make a payment' }

  const planName = formData.get('plan_name') as string
  const planRole = formData.get('plan_role') as string
  const chamberId = formData.get('chamber_id') as string | null
  const seatsInput = formData.get('seats') as string | null

  if (!planName || !planRole) {
    return { error: 'Invalid plan details' }
  }

  // Resolve plan price from the database to prevent client-side manipulation
  const dbPlan = await getPlanByName(planName, planRole)
  if (!dbPlan || dbPlan.price <= 0) {
    return { error: 'Invalid plan selected or free tier cannot be paid' }
  }

  const isChamber = planRole === 'chamber'

  // C22: firm plans are billed per seat. The seat count is re-derived and clamped
  // server-side — the browser only proposes a number.
  const seats = isChamber ? clampSeats(Number(seatsInput ?? 1)) : 1

  if (isChamber) {
    // A firm subscription attaches to an existing firm listing. Without one there
    // is nothing to upgrade, and the payment would be a receipt with no product.
    if (!chamberId) {
      return { error: 'Create your firm listing first, then buy seats for it.' }
    }

    const { data: chamber } = await supabase
      .from('chambers')
      .select('id, user_id')
      .eq('id', chamberId)
      .maybeSingle()

    let manages = chamber?.user_id === user.id
    if (!manages) {
      const { data: adminRow } = await supabase
        .from('chamber_admins')
        .select('role')
        .eq('chamber_id', chamberId)
        .eq('user_id', user.id)
        .maybeSingle()
      manages = Boolean(adminRow)
    }

    if (!manages) return { error: 'You do not manage this firm' }
  }

  const amount = dbPlan.price * seats
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
    currency: 'NGN',
    callback_url: `${getSiteUrl()}/pricing?payment=completed`,
    metadata: {
      type: isChamber ? 'chamber_subscription' : 'subscription',
      user_id: user.id,
      plan_name: planName,
      plan_role: planRole,
      seats,
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
    currency: 'NGN',
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

    // C05: extra-post purchase → grant a post credit (idempotent by reference).
    if (meta?.type === 'extra_post') {
      const { data: existing } = await sbAdmin
        .from('post_credits')
        .select('id')
        .eq('reference', reference)
        .maybeSingle()
      if (!existing) {
        await sbAdmin.from('post_credits').insert({
          user_id: tx.user_id,
          delta: 1,
          reason: 'purchase',
          reference,
        })
      }
      revalidatePath('/dashboard/publish')
      return { success: true, status: verification.data.status }
    }

    // C15: service-request booking fee → confirm the request (idempotent).
    if (meta?.type === 'service_request') {
      const reqId = meta?.service_request_id as string | undefined
      if (reqId) {
        await sbAdmin
          .from('service_requests')
          .update({ status: 'requested', updated_at: new Date().toISOString() })
          .eq('id', reqId)
          .eq('status', 'pending_payment')
      }
      revalidatePath('/dashboard/bookings')
      return { success: true, status: verification.data.status }
    }

    // C09: Lawyard Lens course enrollment → mark enrolled (idempotent).
    if (meta?.type === 'course_enrollment') {
      const { data: enr } = await sbAdmin
        .from('course_enrollments')
        .select('id, status')
        .eq('reference', reference)
        .maybeSingle()
      if (enr && enr.status !== 'enrolled') {
        await sbAdmin
          .from('course_enrollments')
          .update({ status: 'enrolled', updated_at: new Date().toISOString() })
          .eq('id', enr.id)
      }
      revalidatePath('/lens')
      return { success: true, status: verification.data.status }
    }

    const tierMap: Record<string, string> = {
      'Premium (Package)': 'premium_package',
      'Premium (Single)': 'premium_single',
      'Premium': 'premium_single',
      'Silver': 'silver',
      'Enterprise': 'enterprise',
    }

    // A paid chamber plan is the firm rung; the plan's own name is not a profile
    // tier, so it must not be mapped through the lawyer ladder.
    const tier = isChamber
      ? (tx.plan_role === 'chamber' && tx.plan_name !== 'Free' ? 'enterprise' : 'free')
      : tierMap[tx.plan_name] || 'free'

    // Term follows the plan, not a hardcoded year: client plans run 90 days.
    const plan = await getPlanByName(tx.plan_name, tx.plan_role)
    const days = /90/.test(plan?.period ?? '') ? 90 : 365
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

    if (isChamber) {
      const chamberId = meta?.chamber_id as string | null
      if (chamberId) {
        const seats = clampSeats(Number(meta?.seats ?? 1))
        // Renewal extends the running term instead of truncating it.
        const { data: current } = await sbAdmin
          .from('chambers')
          .select('subscription_expires_at, subscription_status')
          .eq('id', chamberId)
          .maybeSingle()

        const stillRunning =
          current?.subscription_status === 'active' &&
          current?.subscription_expires_at &&
          new Date(current.subscription_expires_at) > new Date()

        const start = stillRunning ? new Date(current!.subscription_expires_at as string) : new Date()
        const extended = new Date(start.getTime() + days * 24 * 60 * 60 * 1000).toISOString()

        await sbAdmin.from('chambers').update({
          subscription_tier: tier,
          subscription_status: 'active',
          subscription_expires_at: extended,
          seat_limit: seats,
          is_featured: true,
        }).eq('id', chamberId)

        // Seats bought can be fewer than seats in use. Nobody is ejected here —
        // the firm sees the overage in Team & seats and either buys more or ends
        // a membership deliberately.
      }
    } else {
      await sbAdmin.from('profiles').update({
        subscription_tier: tier,
        subscription_status: 'active',
        subscription_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)

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
