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

### Admin Auth (`admin-auth.ts`) + JWT Role Claims

**Pattern**: Store `role` in `auth.users.raw_app_meta_data` so the JWT carries it. Proxy reads from token directly — no DB round-trip on every request.

#### Migration `20260615000004_sync_role_to_jwt.sql`:
```sql
-- Trigger syncs profiles.role → auth.users.raw_app_meta_data
CREATE OR REPLACE FUNCTION public.sync_role_to_app_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_role_to_app_metadata_trigger
AFTER INSERT OR UPDATE OF role ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_role_to_app_metadata();
```

#### Proxy (`proxy.ts`) — reads from JWT:
```typescript
if (user.app_metadata?.role !== 'admin') {
  // redirect to /admin/login
}
```

**Note**: `middleware.ts` was renamed to `proxy.ts` in Next.js 16 (file convention changed). Run `supabase db push` to apply the migration.

### Service Role Client (`server.ts`)
```typescript
import { createServiceRoleClient } from '@/lib/supabase/server'
const sbAdmin = createServiceRoleClient()
// Uses SUPABASE_SERVICE_ROLE_KEY from env
// Bypasses RLS — for server-side writes only (not exposed to client)
// Used in: brand-press submission, admin operations
// Never use in: client components, API routes called by browsers
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

### Making Columns Nullable
```sql
ALTER TABLE articles ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE transactions ALTER COLUMN user_id DROP NOT NULL;
```

### Adding Check Constraints
```sql
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('basic', 'core', 'pro'));
```

### Unique Constraints
```sql
-- transactions.reference has UNIQUE constraint to prevent duplicate payment refs
CREATE TABLE transactions (
  reference TEXT UNIQUE NOT NULL,
  ...
);
```

Pattern:
```sql
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS brand_name TEXT;
```
