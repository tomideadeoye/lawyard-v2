/**
 * Tier model + content publishing caps (C02, C05 — 12 Sep 2026).
 * Pure helpers only — no DB access here. Single source of truth for tier
 * labels/rank and the post-cap rules, so a change lands in one place.
 */

/** Canonical tier labels. Free -> Silver -> Premium (single/package) -> Enterprise. */
export const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  silver: 'Silver',
  premium_single: 'Premium (Single)',
  premium_package: 'Premium (Package)',
  enterprise: 'Enterprise',
}

/** Ladder rank — used for upgrade/downgrade decisions. */
export const TIER_RANK: Record<string, number> = {
  free: 0,
  silver: 1,
  premium_single: 2,
  premium_package: 3,
  enterprise: 4,
}

/** Any tier other than 'free' is a paid tier. */
export function isPaidTier(tier?: string | null): boolean {
  return !!tier && tier !== 'free'
}

/** Default caps (overridable at runtime from app_settings). */
export const POST_CAP_DEFAULTS = {
  freeTotal: 1,
  paidPerMonth: 3,
  extraPostPrice: 20000,
} as const

export interface PublishingQuota {
  tier: string
  paid: boolean
  /** Posts counted against the cap — lifetime total (free) or this month (paid). */
  used: number
  /** Cap for the current period. */
  limit: number
  remaining: number
  /** Purchased extra-post credits available. */
  credits: number
  extraPostPrice: number
  canPublish: boolean
}

/** Gallery image caps by plan (C10). Law firms get a higher ceiling. */
export const GALLERY_CAP = {
  free: 3,
  paid: 6,
  firm: 12,
} as const

export function galleryCapFor(tier?: string | null, isFirm = false): number {
  if (isFirm) return GALLERY_CAP.firm
  return isPaidTier(tier) ? GALLERY_CAP.paid : GALLERY_CAP.free
}

/** Intro video is a premium (paid-tier) feature (C08). */
export function canUseIntroVideo(tier?: string | null): boolean {
  return isPaidTier(tier)
}
