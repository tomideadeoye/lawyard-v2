'use client'

import { Check, X } from "lucide-react"

interface PricingCardProps {
  name: string
  price: number
  formattedPrice: string
  description?: string
  features: string[]
  recommended?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export function PricingCard({
  name,
  formattedPrice,
  description,
  features,
  recommended = false,
  isSelected = false,
  onClick
}: PricingCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative text-left w-full rounded-2xl border-2 p-6 flex flex-col justify-between transition-all duration-300 transform select-none cursor-pointer group ${
        isSelected
          ? 'border-[#a77c5c] bg-[#a77c5c]/5 shadow-[0_10px_30px_rgba(167,124,92,0.15)] scale-[1.01]'
          : 'border-border/60 bg-card hover:border-[#a77c5c]/50 hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      {/* Top accents */}
      {recommended && (
        <span className="absolute -top-3.5 right-6 bg-gradient-to-r from-[#a77c5c] to-[#c59a78] text-white text-[10px] font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-md z-10 animate-pulse">
          Recommended
        </span>
      )}

      {/* Selected Indicator Badge */}
      {isSelected && (
        <span className="absolute -top-3 -left-3 bg-[#a77c5c] text-white p-1 rounded-full shadow-md z-10">
          <Check className="h-4.5 w-4.5 stroke-[3]" />
        </span>
      )}

      <div>
        {/* Tier Header */}
        <div className="mb-4">
          <span className={`text-xs font-black uppercase tracking-widest ${isSelected ? 'text-[#a77c5c]' : 'text-muted-foreground'}`}>
            {name}
          </span>
          <h3 className="text-3xl font-serif font-black tracking-tight mt-1 text-foreground">
            {formattedPrice}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-2 font-medium leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Divider */}
        <hr className={`my-4 border-t ${isSelected ? 'border-[#a77c5c]/20' : 'border-border/60'}`} />

        {/* Features List */}
        <ul className="space-y-3">
          {features.map((feature, idx) => {
            const isNegative = feature.toLowerCase().startsWith('no ')
            return (
              <li
                key={idx}
                className={`text-xs flex items-start gap-2.5 leading-tight font-medium ${
                  isNegative
                    ? 'text-muted-foreground/60 line-through'
                    : 'text-foreground/95'
                }`}
              >
                {isNegative ? (
                  <X className="h-4 w-4 shrink-0 text-destructive/70 mt-0.5" strokeWidth={3} />
                ) : (
                  <Check className="h-4 w-4 shrink-0 text-[#a77c5c] mt-0.5" strokeWidth={3} />
                )}
                <span>{feature}</span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Select button decoration inside the card */}
      <div className="mt-6 pt-2">
        <div
          className={`w-full py-2.5 rounded-xl text-center text-xs font-extrabold uppercase tracking-widest transition-all duration-300 ${
            isSelected
              ? 'bg-[#a77c5c] text-white shadow-sm'
              : 'bg-secondary text-secondary-foreground group-hover:bg-[#a77c5c]/10 group-hover:text-[#a77c5c]'
          }`}
        >
          {isSelected ? 'Selected Plan' : 'Select Plan'}
        </div>
      </div>
    </button>
  )
}
