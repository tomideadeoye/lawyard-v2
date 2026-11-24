'use client'

import { PaystackButton } from './paystack-button'
import { CURRENCY } from '@/lib/currency'
import { MAX_SEATS_PER_FIRM, MIN_SEAT_LIMIT } from '@/lib/directory/seats'

/**
 * Firm subscription checkout.
 *
 * One annual fee for the firm. Lawyers under the plan are included — a firm is
 * not charged again for each of its lawyers. The fee buys a number of profile
 * seats (the cap on how many lawyers can be listed under the firm); it is not a
 * unit price, so this deliberately does not multiply by seat count.
 */
export const INCLUDED_SEATS = 15

export function SeatCheckout({
  planName,
  seatPrice,
  chamberId,
  currentSeats,
  usedSeats,
  recommended,
}: {
  planName: string
  seatPrice: number
  chamberId: string
  currentSeats: number
  usedSeats: number
  recommended?: boolean
}) {
  // Never let a renewal cut the firm below the seats it already occupies.
  const included = Math.min(
    MAX_SEATS_PER_FIRM,
    Math.max(INCLUDED_SEATS, MIN_SEAT_LIMIT, usedSeats, currentSeats)
  )
  const overCap = usedSeats > included

  return (
    <div className="w-full space-y-3">
      <div className="rounded-lg border border-stone-200 px-3 py-2.5 text-xs dark:border-white/10">
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground">Total per year</span>
          <span className="text-sm font-semibold tabular-nums text-stone-900 dark:text-neutral-50">
            {CURRENCY.symbol}
            {seatPrice.toLocaleString(CURRENCY.locale)}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
          Covers up to <strong>{included}</strong> lawyer profiles — no individual fee for lawyers under this plan.
          {overCap && ` You currently have ${usedSeats} listed; contact us to extend.`}
        </p>
      </div>

      <PaystackButton
        planName={planName}
        planRole="chamber"
        amount={seatPrice}
        chamberId={chamberId}
        seats={included}
        recommended={recommended}
        label={currentSeats > 0 ? 'Renew the firm plan' : 'Subscribe the firm'}
      />
    </div>
  )
}
