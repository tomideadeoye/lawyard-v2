import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { verifyTransaction } from '@/lib/api/paystack'
import { sendPaymentConfirmation, sendShopOrderConfirmation } from '@/lib/api/email'

const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!

function verifySignature(body: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha512', SECRET_KEY)
    .update(body)
    .digest('hex')
  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

async function handleBrandPress(sbAdmin: ReturnType<typeof createServiceRoleClient>, reference: string, metadata: any, verify: any) {
  if (!metadata) return Response.json({ error: 'Missing metadata' }, { status: 400 })
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

async function handleShopPurchase(sbAdmin: ReturnType<typeof createServiceRoleClient>, reference: string, _metadata: any, verify: any) {
  const { data: tx } = await sbAdmin
    .from('transactions')
    .select('id, metadata')
    .eq('reference', reference)
    .single()

  if (!tx) {
    return Response.json({ error: 'Transaction not found' }, { status: 404 })
  }

  const { error: txError } = await sbAdmin
    .from('transactions')
    .update({ status: 'success' })
    .eq('reference', reference)

  if (txError) {
    return Response.json({ error: 'Failed to update transaction' }, { status: 500 })
  }

  const meta = tx.metadata || {}
  const items = meta.items || []
  const billing = meta.billing_details || {}
  const customerEmail = verify.data?.customer?.email || billing.email

  if (customerEmail && items.length > 0) {
    sendShopOrderConfirmation({
      email: customerEmail,
      reference,
      amount: verify.data?.amount ? verify.data.amount / 100 : 0,
      items,
      billingDetails: billing,
    }).catch(() => {})
  }

  return Response.json({ status: 'success' })
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
  if (!reference) {
    return Response.json({ error: 'Missing reference' }, { status: 400 })
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

  const type = metadata?.type || ''

  if (type === 'brand_press') {
    return handleBrandPress(sbAdmin, reference, metadata, verify)
  }

  if (type === 'shop_purchase') {
    return handleShopPurchase(sbAdmin, reference, metadata, verify)
  }

  if (type === 'subscription') {
    return handleSubscription(sbAdmin, reference, metadata)
  }

  if (type === 'chamber_subscription') {
    return handleChamberSubscription(sbAdmin, reference, metadata)
  }

  return Response.json({ status: 'ignored' })
}

async function handleSubscription(
  sbAdmin: ReturnType<typeof createServiceRoleClient>,
  reference: string,
  metadata: any
) {
  if (!metadata) return Response.json({ error: 'Missing metadata' }, { status: 400 })
  const { error: txError } = await sbAdmin
    .from('transactions')
    .update({ status: 'success' })
    .eq('reference', reference)

  if (txError) {
    return Response.json({ error: 'Failed to update transaction' }, { status: 500 })
  }

  const userId = metadata.user_id
  const planName = metadata.plan_name

  if (!userId || !planName) {
    return Response.json({ error: 'Missing user_id or plan_name' }, { status: 400 })
  }

  const tierMap: Record<string, string> = {
    'Premium (Package)': 'premium_package',
    'Premium (Single)': 'premium_single',
    'Enterprise': 'enterprise',
  }
  const tier = tierMap[planName] || 'free'

  const expiryMap: Record<string, number> = {
    'Premium (Package)': 365,
    'Premium (Single)': 365,
    'Enterprise': 365,
  }
  const days = expiryMap[planName] || 365
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

  await sbAdmin.from('profiles').update({
    subscription_tier: tier,
    subscription_status: 'active',
    subscription_expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }).eq('id', userId)

  await sbAdmin.from('lawyers').update({
    listing_type: 'featured',
    is_featured: true,
  }).eq('id', userId)

  return Response.json({ status: 'success' })
}

async function handleChamberSubscription(
  sbAdmin: ReturnType<typeof createServiceRoleClient>,
  reference: string,
  metadata: any
) {
  if (!metadata) return Response.json({ error: 'Missing metadata' }, { status: 400 })

  const { error: txError } = await sbAdmin
    .from('transactions')
    .update({ status: 'success' })
    .eq('reference', reference)

  if (txError) {
    return Response.json({ error: 'Failed to update transaction' }, { status: 500 })
  }

  const chamberId = metadata.chamber_id
  const planName = metadata.plan_name

  if (!chamberId || !planName) {
    return Response.json({ error: 'Missing chamber_id or plan_name' }, { status: 400 })
  }

  const days = planName === 'Enterprise' ? 365 : 365
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

  await sbAdmin.from('chambers').update({
    subscription_tier: planName === 'Enterprise' ? 'enterprise' : 'free',
    subscription_status: 'active',
    subscription_expires_at: expiresAt,
    is_featured: true,
  }).eq('id', chamberId)

  return Response.json({ status: 'success' })
}
