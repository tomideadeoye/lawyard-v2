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
1. [x] Finalize Supabase project creation.
2. [x] Install `@supabase/supabase-js` in the `directory` app.
3. [x] Configure environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### Phase 2: Schema Deployment
1. [x] Run the SQL migration script in Supabase SQL Editor.
2. [ ] Generate TypeScript types using `supabase gen types typescript`.

### Phase 3: Data Ingestion
1. [x] Create a script `scripts/migrate-data.ts` to read JSON files and insert into Supabase.
2. [x] Verify relationships (ensuring `lawyer.chamber_id` matches the new UUIDs).

### Phase 4: API Refactoring
1. [x] Update `lib/api.ts` to use the Supabase client instead of `fetch('/api/...')`.
2. [x] Update API routes (`app/api/*/route.ts`) to serve as light wrappers.
3. [x] Deprecate local JSON data (`apps/directory/data/`).

### Phase 5: Advanced Features & Identity
1. [x] Implement Secure Dashboard (`/dashboard`).
2. [x] Integrate Official Brand Assets (Brown Logo).
3. [x] Decouple Site Configuration (`site-config.json`).
4. [x] Deploy Client Needs broadcast system.

---

## 3. SQL Initialization Script (v2 - Final)

```sql
-- Core Directory Tables
CREATE TABLE chambers (...);
CREATE TABLE specialties (...);
CREATE TABLE lawyers (...);
CREATE TABLE lawyer_specialties (...);

-- Business & Interaction Tables
CREATE TABLE IF NOT EXISTS client_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  budget_range TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles & RBAC
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('lawyer', 'client', 'admin')) DEFAULT 'client',
  full_name TEXT,
  avatar_url TEXT
);
```
