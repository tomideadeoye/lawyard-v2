'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

export default function SearchForm({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const [value, setValue] = React.useState(initialQuery)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-2xl">
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search articles by keyword..."
        className="w-full pl-12 pr-4 py-4 rounded-xl border border-border/40 bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-[#a77c5c]/40 focus:border-[#a77c5c]/60 transition-all"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#111129] hover:bg-[#1e1e4a] text-white font-extrabold text-xs uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all"
      >
        Search
      </button>
    </form>
  )
}
