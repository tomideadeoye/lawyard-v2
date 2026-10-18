'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { initializeTransaction } from '@/lib/api/paystack'
import { generatePaymentReference, getSiteUrl } from '@/lib/utils/payment'
import { revalidatePath } from 'next/cache'

const BOOKING_FEE_FALLBACK = 5000

async function getBookingFee(): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'booking_fee')
    .maybeSingle()
  const n = Number(data?.value)
  return Number.isFinite(n) && n > 0 ? n : BOOKING_FEE_FALLBACK
}

export interface ServiceRequestInput {
  lawyerId: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  serviceType: string
  scope: string
  budget?: string
  preferredDate?: string
  message?: string
}

/**
 * C14 + C15: create a structured service request and start the booking-fee
 * checkout. The request stays `pending_payment` until Paystack confirms.
 */
export async function createServiceRequest(input: ServiceRequestInput) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Please sign in to request a service' }

  if (!input.lawyerId || !input.serviceType || !input.scope) {
    return { error: 'Please complete the service type and scope' }
  }
  if (input.lawyerId === user.id) {
    return { error: 'You cannot request a service from your own listing' }
  }

  const fee = await getBookingFee()
  const reference = generatePaymentReference('LWY')

  const sbAdmin = createServiceRoleClient()
  const { data: request, error: insertError } = await sbAdmin
    .from('service_requests')
    .insert({
      client_id: user.id,
      lawyer_id: input.lawyerId,
      client_name: input.clientName,
      client_email: input.clientEmail,
      client_phone: input.clientPhone || null,
      service_type: input.serviceType,
      scope: input.scope,
      budget: input.budget || null,
      preferred_date: input.preferredDate || null,
      message: input.message || null,
      booking_fee: fee,
      status: 'pending_payment',
      payment_reference: reference,
    })
    .select('id')
    .single()

  if (insertError || !request) {
    return { error: insertError?.message || 'Could not create the service request' }
  }

  const init = await initializeTransaction({
    email: user.email!,
    amount: fee,
    reference,
    currency: 'NGN',
    callback_url: `${getSiteUrl()}/lawyer/${input.lawyerId}?service_request=completed`,
    metadata: {
      type: 'service_request',
      user_id: user.id,
      service_request_id: request.id,
      lawyer_id: input.lawyerId,
    },
  })

  if (!init.status || !init.data) {
    return { error: init.message || 'Failed to initialize payment' }
  }

  await sbAdmin.from('transactions').insert({
    user_id: user.id,
    reference,
    amount: fee,
    currency: 'NGN',
    plan_name: 'Service Request',
    plan_role: 'client',
    status: 'pending',
    metadata: {
      authorization_url: init.data.authorization_url,
      type: 'service_request',
      service_request_id: request.id,
    },
  })

  return { authorization_url: init.data.authorization_url, reference }
}

/** Confirm a paid service request (called from webhook / verify). Idempotent. */
export async function confirmServiceRequest(reference: string) {
  const sbAdmin = createServiceRoleClient()
  const { data: req } = await sbAdmin
    .from('service_requests')
    .select('id, status')
    .eq('payment_reference', reference)
    .maybeSingle()

  if (!req || req.status !== 'pending_payment') return

  await sbAdmin
    .from('service_requests')
    .update({ status: 'requested', updated_at: new Date().toISOString() })
    .eq('id', req.id)
}

export async function getBookingFeeAmount() {
  return getBookingFee()
}

export async function getServiceRequestsForLawyer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('lawyer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data: data ?? [] }
}

export async function getServiceRequestsForClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('service_requests')
    .select('*, lawyer:lawyers(name, image_url, role)')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data: data ?? [] }
}

export async function respondToServiceRequest(
  requestId: string,
  status: 'accepted' | 'declined' | 'completed'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('service_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('lawyer_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/bookings')
  return { success: true }
}
