import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Impression counter, called once per creative per session when the ad is
 * actually in view. Deliberately silent: 204 whatever happens, so a failed
 * beacon can never surface as an error in the reader's console.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const adId = body && typeof body.adId === 'string' ? body.adId : ''
  if (!UUID.test(adId)) return new Response(null, { status: 204 })

  const supabase = await createClient()
  await supabase.rpc('record_ad_event', { p_ad_id: adId, p_kind: 'impression' })

  return new Response(null, { status: 204 })
}
