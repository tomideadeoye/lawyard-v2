# Lawyard v2 — Monorepo

Legal media platform + legal directory + admin dashboard — built on Next.js 16, Supabase, Resend, and Paystack.

## Architecture

```text
lawyard-v2/
├── apps/
│   ├── publish/      # lawyard.org — Media platform (articles, podcasts, TV, Brand Press)
│   ├── directory/    # directory.lawyard.org — Legal marketplace (lawyers, chambers, search)
│   └── admin/        # Admin dashboard (lawyer verification, content management, subscribers)
├── packages/
│   ├── api/          # @repo/api — Shared queries, types, Paystack helpers, Resend emails
│   └── ui/           # @repo/ui — Shared components (ArticleCard, PodcastCard, CookieConsent, etc.)
├── supabase/         # Schema, migrations, edge functions
└── schema.sql        # Full database schema
```

## Quick Start

```bash
pnpm install
pnpm dev
```

| App | Port | URL |
|-----|------|-----|
| Publish (Media) | 3002 | http://localhost:3002 |
| Admin | 3001 | http://localhost:3001 |
| Directory | 3000 | http://localhost:3000 |

## Apps

### Publish (`apps/publish`)
The main Lawyard website — articles, podcasts, TV, Brand Press, RSS feed, shop.

- **14 routes**: Homepage, insights (index + detail), podcasts (index + detail), TV (index + detail), category archive, RSS feed, Brand Press (listing + submit + payment + success), About, contact, cart, checkout, shop
- **Brand Press**: Paid submission engine with 3 tiers (Basic ₦175K, Core ₦250K, Pro ₦400K), Paystack payment, admin review, scheduled publishing
- **Stack**: Next.js 16, Tailwind CSS v4, Supabase, Paystack, Resend

### Admin (`apps/admin`)
Admin dashboard for managing lawyers, content, and subscribers.

- **Lawyers Directory**: View, search, verify/reject lawyers
- **Content Manager**: Tabs for Articles, Podcasts, and Brand Press with approve/reject
- **Subscribers**: View, search, export, and broadcast newsletters
- **Auth**: Supabase Auth with admin role enforcement

### Directory (`apps/directory`)
Public-facing legal marketplace with lawyer/chamber search and profiles.

- **Search**: Filter by specialty, location, rating, price
- **Profiles**: Lawyer and chamber profile pages with published content
- **Content Studio**: Dashboard for subscribers to publish articles and podcasts

## Key Flows

### Brand Press
1. User submits at `/brand-press/submit` → selects tier
2. Article created with `status='pending_review'`, `payment_status='pending'`
3. Paystack payment → callback verifies → `payment_status='paid'`
4. Admin approves/rejects at `/content?tab=brand-press`
5. Email notifications at every step via Resend
6. Optional: scheduled date passes → edge function auto-publishes

### Newsletter
- Users subscribe via footer form or popup modal
- Admin broadcasts from subscribers page
- Powered by Resend (free tier: 100/day, 3,000/month)

## Environment Variables

Each app needs its own `.env.local`:

```ini
# Supabase (all apps)
NEXT_PUBLIC_SUPABASE_URL=https://jayjejqjswxtksvwoqxp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Publish app
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=...
PAYSTACK_SECRET_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3002
RESEND_API_KEY=...
ADMIN_EMAIL=admin@lawyard.org

# Admin app
RESEND_API_KEY=...
ADMIN_EMAIL=admin@lawyard.org
```

## Deployment

### Supabase
```bash
supabase db push                          # Run pending migrations
supabase functions deploy publish-scheduled --no-verify-jwt
supabase functions cron create "0 * * * *" --function publish-scheduled
```

### Vercel
Each app deploys independently:
```bash
vercel --cwd apps/publish
vercel --cwd apps/admin
vercel --cwd apps/directory
```

Domain routing: `lawyard.org` → publish, `directory.lawyard.org` → directory, `admin.lawyard.org` → admin

## Auth

All three apps share one Supabase project with cookie-based auth on `.lawyard.org` domain.

| Email | Role |
|-------|------|
| lawyardmtc@gmail.com | admin |
| tomideadeoye@gmail.com | client |

---

## Not Done / Coming Soon

### 🚨 Must Do Before Launch
- [ ] Run `supabase db push` — Brand Press migrations not yet applied to remote DB
- [ ] Set `RESEND_API_KEY` and `ADMIN_EMAIL` in both publish and admin apps
- [ ] Set Paystack keys (`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`) in publish app
- [ ] Deploy edge function: `supabase functions deploy publish-scheduled --no-verify-jwt`
- [ ] Wire cron: `supabase functions cron create "0 * * * *" --function publish-scheduled`
- [ ] Deploy all three apps to Vercel with correct domain routing
- [ ] Migrate WordPress content to Supabase (articles, podcasts, categories, users)
- [ ] Set up 301 redirects from old WordPress URLs

### 📄 Publish App
- [ ] Article search (keyword search across articles)
- [ ] Real comment system (current is placeholder)
- [ ] Author profile pages (`/authors/[slug]`)
- [ ] Pagination/infinite scroll on article/podcast/TV lists
- [ ] Mobile hamburger menu
- [ ] Loading skeletons for dynamic pages
- [ ] Error boundaries on all routes
- [ ] Sitemap, JSON-LD structured data, dynamic OG images
- [ ] Brand Press rate limiting, receipts, media upload, edit/resubmit

### 🛠️ Admin App
- [ ] Lawyer directory CRUD page (sidebar link is still `href="#"`)
- [ ] Subscriber CSV export and growth charts
- [ ] Multiple admin user management + role-based access
- [ ] Audit log for admin actions
- [ ] Brand Press analytics (revenue, tier breakdown, approval rate)
- [ ] WYSIWYG content editor and media library

### 📋 Directory App
- [ ] Content Studio form binding (publish form can't submit yet)
- [ ] Chambers featured flag bug (hardcoded `false`)
- [ ] Lawyers verified badge bug (hardcoded `true`)
- [ ] Search filter refinement (Location, Budget, Rating)
- [ ] Newsletter digest auto-delivery + email template
- [ ] Error boundaries for Supabase fetch failures

### 🧪 Testing & Infra
- [ ] Unit tests and E2E tests (zero coverage)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring and alerting
- [ ] Supabase backup strategy
- [ ] Local Supabase Docker setup with seed.sql

Full gap list: see `SESSION_CHECKPOINT.md` → "Not Done / Known Gaps"
