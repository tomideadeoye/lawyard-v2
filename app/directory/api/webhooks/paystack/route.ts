import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY!
  const body = await request.text()

  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(body)
    .digest('hex')

  if (hash !== request.headers.get('x-paystack-signature')) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.event === 'charge.success') {
    const data = event.data
    const reference = data.reference
    const sbAdmin = createServiceRoleClient()

    const { data: tx } = await sbAdmin
      .from('transactions')
      .select('*')
      .eq('reference', reference)
      .single()

    if (!tx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })

    await sbAdmin.from('transactions').update({
      status: 'completed',
      metadata: { ...tx.metadata, paystack_data: data },
      updated_at: new Date().toISOString(),
    }).eq('reference', reference)

    const meta = tx.metadata as Record<string, unknown> | null
    const isChamber = meta?.type === 'chamber_subscription'
    const days = 365
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

    const tierMap: Record<string, string> = {
      'Premium (Package)': 'premium_package',
      'Premium (Single)': 'premium_single',
      'Enterprise': 'enterprise',
    }
    const tier = tierMap[tx.plan_name] || 'free'

    if (isChamber) {
      const chamberId = meta?.chamber_id as string | null
      if (chamberId) {
        await sbAdmin.from('chambers').update({
          subscription_tier: tier,
          subscription_status: 'active',
          subscription_expires_at: expiresAt,
          is_featured: true,
        }).eq('id', chamberId)
      }
    } else {
      await sbAdmin.from('profiles').update({
        subscription_tier: tier,
        subscription_status: 'active',
        subscription_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }).eq('id', tx.user_id)

      await sbAdmin.from('lawyers').update({
        listing_type: 'featured',
        is_featured: true,
      }).eq('id', tx.user_id)
    }
  }

  return NextResponse.json({ status: 'ok' })
}
