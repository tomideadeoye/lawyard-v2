import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sbAdmin = createServiceRoleClient()
  const now = new Date().toISOString()

  // Expire lawyer profiles
  const { data: expired } = await sbAdmin
    .from('profiles')
    .select('id')
    .eq('subscription_status', 'active')
    .lt('subscription_expires_at', now)

  if (expired && expired.length > 0) {
    const ids = expired.map(p => p.id)

    await sbAdmin.from('profiles').update({
      subscription_status: 'expired',
      subscription_tier: 'free',
      updated_at: now,
    }).in('id', ids)

    await sbAdmin.from('lawyers').update({
      listing_type: 'general',
      is_featured: false,
    }).in('id', ids)

    console.log(`Expired ${ids.length} subscriptions:`, ids)
  }

  // Expire chamber subscriptions
  const { data: expiredChambers } = await sbAdmin
    .from('chambers')
    .select('id')
    .eq('subscription_status', 'active')
    .lt('subscription_expires_at', now)

  if (expiredChambers && expiredChambers.length > 0) {
    const ids = expiredChambers.map(c => c.id)

    await sbAdmin.from('chambers').update({
      subscription_status: 'expired',
      subscription_tier: 'free',
      is_featured: false,
    }).in('id', ids)

    console.log(`Expired ${ids.length} chamber subscriptions:`, ids)
  }

  return NextResponse.json({
    ok: true,
    profiles_expired: expired?.length || 0,
    chambers_expired: expiredChambers?.length || 0,
  })
}
