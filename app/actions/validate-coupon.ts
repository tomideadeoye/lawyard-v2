'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'

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

export async function validateCoupon(code: string, tierPrice: number): Promise<CouponValid | CouponInvalid> {
  const normalized = code.trim().toUpperCase()

  const sb = createServiceRoleClient()
  const { data: coupon } = await sb
    .from('coupons')
    .select('*')
    .eq('code', normalized)
    .eq('is_active', true)
    .single()

  if (!coupon) return { valid: false, message: 'Invalid coupon code' }

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
