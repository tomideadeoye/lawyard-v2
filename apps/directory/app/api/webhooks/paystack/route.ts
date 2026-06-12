import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
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
    const supabase = await createClient()

    const { data: tx } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference', reference)
      .single()

    if (!tx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })

    await supabase.from('transactions').update({
      status: 'completed',
      metadata: { ...tx.metadata, paystack_data: data },
      updated_at: new Date().toISOString(),
    }).eq('reference', reference)

    const tierMap: Record<string, string> = {
      'Premium (Package)': 'premium_package',
      'Premium (Single)': 'premium_single',
      'Enterprise': 'enterprise',
    }
    const tier = tierMap[tx.plan_name] || 'free'

    await supabase.from('profiles').update({
      subscription_tier: tier,
      updated_at: new Date().toISOString(),
    }).eq('id', tx.user_id)
  }

  return NextResponse.json({ status: 'ok' })
}
