# Supabase Patterns

## Client Setup

Three client factories in `lib/supabase/`:

### Server Client (`server.ts`)
```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
// Used in: server components, server actions, API routes
// Cookie handling: cookies() from next/headers
```

### Browser Client (`client.ts`)
```typescript
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
// Used in: client components (rare)
```

### Admin Auth (`admin-auth.ts`)
```typescript
// Checks auth.getUser() + profiles.role === 'admin'
// Redirects on failure
```

## Storage

### Buckets
| Bucket | Used For | Pattern |
|--------|----------|---------|
| `avatars` | User profile avatars | Upload via server action |
| `brand-press` | Brand press featured images | Upload via API route |

### Upload Pattern (API Route)
```typescript
// POST /api/upload/{bucket}
const formData = await req.formData()
const file = formData.get('image') as File

// Validate
if (!file.type.startsWith('image/')) return error
if (file.size > 500 * 1024) return error

// Convert to buffer (Next.js serialization fix)
const buffer = Buffer.from(await file.arrayBuffer())

// Upload with upsert
const { error } = await supabase.storage
  .from('brand-press')
  .upload(filePath, buffer, { contentType: file.type, upsert: true })

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('brand-press')
  .getPublicUrl(filePath)
```

### Upload Pattern (Server Action)
```typescript
'use server'
// Same as API route but called from form action
// File path: `{userId}-{timestamp}.{ext}`
```

## Database Queries

### Server Component Fetching
```typescript
const supabase = await createClient()
const { data: articles } = await supabase
  .from('articles')
  .select(`id, title, slug, content, featured_image, ...author:profiles(full_name, avatar_url)`)
  .eq('article_type', 'brand_press')
  .order('created_at', { ascending: false })
```

### Field Selection Constants
```typescript
const articleFields = `id, title, slug, excerpt, featured_image, created_at, published_at,
  category, article_type, tier, brand_name,
  author:profiles(full_name, avatar_url)`
```

## Auth

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { error: 'Not authenticated' }
```

## Migrations

Location: `supabase/migrations/`

Naming: `YYYYMMDDHHMMSS_description.sql`

Pattern:
```sql
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('basic', 'core', 'pro'));
```
