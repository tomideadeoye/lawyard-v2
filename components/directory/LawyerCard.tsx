'use client'

import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'

interface LawyerCardProps {
  id: string
  name: string
  role: string
  image?: string
  specialties: string[]
  rating: number
  reviews: number
  location?: string
  experience?: string
  verified?: boolean
  featured?: boolean
  variant?: 'grid' | 'list'
  isAuthenticated?: boolean
  bookmarked?: boolean
  onBookmark?: () => void
}

export function LawyerCard({
  id, name, role, image, specialties, rating, reviews,
  location, experience, verified, featured, variant = 'grid',
  isAuthenticated: _isAuthenticated, bookmarked: _bookmarked, onBookmark: _onBookmark,
}: LawyerCardProps) {
  if (variant === 'list') {
    return (
      <Link href={`/lawyer/${id}`} className="group block no-underline">
        <article className="flex items-start gap-5 p-5 bg-card border border-border/60 rounded-xl hover:border-accent/50 hover:shadow-lg transition-all">
          <Avatar src={image} name={name} size="md" className="rounded-lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{name}</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-500 mt-0.5">{role}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent/15 text-accent uppercase tracking-wider">★ Featured</span>}
                {experience && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">{experience}</span>}
                {verified && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">✓ Verified</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {specialties.slice(0, 3).map(s => (
                <span key={s} className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent uppercase tracking-wider">{s}</span>
              ))}
              {specialties.length > 3 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">+{specialties.length - 3}</span>}
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span>⭐ {rating}{reviews > 0 ? ` (${reviews})` : ''}</span>
              {location && <span>📍 {location}</span>}
            </div>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <div className="flex flex-col p-5 bg-card border border-border/60 rounded-xl hover:border-accent/50 hover:shadow-lg transition-all h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <Avatar src={image} name={name} size="sm" className="rounded-lg" />
        <div className="flex items-center gap-1.5 shrink-0">
          {featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent/15 text-accent uppercase tracking-wider">★ Featured</span>}
          {experience && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">{experience}</span>}
          {verified && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">✓ Verified</span>}
        </div>
      </div>

      <div className="mb-3">
        <h3 className="font-bold text-foreground">{name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{role}</p>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {specialties.slice(0, 3).map(s => (
          <span key={s} className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent uppercase tracking-wider">{s}</span>
        ))}
        {specialties.length > 3 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">+{specialties.length - 3}</span>}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border/50 pt-3 mt-auto">
        <span>⭐ {rating}{reviews > 0 ? ` (${reviews})` : ''}</span>
        {location && <span>📍 {location}</span>}
      </div>

      <Link href={`/lawyer/${id}`} className="mt-3 block w-full text-center py-2 rounded-lg bg-accent text-accent-foreground text-sm font-bold hover:bg-accent/90 transition-colors no-underline">
        View Full Portfolio
      </Link>
    </div>
  )
}
