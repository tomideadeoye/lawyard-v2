# Lawyard v2

Legal media platform + legal directory + admin dashboard — built on Next.js 16, Supabase, Resend, and Paystack.

## Architecture

Single Next.js app with three route groups:

```text
lawyard-v2/
├── app/
│   ├── (main)/         # lawyard.org — Media platform (articles, podcasts, TV, Brand Press)
│   ├── admin/          # /admin — Dashboard (lawyer verification, content, subscribers)
│   └── directory/      # /directory — Legal marketplace (lawyers, chambers, search)
├── lib/                # Shared utilities, Supabase clients, API helpers
├── components/         # Shared UI components
├── config/             # site-config.json, pricing.json
├── data/               # specialties.json, wp-posts.csv
├── supabase/           # Edge functions, local dev config
└── schema.sql          # Full database schema
```

## Quick Start

```bash
pnpm install
pnpm dev
```

| Route | URL |
|-------|-----|
| Main site (media) | http://localhost:3000 |
| Admin dashboard | http://localhost:3000/admin |
| Directory | http://localhost:3000/directory |

## Route Groups

### Main (`app/(main)/`)
The Lawyard website — articles, podcasts, TV, Brand Press, RSS feed, shop.

- **Routes**: Homepage, insights (index + detail), podcasts (index + detail), TV (index + detail), category archive, RSS feed, Brand Press (listing + submit + payment + success), About, contact, cart, checkout, shop
- **Brand Press**: Paid submission engine with 3 tiers (Basic ₦175K, Core ₦250K, Pro ₦400K), Paystack payment, admin review, scheduled publishing

### Admin (`app/admin/`)
Admin dashboard for managing lawyers, content, and subscribers.

- **Lawyers Directory**: View, search, verify/reject lawyers
- **Content Manager**: Tabs for Articles, Podcasts, and Brand Press with approve/reject
- **Subscribers**: View, search, export, and broadcast newsletters
- **Auth**: Supabase Auth with admin role enforcement

### Directory (`app/directory/`)
Public-facing legal marketplace with lawyer/chamber search and profiles.

- **Search**: Filter by specialty, location, rating, price
- **Profiles**: Lawyer and chamber profile pages with published content
- **Content Studio**: Dashboard for subscribers to publish articles and podcasts

## Key Flows

### Brand Press
1. User submits at `/brand-press/submit` → selects tier
2. Article created with `status='pending_review'`, `payment_status='pending'`
3. Paystack payment → callback verifies → `payment_status='paid'`
4. Admin approves/rejects at `/admin/content?tab=brand-press`
5. Email notifications at every step via Resend
6. Optional: scheduled date passes → edge function auto-publishes

### Newsletter
- Users subscribe via footer form or popup modal
- Admin broadcasts from subscribers page
- Powered by Resend (free tier: 100/day, 3,000/month)

## Environment Variables

Single `.env.local` at project root:

```ini
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://jayjejqjswxtksvwoqxp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Payments
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=...
PAYSTACK_SECRET_KEY=...

# Email
RESEND_API_KEY=...
ADMIN_EMAIL=admin@lawyard.org

# Auth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Deployment

### Supabase
```bash
supabase db push                          # Run pending migrations
supabase functions deploy publish-scheduled --no-verify-jwt
supabase functions cron create "0 * * * *" --function publish-scheduled
```

### Vercel
Single project, single deploy:
```bash
vercel --prod
```

Domain routing via middleware rewrites:
- `lawyard.org` → main site
- `admin.lawyard.org` → /admin
- `directory.lawyard.org` → /directory

## Auth

Shared Supabase project with cookie-based auth on `.lawyard.org` domain.

| Email | Role |
|-------|------|
| lawyardmtc@gmail.com | admin |
| tomideadeoye@gmail.com | client |

---

## Not Done / Coming Soon

### Must Do Before Launch
- [ ] Run `supabase db push` — Brand Press migrations not yet applied to remote DB
- [ ] Set `RESEND_API_KEY`, `ADMIN_EMAIL`, Paystack keys on Vercel project
- [ ] Deploy edge function: `supabase functions deploy publish-scheduled --no-verify-jwt`
- [ ] Wire cron: `supabase functions cron create "0 * * * *" --function publish-scheduled`
- [ ] Add middleware for subdomain rewrites (admin.lawyard.ng, lawyers.lawyard.ng)
- [ ] Migrate WordPress content to Supabase (articles, podcasts, categories, users)
- [ ] Set up 301 redirects from old WordPress URLs

### Publish App
- [ ] Article search (keyword search across articles)
- [ ] Real comment system (current is placeholder)
- [ ] Author profile pages (`/authors/[slug]`)
- [ ] Pagination/infinite scroll on article/podcast/TV lists
- [ ] Mobile hamburger menu
- [ ] Loading skeletons for dynamic pages
- [ ] Error boundaries on all routes
- [ ] Sitemap, JSON-LD structured data, dynamic OG images
- [ ] Brand Press rate limiting, receipts, media upload, edit/resubmit

### Admin App
- [ ] Lawyer directory CRUD page (sidebar link is still `href="#"`)
- [ ] Subscriber CSV export and growth charts
- [ ] Multiple admin user management + role-based access
- [ ] Audit log for admin actions
- [ ] Brand Press analytics (revenue, tier breakdown, approval rate)
- [ ] WYSIWYG content editor and media library

### Directory App
- [ ] Content Studio form binding (publish form can't submit yet)
- [ ] Chambers featured flag bug (hardcoded `false`)
- [ ] Lawyers verified badge bug (hardcoded `true`)
- [ ] Search filter refinement (Location, Budget, Rating)
- [ ] Newsletter digest auto-delivery + email template
- [ ] Error boundaries for Supabase fetch failures

### Testing & Infra
- [ ] Unit tests and E2E tests (zero coverage)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring and alerting
- [ ] Supabase backup strategy
- [ ] Local Supabase Docker setup with seed.sql
