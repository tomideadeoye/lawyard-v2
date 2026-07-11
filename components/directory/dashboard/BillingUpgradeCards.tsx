'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, X, ArrowUpRight } from 'lucide-react'
import type { Plan, PlansByRole } from '@/app/directory/actions/plans'

interface BillingUpgradeCardsProps {
  currentTier: string
  userRole: string
  plans: PlansByRole
}

const TIER_RANK: Record<string, number> = {
  free: 0,
  premium_single: 1,
  premium_package: 2,
  enterprise: 3,
}

const PLAN_TIER_MAP: Record<string, string> = {
  'Premium (Package)': 'premium_package',
  'Premium (Single)': 'premium_single',
  'Free': 'free',
  'Free Access': 'free',
  'Enterprise': 'enterprise',
  'Basic': 'free',
}

function toTierKey(name: string): string {
  return PLAN_TIER_MAP[name] ?? name.toLowerCase().replace(/\s+/g, '_')
}

export function BillingUpgradeCards({ currentTier, userRole, plans }: BillingUpgradeCardsProps) {
  const role = userRole === 'chamber' ? 'chamber' : userRole === 'client' ? 'client' : 'lawyer'
  const rolePlans: Plan[] = plans[role] ?? []
  const currentRank = TIER_RANK[currentTier] ?? 0

  if (rolePlans.length === 0) return null

  return (
    <Card className="border border-border/40 bg-card/45 backdrop-blur-md shadow-sm">
      <CardHeader>
        <CardTitle>Available Plans</CardTitle>
        <CardDescription>Compare plans and upgrade for more visibility</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rolePlans.map((plan) => {
            const planTier = toTierKey(plan.name)
            const rank = TIER_RANK[planTier] ?? -1
            const isCurrent = planTier === currentTier || (currentTier === '' && planTier === 'free')
            const isUpgrade = rank > currentRank
            const hasPrice = parseFloat(plan.price.replace('$', '')) > 0

            let scenario: 'current' | 'upgrade' | 'downgrade' | 'subscribe'
            if (isCurrent) scenario = 'current'
            else if (isUpgrade) scenario = 'upgrade'
            else if (hasPrice) scenario = 'downgrade'
            else scenario = 'subscribe'

            const buttonText = {
              current: 'Current Plan',
              upgrade: 'Upgrade',
              downgrade: 'Downgrade',
              subscribe: 'Subscribe',
            }[scenario]

            return (
              <Card
                key={plan.id ?? plan.name}
                className={`relative flex flex-col border-2 transition-all ${
                  plan.recommended
                    ? 'border-primary shadow-md'
                    : isCurrent
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border/60 hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                {plan.recommended && (
                  <div className="bg-primary text-primary-foreground text-xs font-semibold text-center py-1.5 rounded-t-lg tracking-wide">
                    Recommended
                  </div>
                )}

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                  </CardDescription>
                  {plan.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{plan.description}</p>
                  )}
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-2">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        {f.included ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" strokeWidth={3} />
                        ) : (
                          <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 mt-0.5" strokeWidth={3} />
                        )}
                        <span className={f.included ? 'text-foreground/90' : 'text-muted-foreground/50 line-through'}>
                          {f.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-0">
                  {scenario === 'current' ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button className="w-full" variant={plan.recommended ? 'default' : 'secondary'} asChild>
                      <Link href="/pricing">
                        {buttonText}
                        <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
