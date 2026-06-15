# Lawyard v2 — Project Structure

**Root Path:** `/Users/mac/Documents/GitHub/lawyard-v2`

```text
lawyard-v2/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (html/body/fonts/ThemeProvider)
│   ├── globals.css             # Tailwind v4 base styles
│   ├── not-found.tsx           # Global 404
│   ├── feed.xml/route.ts       # RSS feed
│   ├── sitemap.xml/route.ts    # Sitemap
│   ├── fonts/                  # GeistVF.woff, GeistMonoVF.woff
│   ├── actions/                # Shared server actions (brand-press, newsletter, shop)
│   │
│   ├── (main)/                 # Route group: lawyard.org media platform
│   │   ├── layout.tsx          # Header + Footer + CartProvider
│   │   ├── page.tsx            # Homepage
│   │   ├── about/page.tsx
│   │   ├── brand-press/        # listing, submit, payment, success
│   │   ├── cart/page.tsx
│   │   ├── category/[slug]/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── contact/            # page.tsx + actions.ts
│   │   ├── insights/           # index + [slug]
│   │   ├── legislations/       # index + [slug]
│   │   ├── podcasts/           # index + [slug]
│   │   ├── search/             # SearchForm + results
│   │   ├── shop/               # index + payment
│   │   └── tv/                 # index + [slug]
│   │
│   ├── admin/                  # Route group: /admin dashboard
│   │   ├── layout.tsx          # Sidebar + auth guard
│   │   ├── page.tsx            # Dashboard (stats, verification pipeline)
│   │   ├── login/              # page, actions, login-form, submit-button
│   │   ├── auth/callback/route.ts
│   │   ├── content/            # page.tsx, content-filter, create-dialog
│   │   ├── lawyers/            # page.tsx, lawyers-filters, edit-dialog
│   │   ├── subscribers/        # page.tsx, subscribers-client, actions
│   │   ├── actions.ts          # verifyLawyer, rejectLawyer
│   │   └── not-found.tsx
│   │
│   └── directory/              # Route group: /directory legal marketplace
│       ├── layout.tsx          # Directory Header + Footer
│       ├── page.tsx            # Homepage (hero, featured lawyers/chambers)
│       ├── not-found.tsx
│       ├── error.tsx           # Error boundary for Supabase failures
│       ├── about/page.tsx
│       ├── add-listing/page.tsx
│       ├── api/                # chambers, lawyers, specialties, paystack webhook
│       ├── auth/callback/route.ts
│       ├── dashboard/          # page, publish, settings, add-listing
│       ├── insights/page.tsx
│       ├── knowledge/          # index + [slug] + category/[id]
│       ├── lawyer/[id]/page.tsx
│       ├── login/              # page, actions, success
│       ├── search/page.tsx
│       ├── signup/page.tsx
│       ├── pricing/page.tsx
│       ├── privacy/page.tsx
│       ├── terms/page.tsx
│       ├── legislations/page.tsx
│       └── actions/            # content, newsletter, payments, profile, upload-avatar
│
├── components/                 # Shared UI components
│   ├── Header.tsx              # Main site header
│   ├── Footer.tsx              # Main site footer
│   ├── CartContext.tsx          # Shopping cart context
│   ├── ArticleComments.tsx     # Comment section
│   ├── NewsletterBanner.tsx
│   ├── ShareBar.tsx
│   ├── LegislationCarousel.tsx
│   ├── SidebarLegislations.tsx
│   ├── theme-provider.tsx
│   ├── mode-toggle.tsx
│   │
│   ├── ui/                     # Shared primitives (from @repo/ui, now flat)
│   │   ├── article-card.tsx
│   │   ├── podcast-card.tsx
│   │   ├── cookie-consent.tsx
│   │   ├── newsletter-popup.tsx
│   │   ├── not-found-layout.tsx
│   │   ├── button.tsx, card.tsx, checkbox.tsx, field.tsx, input.tsx
│   │   ├── label.tsx, separator.tsx, tabs.tsx
│   │
│   ├── admin/                  # Admin-specific components
│   │   ├── sidebar.tsx
│   │   ├── content-filter.tsx
│   │   ├── create-dialog.tsx
│   │   ├── edit-dialog.tsx
│   │   ├── lawyers-filters.tsx
│   │   └── subscribers-client.tsx
│   │
│   └── directory/              # Directory-specific components
│       ├── Header.tsx, Footer.tsx, HeroSearchBar.tsx
│       ├── NavDropdown.tsx, ListingAvatar.tsx, ComingSoon.tsx
│       ├── auth/               # login-form, logo, auth-background-shape
│       ├── dashboard/          # AvatarUpload, ProfileForm
│       ├── forms/              # LawyerForm, ChamberForm, CorporateForm, ClientNeedForm
│       ├── search/             # SearchFilters
│       ├── theme-provider.tsx, mode-toggle.tsx, paystack-button.tsx
│
├── lib/                        # Shared utilities & API helpers
│   ├── utils.ts                # cn() utility
│   ├── brand-press.json        # Brand Press tier config
│   ├── legislations.ts
│   │
│   ├── supabase/               # Unified Supabase clients
│   │   ├── server.ts           # createServerClient (cookie-based)
│   │   ├── client.ts           # createBrowserClient
│   │   ├── admin.ts            # createAdminClient (service role)
│   │   └── middleware.ts       # Session refresh
│   │
│   ├── api/                    # Shared business logic (from @repo/api, now flat)
│   │   ├── articles.ts         # getPublishedArticles, getArticleBySlug, etc.
│   │   ├── email.ts            # Resend: 6 send functions
│   │   ├── paystack.ts         # initPaystackTransaction, verifyPaystackTransaction
│   │   └── index.ts            # Zod schemas + types
│   │
│   ├── admin/                  # Admin-specific helpers
│   │   ├── api.ts              # getAdminStats, getPendingLawyers, etc.
│   │   ├── subscribers.ts
│   │   └── supabase/           # admin.ts, client.ts, middleware.ts, server.ts
│   │
│   └── directory/              # Directory-specific helpers
│       ├── api.ts              # getLawyers, getChambers, getLawyerById, etc.
│       ├── paystack.ts
│       └── supabase/           # client.ts, middleware.ts, server.ts
│
├── config/
│   ├── site-config.json        # Brand, navigation, social links
│   └── pricing.json            # Pricing tiers
│
├── data/
│   ├── specialties.json        # 19 specialties (canonical list)
│   └── wp-posts.csv            # WordPress export (38MB)
│
├── public/
│   ├── lawyard-logo.png
│   ├── logo-blue.png
│   └── logo-white.png
│
├── supabase/
│   ├── config.toml             # Local Supabase dev config
│   ├── functions/
│   │   └── publish-scheduled/index.ts   # Edge function (hourly cron)
│   └── migrations/             # SQL migration files
│
├── schema.sql                  # Full database schema
├── package.json                # pnpm, no workspaces
├── pnpm-lock.yaml
├── tsconfig.json               # @/* → ./*, excludes supabase/
├── next.config.js              # Minimal
├── vercel.json                 # Framework/build overrides
├── postcss.config.js
├── next-env.d.ts
├── start.sh
│
├── .env.local                  # NEXT_PUBLIC_SUPABASE_URL + ANON_KEY (Vercel pulls others)
├── .vercel/project.json        # Linked to lawyard-v2 project
└── .gitignore
```

