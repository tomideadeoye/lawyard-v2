'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { redeemInvite } from '@/app/directory/actions/chamber-members'

export default function AcceptInvite({ token }: { token: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const accept = () => {
    setError(null)
    startTransition(async () => {
      const result = await redeemInvite(token)
      if (result.error) {
        setError(result.error)
        return
      }
      router.push('/dashboard/chamber')
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={accept}
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Accept seat
      </button>
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
