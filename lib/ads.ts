import { createClient } from '@/lib/supabase/server'

/**
 * House ads.
 *
 * The creative, the destination and the flight window are data (`ad_slots`);
 * everything here is the read side plus the three rules the render side must
 * never get wrong: only live rows, only http(s) destinations, and no layout
 * shift when the image finally arrives.
 */

export const AD_PLACEMENTS = [
  'article-before',
  'article-after',
  'footer-banner',
  'sidebar',
] as const

export type AdPlacement = (typeof AD_PLACEMENTS)[number]

export interface Ad {
  id: string
  placement: AdPlacement
  label: string
  image_url: string
  href: string
  alt: string | null
  image_width: number | null
  image_height: number | null
  weight: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}

export function isAdPlacement(value: unknown): value is AdPlacement {
  return typeof value === 'string' && (AD_PLACEMENTS as readonly string[]).includes(value)
}

/** A row is live only inside its own flight window — an expired ad is not an ad. */
export function isAdLive(ad: Pick<Ad, 'is_active' | 'starts_at' | 'ends_at'>, at: Date = new Date()): boolean {
  if (!ad.is_active) return false
  const now = at.getTime()
  if (ad.starts_at) {
    const start = new Date(ad.starts_at).getTime()
    if (Number.isNaN(start) || start > now) return false
  }
  if (ad.ends_at) {
    const end = new Date(ad.ends_at).getTime()
    // A malformed end date should not block a paid placement forever.
    if (!Number.isNaN(end) && end <= now) return false
  }
  return true
}

/**
 * Resolve the destination. Anything that is not an absolute http(s) URL becomes
 * a relative path, so a typo cannot smuggle `javascript:` into an href.
 */
export function safeDestination(href: string | null | undefined): string | null {
  const value = (href ?? '').trim()
  if (!value) return null
  if (value.startsWith('/')) return value
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

/** Highest weight wins; ties go to the newest booking. */
export function pickAd<T extends { weight: number; created_at?: string }>(ads: T[]): T | null {
  if (ads.length === 0) return null
  return [...ads].sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight
    return (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })[0]
}

/** The live creative for a placement, or null. Failures are silent by design. */
export async function getAd(placement: AdPlacement): Promise<Ad | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ad_slots')
    .select('*')
    .eq('placement', placement)
    .eq('is_active', true)

  if (error || !data) return null

  const live = (data as Ad[]).filter((ad) => isAdLive(ad) && safeDestination(ad.href))
  return pickAd(live)
}