---

## Key Configuration

| File | Purpose |
|------|---------|
| `package.json` | Single app, no workspaces. `dev`, `build`, `start`, `lint` scripts. |
| `tsconfig.json` | `@/*` maps to `./*` (repo root). Excludes `supabase/` (Deno edge functions break TS). |
| `vercel.json` | Overrides framework, installCommand, buildCommand, outputDirectory. |
| `.vercel/project.json` | Linked to Vercel project `lawyard-v2` (team `merislabs`). |
| `supabase/config.toml` | Local dev: API=54321, Postgres=54322, Studio=54323. |

---

## Route Map

| Route | Group | Purpose |
|-------|-------|---------|
| `/` | (main) | Homepage |
| `/insights` | (main) | Blog index |
| `/insights/[slug]` | (main) | Article detail |
| `/podcasts` | (main) | Podcast index |
| `/podcasts/[slug]` | (main) | Podcast detail |
| `/tv` | (main) | Video index |
| `/tv/[slug]` | (main) | Video detail |
| `/category/[slug]` | (main) | Category archive |
| `/legislations` | (main) | Legislation listing |
| `/legislations/[slug]` | (main) | Legislation detail |
| `/brand-press` | (main) | Published submissions |
| `/brand-press/submit` | (main) | Submission form |
| `/brand-press/payment` | (main) | Paystack callback |
| `/brand-press/success` | (main) | Confirmation |
| `/about` | (main) | About page |
| `/contact` | (main) | Contact page |
| `/shop` | (main) | Shop listing |
| `/shop/payment` | (main) | Shop payment callback |
| `/cart` | (main) | Shopping cart |
| `/checkout` | (main) | Checkout |
| `/search` | (main) | Article search |
| `/feed.xml` | — | RSS feed |
| `/sitemap.xml` | — | Sitemap |
| `/admin` | admin | Dashboard |
| `/admin/login` | admin | Login |
| `/admin/content` | admin | Content manager |
| `/admin/lawyers` | admin | Lawyer directory |
| `/admin/subscribers` | admin | Newsletter subscribers |
| `/directory` | directory | Homepage |
| `/directory/search` | directory | Lawyer search |
| `/directory/lawyer/[id]` | directory | Lawyer profile |
| `/directory/knowledge` | directory | Knowledge base |
| `/directory/dashboard` | directory | User dashboard |
| `/directory/dashboard/publish` | directory | Content Studio |
| `/directory/login` | directory | Login |
| `/directory/signup` | directory | Signup |
| `/directory/pricing` | directory | Pricing page |
| `/directory/add-listing` | directory | Listing wizard |

---

## Supabase

- **Project ID**: `jayjejqjswxtksvwoqxp`
- **URL**: `https://jayjejqjswxtksvwoqxp.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/jayjejqjswxtksvwoqxp

### Clients
| File | Purpose |
|------|---------|
| `lib/supabase/server.ts` | Cookie-based server client (shared) |
| `lib/supabase/client.ts` | Browser client (shared) |
| `lib/supabase/admin.ts` | Service role client (shared) |
| `lib/supabase/middleware.ts` | Session refresh |
| `lib/admin/supabase/*.ts` | Admin-specific clients (legacy, same pattern) |
| `lib/directory/supabase/*.ts` | Directory-specific clients (legacy, same pattern) |

### Edge Functions
- `supabase/functions/publish-scheduled/index.ts` — Hourly cron, auto-publishes Brand Press articles

### Environment Variables
```ini
NEXT_PUBLIC_SUPABASE_URL=https://jayjejqjswxtksvwoqxp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=...
PAYSTACK_SECRET_KEY=...
RESEND_API_KEY=...
ADMIN_EMAIL=admin@lawyard.org
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```
