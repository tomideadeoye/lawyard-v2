import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { verifyTransaction } from '@/lib/api/paystack'
import { sendPaymentConfirmation } from '@/lib/api/email'

const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!

function verifySignature(body: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha512', SECRET_KEY)
    .update(body)
    .digest('hex')
  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-paystack-signature') || ''

  if (!verifySignature(body, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { event: string; data: any }
  try {
    event = JSON.parse(body)
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.event !== 'charge.success') {
    return Response.json({ status: 'ignored' })
  }

  const reference = event.data?.reference
  const metadata = event.data?.metadata

  if (!reference || metadata?.type !== 'brand_press') {
    return Response.json({ status: 'ignored' })
  }

  const verify = await verifyTransaction(reference)
  if (!verify.status || verify.data?.status !== 'success') {
    return Response.json({ error: 'Verification failed' }, { status: 400 })
  }

  const sbAdmin = createServiceRoleClient()

  const { data: existing } = await sbAdmin
    .from('transactions')
    .select('status')
    .eq('reference', reference)
    .single()

  if (!existing) {
    return Response.json({ error: 'Transaction not found' }, { status: 404 })
  }

  if (existing.status === 'success') {
    return Response.json({ status: 'already_processed' })
  }

  const { error: txError } = await sbAdmin
    .from('transactions')
    .update({ status: 'success' })
    .eq('reference', reference)

  if (txError) {
    return Response.json({ error: 'Failed to update transaction' }, { status: 500 })
  }

  if (metadata.article_id) {
    await sbAdmin
      .from('articles')
      .update({
        payment_status: 'paid',
        status: 'pending_review',
      })
      .eq('id', metadata.article_id)
  }

  const customerEmail = verify.data?.customer?.email || metadata.contact_email
  if (customerEmail && metadata.brand_name) {
    sendPaymentConfirmation(
      customerEmail,
      metadata.brand_name,
      metadata.tier || ''
    ).catch(() => {})
  }

  return Response.json({ status: 'success' })
}
