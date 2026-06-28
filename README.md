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
- **Brand Press**: Paid submission engine with 3 tiers (Basic ₦175K, Core ₦250K, Pro ₦400K), Paystack payment, Slack approve/deny, scheduled publishing via edge function

### Admin (`app/admin/`)
Admin dashboard for managing lawyers, content, and subscribers.

- **Lawyers Directory**: View, search, verify/reject lawyers
- **Content Manager**: Tabs for Articles, Podcasts, and Brand Press with approve/reject
- **Subscribers**: View, search, export, and broadcast newsletters
- **Settings**: Configure `auto_approve_hours` and `brand_press_clash_window_minutes` from the database — no code changes needed
- **Auth**: Supabase Auth with admin role enforcement

### Directory (`app/directory/`)
Public-facing legal marketplace with lawyer/chamber search and profiles.

- **Search**: Filter by specialty, location, rating, price
- **Profiles**: Lawyer and chamber profile pages with published content
- **Content Studio**: Dashboard for subscribers to publish articles and podcasts (submission posts to Slack for review)

## Key Flows

### Slack Approve/Deny (Articles)
1. Subscriber submits article in Content Studio → saved as `pending_review`
2. Posted to **#lawyard-directory** Slack channel with ✅ Approve / ❌ Deny buttons (via dedicated Lawyard Directory Slack app)
3. Click **Approve** → publishes to WordPress as draft + DB status → `published`
4. Click **Deny** → DB status → `archived`
5. Auto-approves after `auto_approve_hours` (configurable in admin Settings) if no action taken

### Brand Press
1. User submits at `/brand-press/submit` → selects tier → article created with `payment_status='pending'`
2. Paystack payment → callback verifies → `payment_status='paid'`
3. **Posted to #lawyard-directory** with ✅ Approve / ❌ Deny buttons
4. Click **Approve** → publishes to WordPress as draft + `payment_status='paid'` (keeps `pending_review` for scheduling)
5. Click **Deny** → DB status → `archived`
6. Edge function runs hourly: when `scheduled_date` passes → publishes to WordPress **live** + DB status → `published`
7. Clash detection prevents two Brand Press articles from being scheduled within the configurable window
8. Email notifications at every step via Resend

### Auto-Approve (Articles without scheduled dates)
- Edge function runs hourly, checks for articles in `pending_review` longer than `auto_approve_hours`
- Auto-publishes to WordPress as draft + updates DB status to `published`
- Value is configurable from `/admin/settings` — no code or redeploy needed

### Newsletter
- Users subscribe via footer form or popup modal
- Admin broadcasts from subscribers page
- Powered by Resend (free tier: 100/day, 3,000/month)

## Slack Integration

The directory uses a **dedicated Slack app** "Lawyard Directory" (`A0BD6S8JGDD`) — separate from the existing "Lawyard Slack Bot" that handles newsletter buttons.

| Detail | Value |
|--------|-------|
| Slack App | Lawyard Directory (`A0BD6S8JGDD`) |
| Interactions URL | `https://directory.lawyard.org/api/slack/interactions` |
| Webhook | Posts to `#lawyard-directory` |
| Socket Mode | Off (HTTP Request URL) |
| Actions | `approve_article`, `deny_article`, `approve_brand_press`, `deny_brand_press` |

### Signature verification (app/api/slack/interactions/route.ts)
- Verifies `X-Slack-Signature` with `DIRECTORY_SLACK_SIGNING_SECRET`
- Rejects requests older than 5 minutes (replay prevention)
- Routes actions to DB + WordPress updates

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

# WordPress
WP_API_URL=https://www.lawyard.org/wp-json/wp/v2
WP_USERNAME=danieladebayo
WP_APP_PASSWORD=...

# Slack (Directory App — dedicated, separate from newsletter bot)
DIRECTORY_SLACK_WEBHOOK=https://hooks.slack.com/services/...
DIRECTORY_SLACK_SIGNING_SECRET=...

# Slack (Legacy editorial inbox — for reference)
SLACK_WEBHOOK_EDITORIAL_INBOX=...
```

Supabase secrets (set via `supabase secrets set`):
- `WP_API_URL`, `WP_USERNAME`, `WP_APP_PASSWORD` — edge function uses these for WP publishing
- `RESEND_API_KEY` — edge function uses for auto-publish email notifications

## Deployment

### Supabase
```bash
supabase db push                          # Run pending migrations
supabase functions deploy publish-scheduled --no-verify-jwt
# Set cron schedule via Supabase Dashboard → Edge Functions → publish-scheduled → Schedule
# Recommended: 0 * * * * (hourly)
```

Supabase secrets (already set — re-run if credentials change):
```bash
supabase secrets set WP_API_URL="https://www.lawyard.org/wp-json/wp/v2"
supabase secrets set WP_USERNAME="danieladebayo"
supabase secrets set WP_APP_PASSWORD="..."
supabase secrets set RESEND_API_KEY="re_..."
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

## Status

### ✅ Completed Since Initial Docs

