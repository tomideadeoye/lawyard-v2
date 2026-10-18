'use client'

import { useState } from 'react'
import { Tags } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { validateCoupon } from '@/app/actions/validate-coupon'

interface CouponInputProps {
  onValidated: (code: string) => void
  onClear: () => void
  tierPrice?: number
  label?: string
}

export function CouponInput({ onValidated, onClear, tierPrice = 0, label = 'Coupon Code' }: CouponInputProps) {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<{ code: string; isFree: boolean; description: string } | null>(null)
  const [error, setError] = useState('')
  const [applying, setApplying] = useState(false)

  const handleApply = async () => {
    if (!code.trim()) return
    setApplying(true)
    setError('')
    setResult(null)

    const r: any = await validateCoupon(code, tierPrice)
    if (r.valid && r.isFree) {
      setResult({ code: r.code, isFree: true, description: r.description })
      onValidated(r.code)
    } else if (r.valid && !r.isFree) {
      setError('This coupon requires payment. Use a free coupon.')
    } else {
      setError(r.message)
    }
    setApplying(false)
  }

  const handleClear = () => {
    setCode('')
    setResult(null)
    setError('')
    onClear()
  }

  return (
    <div className="space-y-3">
      <label className="text-xs uppercase tracking-wider font-bold flex items-center gap-1.5">
        <Tags className="h-3.5 w-3.5" /> {label}
      </label>
      {result ? (
        <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900">
          <div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{result.description}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">Code: {result.code}</p>
          </div>
          <button type="button" onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground underline">Remove</button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={handleApply} disabled={applying || !code.trim()}>
            {applying ? '...' : 'Apply'}
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  )
}
