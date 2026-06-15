'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import {
  LEGISLATIONS,
  ALPHABET,
  type Legislation,
} from '@/lib/legislations'

export default function LegislationsClient() {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter legislations based on search query
  const filteredLegislations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return LEGISLATIONS
    return LEGISLATIONS.filter((act) =>
      act.title.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Group filtered legislations by their first letter
  const grouped = useMemo(() => {
    const groups: Record<string, Legislation[]> = {}
    for (const letter of ALPHABET) {
      const acts = filteredLegislations.filter((l) =>
        l.title.toUpperCase().startsWith(letter),
      )
      if (acts.length > 0) groups[letter] = acts
    }
    return groups
  }, [filteredLegislations])

  const lettersWithContent = useMemo(() => {
    return Object.keys(grouped)
  }, [grouped])

  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="mb-12">
        <h1 className="text-4xl font-black mb-3">Legislations</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Browse the complete catalogue of Nigerian legislation acts. Purchase
          and download PDF copies for your legal library.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md mb-10 group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search laws and acts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-3 bg-background/50 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center hover:text-accent transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Alphabet Index Selector */}
      <div className="flex flex-wrap gap-2 mb-12 pb-6 border-b border-border/40">
        {ALPHABET.map((letter) => {
          const hasContent = lettersWithContent.includes(letter)
          return (
            <a
              key={letter}
              href={hasContent ? `#letter-${letter}` : undefined}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-colors no-underline ${
                hasContent
                  ? 'text-foreground hover:bg-accent/20 hover:text-accent cursor-pointer'
                  : 'text-muted-foreground/20 cursor-default pointer-events-none'
              }`}
            >
              {letter}
            </a>
          )
        })}
      </div>

      {/* Main Grid / Search Result Empty State */}
      {lettersWithContent.length === 0 ? (
        <div className="text-center py-20 bg-accent/5 rounded-2xl border border-dashed border-border/60">
          <p className="text-muted-foreground text-lg mb-2">
            No legislations found matching &ldquo;<span className="text-foreground font-semibold">{searchQuery}</span>&rdquo;
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-bold text-accent hover:underline uppercase tracking-wider"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
          {Object.entries(grouped).map(([letter, acts]) => (
            <div key={letter} id={`letter-${letter}`} className="scroll-mt-24">
              <h2 className="text-2xl font-black mb-4 text-accent border-b border-border/20 pb-1">
                {letter}
              </h2>
              <ul className="space-y-2.5">
                {acts.map((act) => (
                  <li key={act.id}>
                    <Link
                      href={`/legislations/${act.slug}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors leading-relaxed block no-underline"
                    >
                      {act.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
