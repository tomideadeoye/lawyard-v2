'use client'

import { useState } from 'react'
import { formatNGN } from '@/lib/currency'
import { enrollInCourse } from '@/app/directory/actions/courses'

export default function EnrollButton({ slug, amount }: { slug: string; amount: number }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function go() {
    setPending(true)
    setError(null)
    try {
      const res = await enrollInCourse(slug)
      if (res.authorization_url) {
        window.location.href = res.authorization_url
        return
      }
      setError(res.error || 'Could not start checkout.')
    } catch {
      setError('Could not start checkout.')
    }
    setPending(false)
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className="w-full sm:w-auto px-8 py-3 rounded-lg bg-[#a77c5c] hover:bg-[#906b4e] disabled:opacity-50 text-white text-sm font-bold transition-colors"
      >
        {pending ? 'Redirecting…' : `Enrol · ${formatNGN(amount)}`}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
