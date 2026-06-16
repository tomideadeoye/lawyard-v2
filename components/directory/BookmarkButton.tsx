'use client'

import { useState } from 'react'
import { toggleBookmark } from '@/app/directory/actions/bookmarks'

interface BookmarkButtonProps {
  lawyerId: string
  initialBookmarked?: boolean
  className?: string
}

export default function BookmarkButton({ lawyerId, initialBookmarked = false, className = '' }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)

  async function handleClick() {
    const prev = bookmarked
    setBookmarked(!bookmarked)
    const result = await toggleBookmark(lawyerId)
    if (result.error) setBookmarked(prev)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center transition-all duration-200 ${
        bookmarked
          ? 'text-accent scale-110'
          : 'text-muted-foreground/50 hover:text-muted-foreground'
      } ${className}`}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark this profile'}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this profile'}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill={bookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}
