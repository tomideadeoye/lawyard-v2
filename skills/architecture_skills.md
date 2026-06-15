# Project Architecture

**Stack**: Next.js 16 (App Router) + Supabase + Tailwind CSS v4 + Paystack + Resend
**Structure**: Single app, 3 route groups, flat component directory

## Route Groups

```
app/
  (main)/        → lawyard.org (Media Platform)
  admin/         → admin.lawyard.org (Admin Dashboard)
  directory/     → directory.lawyard.ng (Legal Marketplace)
  api/           → Shared API routes
  actions/       → Shared server actions
```

### Main Routes (Media Platform)
| Route | Type | File |
|-------|------|------|
| `/` | Dynamic | `app/(main)/page.tsx` |
| `/insights` | Dynamic | `app/(main)/insights/page.tsx` |
| `/insights/[slug]` | Dynamic | `app/(main)/insights/[slug]/page.tsx` |
| `/brand-press` | Dynamic | `app/(main)/brand-press/page.tsx` |
| `/brand-press/submit` | Dynamic (client) | `app/(main)/brand-press/submit/page.tsx` |
| `/shop` | Static | `app/(main)/shop/page.tsx` |
| `/search` | Dynamic | `app/(main)/search/page.tsx` |
| `/legislations` | SSG | `app/(main)/legislations/page.tsx` |
| `/sitemap.xml` | Dynamic | `app/sitemap.xml/route.ts` |
| `/feed.xml` | Dynamic | `app/feed.xml/route.ts` |

### Admin Routes
| Route | File |
|-------|------|
| `/admin` | `app/admin/page.tsx` |
| `/admin/login` | `app/admin/login/page.tsx` |
| `/admin/content` | `app/admin/content/page.tsx` |
| `/admin/lawyers` | `app/admin/lawyers/page.tsx` |
| `/admin/subscribers` | `app/admin/subscribers/page.tsx` |

### Directory Routes
| Route | File |
|-------|------|
| `/directory` | `app/directory/page.tsx` |
| `/directory/search` | `app/directory/search/page.tsx` |
| `/directory/dashboard` | `app/directory/dashboard/page.tsx` |
| `/directory/dashboard/publish` | `app/directory/dashboard/publish/page.tsx` |

---

## File Organization Patterns

### Server Action Pattern
```typescript
// app/actions/{feature}.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function actionName(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // ... business logic ...
  
  return { success: true, ... }
}
```

### API Route Pattern
```typescript
// app/api/{feature}/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  // ... handle request ...
  return NextResponse.json({ ... })
}
```

### Config File Pattern
```typescript
// lib/{feature}.json — JSON config for pricing, tiers, etc.
// lib/{feature}.ts — TypeScript utilities
```

### Component File Pattern
- Client components: `'use client'` at top
- Server components: default export, async, no state
- UI components: `components/ui/{name}.tsx`
- Feature components: `components/{feature}/{name}.tsx`

---

## Key Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| next | 16.2.0 | Framework |
| @supabase/ssr | latest | Auth + Database |
| @supabase/supabase-js | latest | Supabase client |
| tailwindcss | v4 | Styling |
| lucide-react | ^1.8.0 | Icons |
| class-variance-authority | ^0.7.1 | Variants |
| clsx | ^2.1.1 | Classnames |
| tailwind-merge | ^3.5.0 | Class merging |
| @radix-ui/react-slot | ^1.2.4 | Slot primitive |
| react-hot-toast | latest | Toast notifications |
| @tiptap/react | ^3.26.1 | Rich text editor |
| date-fns | ^4.4.0 | Date manipulation |
