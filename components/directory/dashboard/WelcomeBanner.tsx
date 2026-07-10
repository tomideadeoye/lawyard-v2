'use client'

import { useEffect, useState } from 'react'
import { X, Sparkles } from 'lucide-react'

export default function WelcomeBanner({ createdAt }: { createdAt?: string | null }) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const dismissedFlag = sessionStorage.getItem('welcome_banner_dismissed')
    if (dismissedFlag) setDismissed(true)
  }, [])

  if (dismissed) return null

  const created = createdAt ? new Date(createdAt).getTime() : 0
  const isNew = Date.now() - created < 24 * 60 * 60 * 1000
  if (!isNew) return null

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('welcome_banner_dismissed', 'true')
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-background p-6 mb-6">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">Welcome to Lawyard!</h3>
          <p className="text-sm text-muted-foreground max-w-lg">
            Here&apos;s where you manage your profile, listings, and subscriptions. 
            Start by completing your profile, then explore the directory to find or list legal services.
          </p>
          <div className="flex gap-3 mt-3">
            <a
              href="/directory/dashboard/settings"
              className="text-sm font-medium text-primary hover:underline"
            >
              Complete your profile &rarr;
            </a>
            <a
              href="/directory/search"
              className="text-sm font-medium text-primary hover:underline"
            >
              Browse directory &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
