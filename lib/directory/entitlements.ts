/**
 * Server-side tier resolution (C22).
 *
 * A listing's entitlement is the better of two things: the plan the person pays
 * for, and the plan of the firm whose seat they hold. Every gate (gallery cap,
 * intro video, featured placement) must read the same answer, so they all read
 * it from here instead of `profiles.subscription_tier`.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { effectiveTier } from './seats'

export interface ListingEntitlement {
  /** Plan the person bought themselves. */
  ownTier: string
  /** Plan of the firm seat, if they hold one. */
  chamberTier: string | null
  /** Firm they hold an active seat in, if any. */
  chamberId: string | null
  /** What the listing should be treated as. */
  tier: string
  /** True when the firm's plan is what unlocks the tier. */
  fromFirm: boolean
}

export async function resolveListingEntitlement(
  supabase: SupabaseClient,
  userId: string
): Promise<ListingEntitlement> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .maybeSingle()

  const { data: membership } = await supabase
    .from('chamber_members')
    .select('chamber_id, chambers:chambers(subscription_tier, subscription_status, subscription_expires_at)')
    .eq('lawyer_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  const chamber = Array.isArray(membership?.chambers)
    ? membership?.chambers[0]
    : membership?.chambers

  // A lapsed firm subscription stops conferring its tier; the seat remains.
  const firmActive =
    !!chamber &&
    chamber.subscription_status === 'active' &&
    (!chamber.subscription_expires_at || new Date(chamber.subscription_expires_at) > new Date())

  const chamberTier = firmActive ? (chamber?.subscription_tier as string) : null
  const ownTier = (profile?.subscription_tier as string) || 'free'

  return {
    ownTier,
    chamberTier,
    chamberId: membership?.chamber_id ?? null,
    tier: effectiveTier(ownTier, chamberTier),
    fromFirm: effectiveTier(ownTier, chamberTier) !== ownTier,
  }
}
