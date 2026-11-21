import { NextResponse, type NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { safeDestination } from '@/lib/ads'

export const dynamic = 'force-dynamic'

/**
 * Click-through for house ads.
 *
 * Every creative points here instead of straight at the advertiser, so the count
 * is recorded server-side — a client counter can be blocked, and this one has to
 * survive ad blockers and no-JS. The destination is re-validated on the way out:
 * the row is third-party input and this route is an open redirect otherwise.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const home = NextResponse.redirect(new URL('/', request.url), 302)

  const supabase = createServiceRoleClient()
  const { data: ad } = await supabase
    .from('ad_slots')
    .select('id, href')
    .eq('id', id)
    .maybeSingle()

  const destination = safeDestination(ad?.href)
  if (!ad || !destination) return home

  // A lost click is worth less than a lost redirect: never block the visitor on
  // the counter.
  await supabase.rpc('record_ad_event', { p_ad_id: ad.id, p_kind: 'click' })

  const response = NextResponse.redirect(new URL(destination, request.url), 302)
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  response.headers.set('Cache-Control', 'no-store')
  return response
}
