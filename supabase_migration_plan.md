# Lawyard Directory: Supabase Migration Plan

This plan outlines the transition from local JSON-based data to a live **Supabase** backend.

## 1. Database Schema (PostgreSQL)

We will implement a relational structure to ensure data integrity and powerful search capabilities.

### `chambers` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key (Default: `gen_random_uuid()`) |
| `name` | `text` | Name of the chamber |
| `location` | `text` | City/State |
| `focus` | `text` | Main area of practice |
| `image_url` | `text` | URL to chamber logo/image |
| `created_at` | `timestamptz` | Auto-timestamp |

### `specialties` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `text` | Primary Key (e.g., 'corporate-law') |
| `name` | `text` | Display name |
| `slug` | `text` | Unique slug for routing |

### `lawyers` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `name` | `text` | Full Name |
| `role` | `text` | Position (e.g., Senior Partner) |
| `location` | `text` | Primary office location |
| `bio` | `text` | Long-form biography |
| `image_url` | `text` | Profile photo URL |
| `rating` | `numeric` | Average rating (0.0 - 5.0) |
| `reviews_count`| `int` | Number of reviews |
| `email` | `text` | Contact email |
| `phone` | `text` | Contact phone |
| `website` | `text` | Professional website |
| `chamber_id` | `uuid` | Foreign Key -> `chambers.id` |
| `is_featured` | `boolean` | Display in featured sections |
| `education` | `text[]` | Array of degrees/institutions |
| `experience` | `text[]` | Array of career milestones |
| `achievements` | `text[]` | Array of awards/honors |
| `created_at` | `timestamptz` | Auto-timestamp |

### `lawyer_specialties` (Many-to-Many)
| Column | Type | Description |
| :--- | :--- | :--- |
| `lawyer_id` | `uuid` | Foreign Key -> `lawyers.id` |
| `specialty_id` | `text` | Foreign Key -> `specialties.id` |

---

## 2. Migration Steps

### Phase 1: Setup
1. [ ] Finalize Supabase project creation.
2. [ ] Install `@supabase/supabase-js` in the `directory` app.
3. [ ] Configure environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### Phase 2: Schema Deployment
1. [ ] Run the SQL migration script in Supabase SQL Editor.
2. [ ] Generate TypeScript types using `supabase gen types typescript`.

### Phase 3: Data Ingestion
1. [ ] Create a script `scripts/migrate-data.ts` to read JSON files and insert into Supabase.
2. [ ] Verify relationships (ensuring `lawyer.chamber_id` matches the new UUIDs).

### Phase 4: API Refactoring
1. [ ] Update `lib/api.ts` to use the Supabase client instead of `fetch('/api/...')`.
2. [ ] Update API routes (`app/api/*/route.ts`) to serve as light wrappers or deprecate them in favor of direct client calls if appropriate for security.

---

## 3. SQL Initialization Script

```sql
-- Create Chambers
CREATE TABLE chambers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  focus TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Specialties
CREATE TABLE specialties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- Create Lawyers
CREATE TABLE lawyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  location TEXT,
  bio TEXT,
  image_url TEXT,
  rating NUMERIC(3,1) DEFAULT 0.0,
  reviews_count INT DEFAULT 0,
  email TEXT,
  phone TEXT,
  website TEXT,
  chamber_id UUID REFERENCES chambers(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false,
  education TEXT[] DEFAULT '{}',
  experience TEXT[] DEFAULT '{}',
  achievements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Junction Table
CREATE TABLE lawyer_specialties (
  lawyer_id UUID REFERENCES lawyers(id) ON DELETE CASCADE,
  specialty_id TEXT REFERENCES specialties(id) ON DELETE CASCADE,
  PRIMARY KEY (lawyer_id, specialty_id)
);
```
