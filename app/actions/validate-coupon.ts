'use server'

import { createServiceRoleClient, createClient } from '@/lib/supabase/server'

interface CouponValid {
  valid: true
  code: string
  discountPercent: number | null
  discountAmount: number
  finalPrice: number
  isFree: boolean
  description: string
}

interface CouponInvalid {
  valid: false
  message: string
}

// Resolve the submitting account. Every redemption is attributed through
// transactions.metadata.submitter_id, so the per-account check needs this even
// when the caller (a client component previewing a code) doesn't pass one.
async function resolveUserId(explicit?: string | null): Promise<string | null> {
  if (explicit) return explicit
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

export async function validateCoupon(
  code: string,
  tierPrice: number,
  userId?: string | null
): Promise<CouponValid | CouponInvalid> {
  const normalized = code.trim().toUpperCase()

  const sb = createServiceRoleClient()
  const { data: coupon } = await sb
    .from('coupons')
    .select('*')
    .eq('code', normalized)
    .eq('is_active', true)
    .single()

  if (!coupon) return { valid: false, message: 'Invalid coupon code' }

  // Per-account cap — "useable only three times by an account".
  if (coupon.per_user_limit) {
    const account = await resolveUserId(userId)
    if (!account) {
      return {
        valid: false,
        message: 'This coupon is limited to one use per account. Please sign in to use it.',
      }
    }

    const { count } = await sb
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .contains('metadata', { coupon_code: normalized, submitter_id: account })

    if (count && count >= coupon.per_user_limit) {
      return {
        valid: false,
        message:
          coupon.per_user_limit === 1
            ? 'This coupon has already been used by your account.'
            : `This coupon can only be used ${coupon.per_user_limit} times per account.`,
      }
    }
  }

  // Check max_uses (total global usage limit)
  if (coupon.max_uses) {
    const { count } = await sb
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .contains('metadata', { coupon_code: normalized })

    if (count && count >= coupon.max_uses) {
      return { valid: false, message: 'This coupon has reached its usage limit' }
    }
  }

  // Check frequency_days (e.g., once per 7 days)
  if (coupon.frequency_days) {
    const since = new Date(Date.now() - coupon.frequency_days * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await sb
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .contains('metadata', { coupon_code: normalized })
      .gte('created_at', since)

    if (count && count > 0) {
      return {
        valid: false,
        message: `This coupon can only be used once every ${coupon.frequency_days} days. Please try again later.`,
      }
    }
  }

  if (coupon.discount_type === 'free') {
    return {
      valid: true as const,
      code: normalized,
      discountPercent: null,
      discountAmount: tierPrice,
      finalPrice: 0,
      isFree: true,
      description: coupon.description || 'Free Corporate Post',
    }
  }

  // percentage discount
  const discountPercent = coupon.discount_value || 0
  const discountAmount = Math.round(tierPrice * (discountPercent / 100))
  const finalPrice = tierPrice - discountAmount

  return {
    valid: true as const,
    code: normalized,
    discountPercent,
    discountAmount,
    finalPrice,
    isFree: false,
    description: coupon.description || `${discountPercent}% off`,
  }
}
