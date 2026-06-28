'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowUpRight } from 'lucide-react'

interface BillingPlanCardProps {
  tier: string
  status: string | null
  expiresAt: string | null
}

const TIER_MAP: Record<string, { name: string; description: string }> = {
  free: { name: 'Free', description: 'Basic directory listing' },
  premium_single: { name: 'Premium (Single)', description: 'Featured listing for 365 days' },
  premium_package: { name: 'Premium (Package)', description: '15 featured listings with maximum visibility' },
  enterprise: { name: 'Enterprise', description: 'Comprehensive chamber visibility' },
}

export function BillingPlanCard({ tier, status, expiresAt }: BillingPlanCardProps) {
  const plan = TIER_MAP[tier] ?? TIER_MAP.free
  const isActive = status === 'active'
  const hasPlan = tier !== 'free' && tier !== ''

  return (
    <Card className="border border-border/40 bg-card/45 backdrop-blur-md shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current Plan</CardTitle>
          {hasPlan && (
            <Badge variant={isActive ? 'default' : 'outline'}>
              {isActive ? 'Active' : status === 'past_due' ? 'Past Due' : 'Inactive'}
            </Badge>
          )}
        </div>
        <CardDescription>Your directory listing plan and billing details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-2xl font-bold">{plan.name}</p>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </div>
          {hasPlan && (
            <Badge variant="secondary" className="text-xs font-semibold">
              {plan.name}
            </Badge>
          )}
        </div>

        {!hasPlan && (
          <p className="text-sm text-muted-foreground">
            You are currently on the free plan. Upgrade to a paid plan to get featured listings,
            priority search placement, and more visibility.
          </p>
        )}

        {expiresAt && isActive && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground border-t border-border/40 pt-3">
            <span className="font-medium">Expires:</span>
            <span>{new Date(expiresAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link
            href="/directory/pricing"
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            {hasPlan ? 'Change Plan' : 'View Plans'}
            <ArrowUpRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
