'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { verifyPayment } from '@/app/directory/actions/payments'

export function PaymentMessage() {
  const params = useSearchParams()
  const payment = params.get('payment')
  const reference = params.get('reference') || params.get('trxref')
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'idle'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (payment === 'completed' && reference) {
      setStatus('verifying')
      verifyPayment(reference).then((result) => {
        if (result.success) {
          setStatus('success')
          setMessage('Payment verified! Your subscription has been upgraded.')
        } else {
          setStatus('failed')
          setMessage(result.error || 'Payment verification failed. Contact support if you were charged.')
        }
      })
    }
  }, [payment, reference])

  if (payment === 'completed') {
    if (status === 'verifying') {
      return (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-4 mb-6 text-sm font-medium">
          Verifying your payment...
        </div>
      )
    }
    if (status === 'success') {
      return (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-4 mb-6 text-sm font-medium">
          {message}
        </div>
      )
    }
    if (status === 'failed') {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm font-medium">
          {message}
        </div>
      )
    }
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
