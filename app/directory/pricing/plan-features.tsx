'use client'

import { useState } from 'react'
import { Check, Minus } from 'lucide-react'

type Feature = { name: string; included: boolean }

function FeatureItem({ name, included, className }: Feature & { className?: string }) {
  // Excluded features use a muted dash, not a red cross: red means "error" everywhere
  // else in the product, and a plan not carrying something is not an error.
  return (
    <li className={`flex items-start gap-2.5 text-[13px] leading-5 ${className ?? ''}`}>
      {included ? (
        <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2.75} />
      ) : (
        <Minus className="mt-[3px] h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-neutral-600" strokeWidth={2.75} />
      )}
      <span className={included ? 'text-stone-700 dark:text-neutral-300' : 'text-stone-500 dark:text-neutral-400'}>
        {name}
      </span>
    </li>
  )
}

type Breakpoint = 'sm' | 'lg'

// Collapse only while the plans are a single stacked column. Once they sit side by
// side the full list is the point of the page, so nothing is hidden.
const BP: Record<Breakpoint, { row: string; button: string }> = {
  sm: { row: 'hidden sm:flex', button: 'sm:hidden' },
  lg: { row: 'hidden lg:flex', button: 'lg:hidden' },
}

/**
 * Phones get the first six rows and an explicit "show all" control; the full list
 * is ~1,600px of scroll when three tiers stack. The hidden state is CSS-only above
 * the breakpoint, so there is no layout shift after hydration and nothing to
 * mismatch on the server.
 */
export function PlanFeatures({
  features,
  visibleOnMobile = 6,
  collapseFrom = 'lg',
}: {
  features: Feature[]
  visibleOnMobile?: number
  collapseFrom?: Breakpoint
}) {
  const [expanded, setExpanded] = useState(false)
  const hidden = Math.max(features.length - visibleOnMobile, 0)
  const bp = BP[collapseFrom]

  return (
    <>
      <ul className="space-y-2.5">
        {features.map((feature, i) => (
          <FeatureItem
            key={feature.name}
            {...feature}
            className={!expanded && i >= visibleOnMobile ? bp.row : undefined}
          />
        ))}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={`mt-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted transition-colors hover:text-brand ${bp.button}`}
        >
          {expanded ? 'Show fewer' : `Show all ${features.length} features`}
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            aria-hidden="true"
            className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </>
  )
}
