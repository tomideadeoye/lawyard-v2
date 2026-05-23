# Lawyard v2 - Comprehensive Project Structure

## 1. Overall Project Structure (Monorepo Setup)

**Root Path:** `/Users/mac/Documents/GitHub/lawyard-v2`

```text
lawyard-v2/
├── apps/
│   ├── control-plane/          # Admin dashboard (port 3000)
│   └── directory/              # Public-facing directory (port 3001)
├── packages/
│   ├── api/                    # @repo/api - Zod schemas, types
│   ├── ui/                     # @repo/ui - Shared Shadcn components, styles
│   ├── eslint-config/          # Shared ESLint config
│   └── typescript-config/      # Shared TS config
├── supabase/                   # Supabase local dev config
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # Workspace: apps/*, packages/*
├── turbo.json                  # Turborepo pipeline config
├── schema.sql                  # Full database schema
├── SYSTEM_ARCHITECTURE.md      # Architecture docs
├── supabase_migration_plan.md  # Migration plan from JSON to Supabase
├── next.config.js              # Next.js config
└── vercel.json                 # Vercel deployment config
```

### Key Configuration Files
* **[package.json](file:///Users/mac/Documents/GitHub/lawyard-v2/package.json)** - Root pnpm workspace config, Turborepo orchestration, and Supabase CLI scripts.
* **[pnpm-workspace.yaml](file:///Users/mac/Documents/GitHub/lawyard-v2/pnpm-workspace.yaml)** - Declares workspace apps and packages.
* **[turbo.json](file:///Users/mac/Documents/GitHub/lawyard-v2/turbo.json)** - Defines build pipelines, declaring Supabase environment variables as globals.

**Ports:**
* **Control Plane (Admin Dashboard):** Port `3000`
* **Directory (Public-Facing Application):** Port `3001`

---

## 2. Control Plane / Admin Dashboard Structure

**Location:** `apps/control-plane/`

```text
control-plane/
├── app/
│   ├── actions.ts              # Server actions: verifyLawyer, rejectLawyer
│   ├── layout.tsx              # Root layout (Geist fonts)
│   ├── page.tsx                # Main admin dashboard page
│   ├── globals.css             # CSS
│   └── fonts/
├── lib/
│   ├── api.ts                  # Admin API: getAdminStats, getPendingLawyers, getRecentSubscribers
│   └── supabase/
│       ├── admin.ts            # createAdminClient (service role client)
│       ├── client.ts           # createBrowserClient
│       └── server.ts           # createServerClient (cookie-based client)
└── package.json                # Dependencies: @repo/api, @repo/ui, @supabase/*
```

### Key Modules and Logic
* **Dashboard Page (`app/page.tsx`):**
  * Displays metrics: Total Experts, Pending Review, Institutional Chambers, Active Media Assets, Newsletter Reach.
  * Verification Pipeline: Lists lawyers with status `pending`, allowing quick action with "Verify Profile" or "Reject".
  * Newsletter Subscribers: Shows the 10 most recent subscribers.
  * System Integration: Includes control interfaces for "Sync LawyardAI Engine" and "Broadcast Weekly Digest".
* **Server Actions (`app/actions.ts`):**
  * Performs server-side tasks such as `verifyLawyer` and `rejectLawyer` via server actions.
* **Admin API (`lib/api.ts`):**
  * Functions: `getAdminStats()`, `getPendingLawyers()`, `getRecentSubscribers()`, `verifyLawyerAction(id)`, `rejectLawyerAction(id)`.

---

## 3. Directory App Structure

**Location:** `apps/directory/`

```text
directory/
├── app/
│   ├── page.tsx                # Homepage (hero, featured listings, CTA)
│   ├── layout.tsx              # Root layout (Header + Footer + ThemeProvider)
│   ├── globals.css
│   ├── about/                  # About page
│   ├── actions/
│   │   ├── content.ts          # publishArticle, publishPodcast (server actions)
│   │   └── newsletter.ts       # subscribeToNewsletter
│   ├── add-listing/            # Listing creation wizard (lawyer/chamber/corporate/client-need)
│   ├── api/
│   │   ├── chambers/route.ts   # GET /api/chambers?featured=true
│   │   ├── lawyers/
│   │   │   ├── route.ts        # GET /api/lawyers?featured=true&specialty=
│   │   │   └── [id]/route.ts   # GET /api/lawyers/:id
│   │   └── specialties/route.ts # GET /api/specialties
│   ├── auth/callback/route.ts  # OAuth callback handler
│   ├── dashboard/
│   │   ├── page.tsx            # User dashboard (profile, listing, onboarding)
│   │   └── publish/
│   │       └── page.tsx        # Content Studio (article & podcast forms)
│   ├── insights/page.tsx       # Coming Soon placeholder
│   ├── knowledge/
│   │   ├── page.tsx            # Knowledge Base landing
│   │   ├── [slug]/page.tsx     # Individual article page
│   │   └── category/[id]/page.tsx  # Articles by category
│   ├── lawyer/[id]/
│   │   ├── page.tsx            # Lawyer profile page
│   │   └── profile.module.css
│   ├── login/
│   │   ├── actions.ts          # login, loginWithMagicLink, signup, signOut
│   │   ├── page.tsx            # Login form page
│   │   └── success/page.tsx    # Post-registration confirmation
│   ├── search/
│   │   ├── page.tsx            # Search results with filters
│   │   └── search.module.css
│   └── signup/page.tsx         # Signup page with role selection
├── components/
│   ├── auth/                   # Login-form, logo, auth-background-shape
│   ├── forms/                  # LawyerForm, ChamberForm, CorporateForm, ClientNeedForm
│   ├── search/                 # SearchFilters component
│   ├── Header.tsx              # Site header with dynamic navigation
│   ├── Footer.tsx              # Site footer with newsletter form
│   ├── NavDropdown.tsx         # Dropdown navigation component
│   └── HeroSearchBar.tsx       # Search bar on homepage
├── config/
│   └── site-config.json        # Brand, navigation, social links config
├── data/
│   └── specialties.json        # 19 specialties (canonical list)
├── lib/
│   ├── api.ts                  # getLawyers, getChambers, getLawyerById, getSpecialties, getArticles, getPodcasts
│   └── supabase/
│       ├── client.ts           # Browser client
│       ├── server.ts           # Server client (cookie-based)
│       └── middleware.ts       # Session update logic
├── scripts/
│   ├── generate-digest.ts      # Weekly newsletter digest generator
│   └── migrate-data.ts         # JSON-to-Supabase migration script
└── proxy.ts                    # Next.js middleware replacement for session handling
```

### Key Routes
| Route | File | Purpose |
| :--- | :--- | :--- |
| `/` | `app/page.tsx` | Homepage with hero search, featured lawyers, and featured chambers |
| `/dashboard` | `app/dashboard/page.tsx` | User profile dashboard (auth-protected) |
| `/dashboard/publish` | `app/dashboard/publish/page.tsx` | Content Studio for publishing articles and podcasts (auth-protected) |
| `/login` | `app/login/page.tsx` | User login |
| `/signup` | `app/signup/page.tsx` | Registration with lawyer or client role selection |
| `/search` | `app/search/page.tsx` | Lawyer search with filter panel |
| `/lawyer/[id]` | `app/lawyer/[id]/page.tsx` | Lawyer profile with details and insights |
| `/knowledge` | `app/knowledge/page.tsx` | Knowledge base category index |
| `/knowledge/[slug]` | `app/knowledge/[slug]/page.tsx` | Individual article view |
| `/add-listing` | `app/add-listing/page.tsx` | Multistep listing creation wizard |
| `/api/chambers` | `app/api/chambers/route.ts` | Chambers JSON API |
| `/api/lawyers` | `app/api/lawyers/route.ts` | Lawyers JSON API |
| `/api/specialties` | `app/api/specialties/route.ts` | Specialties JSON API |

---

## 4. @repo/api Package Contents

**Location:** `packages/api/`

* **Package Configuration:** `packages/api/package.json`
  * Name: `@repo/api`
  * Dependencies: `zod`
  * Exports via wildcard exports: `./src/*.ts`

### Schema Definitions (`packages/api/src/index.ts`)
The package contains 4 Zod schemas and their corresponding TypeScript types:
* **`ArticleSchema`**: Validates published content (title, slug, content, excerpt, author, status).
* **`PodcastSchema`**: Validates audio/video files and information (title, slug, media_url, media_type, duration).
* **`NewsletterSubscriptionSchema`**: Validates email subscriptions.
* **`SpecialtySchema`**: Validates specialty structures (id, name, slug, count).

---

## 5. Supabase Configuration & Usage

### Project Meta
* **Supabase Project ID:** `jayjejqjswxtksvwoqxp`
* **Supabase URL:** `https://jayjejqjswxtksvwoqxp.supabase.co`

### Client Initialization Patterns
1. **Admin Client (Service Role - Backend only):**
   * *Location:* `apps/control-plane/lib/supabase/admin.ts`
   * Instantiates direct client using the service role key to bypass RLS.
2. **Browser Client (Public Anon Key - Frontend):**
   * *Location:* `apps/directory/lib/supabase/client.ts`
   * Instantiates `@supabase/ssr` browser client.
3. **Server Client (Cookie-based Auth - Server Components/Actions):**
   * *Location:* `apps/directory/lib/supabase/server.ts`
   * Instantiates `@supabase/ssr` server client managing cookie stores.
4. **Middleware (Session Refresh):**
   * *Location:* `apps/directory/lib/supabase/middleware.ts`
   * Performs session refresh checks inside the request pipeline.

### Environment Variables
Both `.env.local` files contain:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://jayjejqjswxtksvwoqxp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Database Schema (from `schema.sql`)
The database contains 9 main tables configured with Row-Level Security (RLS) policies:
* `chambers` (Public read, authenticated insert/update)
* `specialties` (Public read)
* `lawyers` (Public read, profile owner update)
* `lawyer_specialties` (Public read)
* `profiles` (Public read, profile owner update)
* `articles` (Public read if status='published', author write access)
* `podcasts` (Public read if status='published', author write access)
* `newsletter_subscribers` (Public insert, admin-only read)
* `client_needs` (Client service-needs listings)

A database trigger `handle_new_user()` is registered on auth signups to automatically provision new `profiles` rows linked to the user's `auth.users` ID.

### Local Development CLI Config
* **Location:** `supabase/config.toml`
* Port mapping configuration:
  * API / Gateway: `54321`
  * Postgres DB: `54322`
  * Studio Dashboard: `54323`
