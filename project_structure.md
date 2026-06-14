# Lawyard v2 - Comprehensive Project Structure

## 1. Overall Project Structure (Monorepo Setup)

**Root Path:** `/Users/mac/Documents/GitHub/lawyard-v2`

```text
lawyard-v2/
├── apps/
│   ├── admin/          # Admin dashboard (port 3001)
│   ├── directory/      # Public-facing directory (port 3000)
│   └── publish/        # Media platform — lawyard.org (port 3002)
├── packages/
│   ├── api/                    # @repo/api - Zod schemas, types, shared queries
│   ├── ui/                     # @repo/ui - Shared components, styles
│   ├── eslint-config/          # Shared ESLint config
│   └── typescript-config/      # Shared TS config
├── supabase/                   # Supabase local dev config + edge functions
│   └── functions/
│       └── publish-scheduled/  # Edge function for hourly scheduled publishing
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # Workspace: apps/*, packages/*
├── turbo.json                  # Turborepo pipeline config
├── schema.sql                  # Full database schema
├── SYSTEM_ARCHITECTURE.md      # Architecture docs
├── SESSION_CHECKPOINT.md       # Session tracking
├── supabase_migration_plan.md  # Migration plan from JSON to Supabase
├── next.config.js              # Next.js config
└── vercel.json                 # Vercel deployment config
```

