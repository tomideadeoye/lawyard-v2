'use client'

import { X, Check } from 'lucide-react'
import config from '@/lib/brand-press.json'

interface TierComparisonModalProps {
  open: boolean
  onClose: () => void
  onSelect: (tierId: string) => void
  selectedTier: string
}

export function TierComparisonModal({ open, onClose, onSelect, selectedTier }: TierComparisonModalProps) {
  if (!open) return null

  const allFeatures = [
    'Published on lawyard.org',
    'Brand Press category listing',
    'Homepage placement (middle section)',
    'Priority homepage placement (featured top)',
    'Social media distribution',
    'Newsletter distribution',
    'Guaranteed reach',
    'Brand attribution',
    'Premium positioning',
  ]

  const tierFeatureMap: Record<string, string[]> = {
    basic: ['Published on lawyard.org', 'Brand Press category listing'],
    core: ['Published on lawyard.org', 'Brand Press category listing', 'Homepage placement (middle section)', 'Social media distribution', 'Guaranteed reach', 'Brand attribution'],
    pro: ['Published on lawyard.org', 'Brand Press category listing', 'Homepage placement (middle section)', 'Priority homepage placement (featured top)', 'Social media distribution', 'Newsletter distribution', 'Guaranteed reach', 'Brand attribution', 'Premium positioning'],
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">Compare Plans</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-6 font-medium text-muted-foreground w-1/3">Features</th>
                {config.tiers.map((tier) => (
                  <th key={tier.id} className={`py-3 px-4 text-center font-bold ${tier.recommended ? 'text-accent' : ''}`}>
                    <div>{tier.name}</div>
                    <div className="text-lg font-black mt-1">{tier.formatted_price}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allFeatures.map((feature) => (
                <tr key={feature} className="border-b border-border/50">
                  <td className="py-3 pr-6 text-muted-foreground">{feature}</td>
                  {config.tiers.map((tier) => {
                    const has = tierFeatureMap[tier.id]?.includes(feature)
                    return (
                      <td key={tier.id} className="py-3 px-4 text-center">
                        {has ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 p-6 border-t border-border justify-end">
          {config.tiers.map((tier) => (
            <button
              key={tier.id}
              type="button"
              onClick={() => { onSelect(tier.id); onClose() }}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                selectedTier === tier.id
                  ? 'bg-accent text-accent-foreground'
                  : tier.recommended
                    ? 'bg-accent/10 text-accent hover:bg-accent/20'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {selectedTier === tier.id ? 'Selected' : `Choose ${tier.name}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
