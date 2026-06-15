'use server'

interface CouponValid {
  valid: true
  code: string
  discountPercent: number
  discountAmount: number
  finalPrice: number
  description: string
}

interface CouponInvalid {
  valid: false
  message: string
}

const VALID_COUPONS: Record<string, { discount: number; description: string }> = {
  LAUNCH10: { discount: 10, description: '10% off' },
  LAUNCH20: { discount: 20, description: '20% off' },
}

export async function validateCoupon(code: string, tierPrice: number): Promise<CouponValid | CouponInvalid> {
  const normalized = code.trim().toUpperCase()
  const coupon = VALID_COUPONS[normalized]

  if (!coupon) return { valid: false, message: 'Invalid coupon code' }

  const discountAmount = Math.round(tierPrice * (coupon.discount / 100))
  const finalPrice = tierPrice - discountAmount

  return {
    valid: true as const,
    code: normalized,
    discountPercent: coupon.discount,
    discountAmount,
    finalPrice,
    description: coupon.description,
  }
}
