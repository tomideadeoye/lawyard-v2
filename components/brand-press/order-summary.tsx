'use client'

import { CheckCircle } from 'lucide-react'
import config from '@/lib/brand-press.json'

interface OrderSummaryProps {
  selectedTier: string
  coupon: { code: string; discountPercent: number; discountAmount: number; finalPrice: number } | null
}

export function OrderSummary({ selectedTier, coupon }: OrderSummaryProps) {
  const tier = config.tiers.find((t) => t.id === selectedTier)
  if (!tier) return null

  const finalPrice = coupon?.finalPrice ?? tier.price
  const hasDiscount = coupon && coupon.discountAmount > 0

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-500" />
        Review Order
      </h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Item</span>
          <span className="font-medium">{tier.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Plan</span>
          <span className="font-medium">Brand Press — {tier.name}</span>
        </div>
        <div className="border-t border-border my-2" />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{tier.formatted_price}</span>
        </div>
        {hasDiscount && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({coupon.code})</span>
            <span>-{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(coupon.discountAmount)}</span>
          </div>
        )}
        <div className="border-t border-border pt-2">
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(finalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