### Key Configuration Files
* **[package.json](file:///Users/mac/Documents/GitHub/lawyard-v2/package.json)** - Root pnpm workspace config, Turborepo orchestration, and Supabase CLI scripts.
* **[pnpm-workspace.yaml](file:///Users/mac/Documents/GitHub/lawyard-v2/pnpm-workspace.yaml)** - Declares workspace apps and packages.
* **[turbo.json](file:///Users/mac/Documents/GitHub/lawyard-v2/turbo.json)** - Defines build pipelines, declaring Supabase environment variables as globals.

**Ports:**
* **Directory (Public-Facing Application):** Port `3000`
* **Admin Dashboard:** Port `3001`
* **Publish (Media Platform):** Port `3002`

---

## 2. Admin Dashboard Structure

**Location:** `apps/admin/`

```text
admin/
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

## 3. Publish App Structure (Media Platform)

**Location:** `apps/publish/`

```text
publish/
├── app/
│   ├── page.tsx                # Homepage (latest articles via ArticleCard)
│   ├── layout.tsx              # Root layout (Header + Footer + ThemeProvider + CartProvider)
│   ├── globals.css             # Tailwind CSS v4 (imports @repo/ui/styles/globals.css)
│   ├── not-found.tsx           # 404 page
│   ├── about/
│   │   └── page.tsx            # About page (mission, history, overview, mission, benefits)
│   ├── actions/
│   │   ├── brand-press.ts      # submitBrandPress (server action)
│   │   └── newsletter.ts       # subscribeToNewsletter
│   ├── brand-press/
│   │   ├── page.tsx            # Brand Press listing (published submissions)
│   │   ├── submit/page.tsx     # Submission form with tier selector + Paystack
│   │   ├── payment/page.tsx    # Paystack callback handler
│   │   └── success/page.tsx    # Success confirmation
│   ├── cart/
│   │   └── page.tsx            # Shopping cart
│   ├── category/
│   │   └── [slug]/page.tsx     # Category archive page
│   ├── checkout/
│   │   └── page.tsx            # Checkout page
│   ├── contact/                 # (empty — not yet built)
│   ├── feed.xml/
│   │   └── route.ts            # RSS feed (last 50 articles + podcasts)
│   ├── fonts/
│   │   ├── GeistVF.woff
│   │   └── GeistMonoVF.woff
│   ├── insights/
│   │   ├── page.tsx            # Blog index with category filter tabs
│   │   ├── [slug]/page.tsx     # Article detail (breadcrumb, author, content, related)
│   │   └── mockArticles.ts     # Fallback mock data
│   ├── podcasts/
│   │   ├── page.tsx            # Podcast index with audio player
│   │   └── [slug]/page.tsx     # Podcast detail page
│   ├── shop/
│   │   ├── page.tsx            # Shop/legislations listing
│   │   └── payment/
│   │       └── page.tsx        # Shop payment callback
│   └── tv/
│       ├── page.tsx            # Video index (media_type=video)
│       └── [slug]/page.tsx     # Video detail page with video player
├── components/
│   ├── ArticleComments.tsx     # Comment section component
│   ├── CartContext.tsx         # Shopping cart context provider
│   ├── Footer.tsx              # Site footer with newsletter + social links
│   ├── Header.tsx              # Site header with nav + Brand Press link
│   ├── LegislationCarousel.tsx # Legislations carousel
│   ├── ShareBar.tsx            # Social share bar
│   ├── SidebarLegislations.tsx # Sidebar legislations widget
│   └── theme-provider.tsx      # Theme provider (dark/light mode)
├── lib/
│   ├── brand-press.json        # Single source of truth for Brand Press tiers
│   └── supabase/
│       ├── client.ts           # createBrowserClient
│       └── server.ts           # createServerClient (cookie-based)
└── package.json                # Dependencies: next, @repo/api, @repo/ui, @supabase/*
```

### Key Brand Press Routes
| Route | File | Purpose |
| :--- | :--- | :--- |
| `/brand-press` | `app/brand-press/page.tsx` | Lists published Brand Press articles |
| `/brand-press/submit` | `app/brand-press/submit/page.tsx` | Submission form with tier selector (Basic/Core/Pro) |
| `/brand-press/payment` | `app/brand-press/payment/page.tsx` | Paystack verification callback |
| `/brand-press/success` | `app/brand-press/success/page.tsx` | Success confirmation |

### Brand Press Flow
1. User fills form at `/brand-press/submit` → selects tier
2. Server action creates article (`status='pending_review'`, `payment_status='pending'`) + transaction row
3. Redirects to Paystack popup for payment
4. Paystack redirects to `/brand-press/payment?reference=BP-XXXX`
5. Callback verifies transaction → sets `payment_status='paid'`
6. Admin reviews at `/content?tab=brand-press` (in admin app)
7. Admin approves → status='published' + email; or rejects → status='archived' + email
8. OR: Scheduled date passes → edge function auto-publishes

---

## 3. Directory App Structure (was 3, now 4)

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

## 5. @repo/api Package Contents

**Location:** `packages/api/`

* **Package Configuration:** `packages/api/package.json`
  * Name: `@repo/api`
  * Dependencies: `zod`, `@supabase/supabase-js`
  * Exports via wildcard exports: `./src/*.ts`

### Source Files

| File | Exports | Purpose |
| :--- | :--- | :--- |
| `src/index.ts` | `ArticleSchema`, `PodcastSchema`, `NewsletterSubscriptionSchema` | Zod schemas + TypeScript types |
| `src/articles.ts` | `getPublishedArticles`, `getArticleBySlug`, `getRelatedArticles`, `getPublishedPodcasts`, `getPodcastBySlug`, `formatDate` | Shared query helpers (accept SupabaseClient) |
| `src/paystack.ts` | `initPaystackTransaction`, `verifyPaystackTransaction` | Shared Paystack helpers |
| `src/email.ts` | `sendBrandPressReceived`, `sendPaymentConfirmation`, `sendBrandPressApproved`, `sendBrandPressRejected`, `sendAdminNewSubmission`, `sendNewsletter` | Resend email module (lazy-loaded via require()) |

### Key Pattern — Articles Helpers
All article/podcast query functions follow the same pattern:
```typescript
import { createClient } from '@/lib/supabase/server'
import { getPublishedArticles } from '@repo/api/articles'

const supabase = await createClient()
const articles = await getPublishedArticles(supabase, { limit: 50 })
```

### Key Pattern — Email Module
Uses `require()` for lazy loading to avoid bundle issues:
```typescript
import { sendBrandPressApproved } from '@repo/api/email'

await sendBrandPressApproved({ to, brandName, articleTitle, articleUrl })
// Silently catches errors — won't block user flow
```

---

## 5. @repo/ui Package Contents

**Location:** `packages/ui/`

* **Package Configuration:** `packages/ui/package.json`
  * Name: `@repo/ui`
  * Exports components via subpath mapping: `./components/*` -> `./src/components/*.tsx`

### Component Directory (`packages/ui/src/components/`)
Shared presentation elements used across apps:
* **`article-card.tsx`**: ArticleCard component with `grid` and `list` variants, brand/tier/category badges, author avatar/name, formatted dates.
* **`podcast-card.tsx`**: PodcastCard component with audio/video type badges, duration display, featured image.
* **`cookie-consent.tsx`**: Global Cookie consent slide-in banner component with custom analytical and marketing preference selection.
* **`newsletter-popup.tsx`**: Global newsletter signup modal triggering after 7s delay or 30% scroll depth. Decoupled using an `onSubscribe` action prop callback.
* **`not-found-layout.tsx`**: Standalone premium 404 page layout component with configurable text, paths, and default configurations.
* Shared shadcn components: `button.tsx`, `card.tsx`, `checkbox.tsx`, `field.tsx`, `input.tsx`, `label.tsx`, `separator.tsx`, `tabs.tsx`.

### ArticleCard Props
```typescript
<ArticleCard
  title={article.title}
  slug={article.slug}
  excerpt={article.excerpt}
  featured_image={article.featured_image}
  category={article.category}
  created_at={article.created_at}
  article_type={article.article_type}  // 'article' | 'brand_press'
  tier={article.tier}                  // 'basic' | 'core' | 'pro' (brand press only)
  authorName={article.author?.[0]?.full_name}
  variant="grid"                        // 'grid' | 'list'
/>
```

---

## 6. Supabase Configuration & Usage

### Project Meta
* **Supabase Project ID:** `jayjejqjswxtksvwoqxp`
* **Supabase URL:** `https://jayjejqjswxtksvwoqxp.supabase.co`

### Client Initialization Patterns
1. **Admin Client (Service Role - Backend only):**
   * *Location:* `apps/admin/lib/supabase/admin.ts`
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

#### Brand Press Columns (added via migration `20260612000002_add_brand_press.sql`)
| Column | Type | Description |
| :--- | :--- | :--- |
| `brand_name` | `text` | Brand/publisher name for Brand Press submissions |
| `tier` | `text` | 'basic', 'core', or 'pro' |
| `payment_status` | `text` | 'pending', 'paid', or 'failed' |
| `scheduled_date` | `timestamptz` | Optional scheduled publish date |
| `article_type` | `text` | 'article' or 'brand_press' |
| `status` | `text` | 'draft', 'pending_review', 'published', 'archived' |

A database trigger `handle_new_user()` is registered on auth signups to automatically provision new `profiles` rows linked to the user's `auth.users` ID.

### Supabase Edge Functions
* **`publish-scheduled`** (`supabase/functions/publish-scheduled/index.ts`):
  * Queries articles where `status='pending_review'` AND `payment_status='paid'` AND `scheduled_date <= now()`
  * Publishes them and sends approval email via Resend
  * Intended to run on an hourly cron trigger
  * Requires `RESEND_API_KEY` in Function secrets

### Local Development CLI Config
* **Location:** `supabase/config.toml`
* Port mapping configuration:
  * API / Gateway: `54321`
  * Postgres DB: `54322`
  * Studio Dashboard: `54323`
