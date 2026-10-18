'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatNGN } from '@/lib/currency'
import { TIER_LABELS, type PublishingQuota } from '@/lib/directory/publishing'
import { purchaseExtraPost } from '@/app/directory/actions/publishing'

export default function PublishQuotaBanner({ quota }: { quota: PublishingQuota }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tierLabel = TIER_LABELS[quota.tier] || 'Free'
  const period = quota.paid ? 'this month' : 'lifetime'

  async function buy() {
    setPending(true)
    setError(null)
    try {
      const res = await purchaseExtraPost()
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
    <div
      className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        quota.canPublish
          ? 'border-border/50 bg-muted/20'
          : 'border-amber-500/30 bg-amber-500/5'
      }`}
    >
      <div className="text-sm">
        <p className="font-semibold">
          {tierLabel} plan ·{' '}
          <span className="text-muted-foreground font-normal">
            {quota.used}/{quota.limit} posts used {period}
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {quota.canPublish
            ? quota.remaining > 0
              ? `${quota.remaining} post${quota.remaining === 1 ? '' : 's'} remaining.`
              : `Using a purchased extra-post credit (${quota.credits} left).`
            : `You've reached your ${tierLabel} limit. Buy an extra post or upgrade to keep publishing.`}
        </p>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button type="button" size="sm" variant="outline" onClick={buy} disabled={pending}>
          {pending ? 'Redirecting…' : `Buy extra post · ${formatNGN(quota.extraPostPrice)}`}
        </Button>
        <Link href="/pricing">
          <Button type="button" size="sm" variant="ghost">
            Upgrade
          </Button>
        </Link>
      </div>
    </div>
  )
}
