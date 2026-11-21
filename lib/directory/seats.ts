/**
 * Chamber seats (C22 — 21 Nov 2026). Pure helpers; no DB access.
 *
 * Billing is per seat, so a firm's entitlement is the number of seats it bought
 * (`chambers.seat_limit`), not a constant attached to its tier name. These
 * helpers only answer "is there room" and "which tier applies to this lawyer",
 * so the server action and the UI can never disagree about either.
 */

import { TIER_RANK } from './publishing'

/** A firm always has room for its owner. */
export const MIN_SEAT_LIMIT = 1

/** Sanity bound so a typo in a checkout form cannot buy 10,000 seats. */
export const MAX_SEATS_PER_FIRM = 200

export interface SeatState {
  used: number
  limit: number
  remaining: number
  atCapacity: boolean
}

/** Active seats only. Pending invites do not hold a seat until someone accepts. */
export function seatState(used: number, limit: number): SeatState {
  const safeLimit = Math.max(MIN_SEAT_LIMIT, Math.floor(limit || MIN_SEAT_LIMIT))
  const safeUsed = Math.max(0, Math.floor(used || 0))
  const remaining = Math.max(0, safeLimit - safeUsed)
  return { used: safeUsed, limit: safeLimit, remaining, atCapacity: remaining === 0 }
}

/**
 * The tier a lawyer's listing should be treated as. A firm seat is worth having
 * only if it actually confers the firm's tier, so the two are combined by rank:
 * a Premium lawyer inside an Enterprise firm gets Enterprise, and an Enterprise
 * lawyer who leaves a free firm keeps Enterprise.
 */
export function effectiveTier(ownTier?: string | null, chamberTier?: string | null): string {
  const own = ownTier ?? 'free'
  const chamber = chamberTier ?? 'free'
  const ownRank = TIER_RANK[own] ?? 0
  const chamberRank = TIER_RANK[chamber] ?? 0
  return chamberRank > ownRank ? chamber : own
}

/** Clamp a requested seat quantity into what can actually be sold. */
export function clampSeats(requested: number): number {
  const n = Math.floor(Number(requested) || MIN_SEAT_LIMIT)
  return Math.min(MAX_SEATS_PER_FIRM, Math.max(MIN_SEAT_LIMIT, n))
}
