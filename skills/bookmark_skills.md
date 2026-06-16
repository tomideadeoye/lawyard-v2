# Bookmark & Dashboard Role-Aware Patterns

## Bookmark Feature (Next.js + Supabase)

### Table Design
```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lawyer_id UUID REFERENCES lawyers(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lawyer_id)
);
-- Enable RLS with SELECT/INSERT/DELETE policies scoped to auth.uid()
```

### Server Action (`app/directory/actions/bookmarks.ts`)
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleBookmark(lawyerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('bookmarks').select('id')
    .eq('user_id', user.id).eq('lawyer_id', lawyerId)
    .maybeSingle()

  if (existing) {
    await supabase.from('bookmarks').delete().eq('id', existing.id)
    revalidatePath('/directory', 'layout')
    return { bookmarked: false }
  }

  await supabase.from('bookmarks').insert({ user_id: user.id, lawyer_id: lawyerId })
  revalidatePath('/directory', 'layout')
  return { bookmarked: true }
}
```

### Client Component (`BookmarkButton.tsx`)
```typescript
'use client'
import { useState } from 'react'
import { toggleBookmark } from '@/app/directory/actions/bookmarks'

export default function BookmarkButton({ lawyerId, initialBookmarked = false, className = '' }) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)

  async function handleClick() {
    const prev = bookmarked
    setBookmarked(!bookmarked)                // optimistic
    const result = await toggleBookmark(lawyerId)
    if (result.error) setBookmarked(prev)     // revert on error
  }

  return (
    <button onClick={handleClick} title={bookmarked ? 'Remove bookmark' : 'Bookmark this profile'}>
      <svg viewBox="0 0 24 24" className="w-5 h-5"
        fill={bookmarked ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth={2}>
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}
```

### Integration in Server Components
1. Fetch user's bookmarked lawyer IDs: `supabase.from('bookmarks').select('lawyer_id').eq('user_id', user.id)`
2. Pass `initialBookmarked={bookmarkedIds.includes(lawyer.id)}` to each `BookmarkButton`
3. For profile pages, also fetch count: `supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('lawyer_id', id)`
4. Dashboard: join with lawyer data — `supabase.from('bookmarks').select('created_at, lawyer:lawyers(id, name, role, location, ...)').eq('user_id', user.id)`

## Dashboard Role-Aware Pattern

Single `/directory/dashboard/page.tsx` server component:
1. Fetch `profiles.role` — check `isLawyer = role === 'lawyer' || role === 'chamber'`
2. Use ternary `{isLawyer ? <LawyerView /> : <ClientView />}`
3. Share common queries (profile, bookmarks, transactions) across both branches
4. Sidebar nav in `layout.tsx` also checks role for conditional links

## Footer Hiding on Dashboard Pages
- `'use client'` `FooterWrapper` component calls `usePathname()`
- Returns `null` when pathname starts with `/directory/dashboard`
- Layout wraps `<FooterWrapper />` instead of `<Footer />`
- Avoids route groups (Turbopack resolves imports relative to actual file paths, not virtual URL paths)