| Area | What Was Fixed |
|------|----------------|
| **Chambers featured bug** | `featured: false` → `featured: (c.is_featured as boolean) \|\| false` |
| **Lawyers verified badge** | `verified: true` → `verified: (l.verification_status as string) === 'verified'` |
| **Content Studio** | PublishArticleForm + PublishPodcastForm wired to server actions via TanStack Query |
| **Admin — Lawyers CRUD** | Full page with filters, pagination, verify/reject/edit |
| **Admin — Content Manager** | Articles + Podcasts + Brand Press tabs, status toggles, delete |
| **Admin — Subscribers** | Server + client component for subscriber listing |
| **Admin login page** | `app/admin/login/page.tsx` exists |
| **Slack Approve/Deny** | Articles: Block Kit buttons posted to dedicated Lawyard Directory Slack app, interactions handler routes approve → WP draft + DB published, deny → archived |
| **Brand Press Slack Approval** | Payment callback posts to Directory Slack with buttons; Slack approve → WP draft + payment marked paid; deny → archived; email notification on approval |
| **Admin Settings Page** | `/admin/settings` — configure `auto_approve_hours` and `brand_press_clash_window_minutes` from DB; no code/env changes ever |
| **App Settings Table** | `app_settings` key-value table with RLS, seeded defaults, accessible from edge function |
| **Auto-Approve (Articles)** | Edge function checks `pending_review` articles older than `auto_approve_hours`, auto-publishes to WP as draft + DB |
| **Scheduled Publish (Brand Press)** | Edge function publishes to WP live + DB when `scheduled_date` passes |
| **Clash Detection** | `submitBrandPress` checks for existing scheduled dates within configurable window, rejects with message |
| **Edge Function Deployed** | `publish-scheduled` deployed to Supabase with WP + email publishing |
| **Supabase Secrets** | `WP_API_URL`, `WP_USERNAME`, `WP_APP_PASSWORD`, `RESEND_API_KEY` set for edge function |
| **Migration Applied** | `app_settings` table pushed to remote DB |
| **Mobile Hamburger Menu (Directory)** | Extracted `MobileDrawer` shell from main site Header; wired into directory Header with dynamic nav from `buildNavItems()` + auth state + collapsible sections + CTA button |
| **Root Error Boundary** | `app/error.tsx` exists for directory |

### ❌ Not Yet Completed / Needs Confirmation

#### Must Confirm (Deployment & Testing)
- [ ] **Verify cron schedule** — go to Supabase Dashboard → Edge Functions → publish-scheduled → Schedule. Should be `0 * * * *` (hourly). May already be set from previous deploy.
- [ ] **Test full Brand Press flow**: submit BP → pay with live Paystack → check Slack for buttons → Approve → confirm WP draft + DB update → wait for scheduled date → confirm WP live + DB published
- [ ] **Test article flow**: submit article in Content Studio → check Slack buttons → Approve → confirm WP draft + directory published
- [ ] **Test auto-approve**: set `auto_approve_hours=0` in admin settings, submit article → should auto-publish on next edge function run
- [ ] **Test clash detection**: submit two Brand Press with scheduled dates within 1 hour → second should be rejected
- [ ] **Test live payments**: verify Paystack integration end-to-end with real card — subscription plans (Premium, Enterprise) and Brand Press tiers (Basic, Core, Pro) — confirm callback, webhook, DB status updates, and Slack notification fires on success
- [ ] **Confirm with Tobi**: are lawyers paying to list on the directory, paying to be featured, or both? The current pricing page has plans (Premium/Enterprise) that map to subscription tiers — verify this matches his business model
- [ ] **Set missing env vars on Vercel** (`SERVICE_ROLE_KEY`, Paystack keys, Slack secrets, WP credentials)

#### Must Do Before Launch
- [ ] **Rate limiting (Upstash Redis) + CAPTCHA (Cloudflare Turnstile)** on Brand Press forms — prevent abuse
- [ ] **pg_cron cleanup**: auto-archive stuck `pending_payment` articles older than 24h
- [ ] **PDF download infrastructure**: legislation PDF generation/storage/streaming; replace `href="#"` mock links on receipt page
- [ ] **Error boundaries on all routes** — catch Supabase fetch failures gracefully everywhere
- [ ] Add middleware for subdomain rewrites (admin.lawyard.org, directory.lawyard.org)
- [ ] Migrate WordPress content to Supabase (articles, podcasts, categories, users)
- [ ] Set up 301 redirects from old WordPress URLs

#### Admin App
- [ ] Subscriber CSV export and growth charts
- [ ] Multiple admin user management + role-based access
- [ ] Audit log for admin actions
- [ ] Brand Press analytics (revenue, tier breakdown, approval rate)
- [ ] WYSIWYG content editor and media library

#### Publish App
- [ ] Article search (keyword search across articles)
- [ ] Real comment system (current is placeholder)
- [ ] Author profile pages (`/authors/[slug]`)
- [ ] Pagination/infinite scroll on article/podcast/TV lists
- [ ] Loading skeletons for dynamic pages
- [ ] Sitemap, JSON-LD structured data, dynamic OG images
- [ ] Brand Press rate limiting, receipts, media upload, edit/resubmit

#### Directory App
- [ ] Search filter refinement (Location, Budget, Rating)
- [ ] Newsletter digest auto-delivery + email template

#### Testing & Infra
- [ ] Unit tests and E2E tests (zero coverage)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring and alerting
- [ ] Supabase backup strategy
- [ ] Local Supabase Docker setup with seed.sql

#### 🔍 Evaluate
- [ ] **Bluehost + data sharing** — evaluate feasibility of hosting/serving v2 alongside the existing WordPress site on Bluehost; assess shared DB access, subdomain routing, cron jobs, WordPress REST API for content sync, and migration path. Need: Bluehost admin access, current WordPress setup details (plugins, custom post types, theme), hosting plan specs (PHP version, Node support, SSH access).
