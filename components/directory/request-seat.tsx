'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { requestSeat } from '@/app/directory/actions/chamber-members'

// Public firm page: the only place a lawyer can ask to join a firm they found
// rather than one that invited them. The firm still approves.
export default function RequestSeat({
  chamberId,
  state,
}: {
  chamberId: string
  state: 'guest' | 'eligible' | 'pending' | 'member'
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (state === 'member') {
    return <span className="text-xs font-semibold text-emerald-600">You&rsquo;re a member of this firm</span>
  }

  if (state === 'pending' || done) {
    return <span className="text-xs font-semibold text-amber-600">Request pending approval</span>
  }

  if (state === 'guest') {
    return (
      <a
        href={`/login?redirect=${encodeURIComponent(`/chamber/${chamberId}`)}`}
        className="text-xs font-semibold text-brand-muted hover:underline"
      >
        Sign in to join this firm
      </a>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await requestSeat(chamberId)
            if (result.error) {
              setError(result.error)
              return
            }
            setDone(true)
            router.refresh()
          })
        }
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand/40 px-3 py-1.5 text-xs font-semibold text-brand-muted transition-colors hover:bg-brand/10 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-3 w-3 animate-spin" />}
        Request to join this firm
      </button>
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </div>
  )
}
