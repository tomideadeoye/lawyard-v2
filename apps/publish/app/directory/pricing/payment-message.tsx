'use client'

import { useSearchParams } from 'next/navigation'

export function PaymentMessage() {
  const params = useSearchParams()
  const payment = params.get('payment')

  if (payment === 'completed') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-4 mb-6 text-sm font-medium">
        Payment completed successfully! Your subscription has been upgraded.
      </div>
    )
  }

  if (payment === 'cancelled') {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg p-4 mb-6 text-sm font-medium">
        Payment was cancelled. No charges were made.
      </div>
    )
  }

  return null
}
