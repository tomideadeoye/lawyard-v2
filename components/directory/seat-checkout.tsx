'use client'

import { useMemo, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { PaystackButton } from './paystack-button'
import { CURRENCY } from '@/lib/currency'
import { MAX_SEATS_PER_FIRM, clampSeats } from '@/lib/directory/seats'

// Firm plans are billed per seat, so the price on the card is a unit price. The
// total has to be visible before checkout — a per-seat plan that only reveals the
// multiplication on a Paystack page is how firms end up disputing a charge.
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
  // Never offer fewer seats than the firm already occupies: buying "1 seat" while
  // four lawyers sit in the firm would sell a downgrade disguised as a renewal.
  const floor = Math.max(1, usedSeats)
  const [seats, setSeats] = useState(() => clampSeats(Math.max(floor, currentSeats)))

  const total = useMemo(() => seatPrice * seats, [seatPrice, seats])

  const step = (delta: number) => setSeats((s) => clampSeats(s + delta))

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-stone-200 px-2 py-1.5 dark:border-white/10">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={seats <= floor}
          aria-label="One fewer seat"
          className="flex h-8 w-8 items-center justify-center rounded-md text-stone-600 transition-colors hover:bg-stone-100 disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-white/5"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <div className="text-center leading-tight">
          <div className="text-sm font-semibold tabular-nums text-stone-900 dark:text-neutral-50">
            {seats} {seats === 1 ? 'seat' : 'seats'}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {usedSeats} in use
          </div>
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          disabled={seats >= MAX_SEATS_PER_FIRM}
          aria-label="One more seat"
          className="flex h-8 w-8 items-center justify-center rounded-md text-stone-600 transition-colors hover:bg-stone-100 disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-white/5"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-baseline justify-between text-xs text-muted-foreground">
        <span>Total per year</span>
        <span className="text-sm font-semibold tabular-nums text-stone-900 dark:text-neutral-50">
          {CURRENCY.symbol}
          {total.toLocaleString(CURRENCY.locale)}
        </span>
      </div>

      <PaystackButton
        planName={planName}
        planRole="chamber"
        amount={total}
        chamberId={chamberId}
        seats={seats}
        recommended={recommended}
        label={seats === currentSeats ? 'Renew seats' : `Buy ${seats} ${seats === 1 ? 'seat' : 'seats'}`}
      />
    </div>
  )
}
