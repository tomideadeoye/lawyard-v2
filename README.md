# Lawyard v2

Legal media platform + legal directory + admin dashboard — built on Next.js 16, Supabase, Brevo, and Paystack.

## Architecture

Single Next.js app with three route groups:

```text
lawyard-v2/
├── app/
│   ├── (main)/         # lawyard.org — Media platform (articles, podcasts, TV, Corporate Posts)
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

---

## Directory — Complete Architecture & Build Plan

### Core Domain Model

```
auth.users
    │ (1:1)
profiles ←────────── role: lawyer | client | chamber | admin
    │                 subscription_tier, status, expiry
    │ (1:0..1)
lawyers ──────┐      The "profile as listing" — one per lawyer
    │          │      All listing data lives here (bio, specialties,
    │          │      working_hours, gallery, faqs, etc.)
    │    lawyer_specialties (junction)
    │          │
    │     specialties (19 practice areas)
    │
    │ (1:0..1)
chambers ────── law firm / chamber (optional)
    │
    │ (1:N)
articles─────── content publishing
podcasts─────── content publishing
reviews──────── client ratings (1-5 stars)
bookmarks────── saved lawyers
lawyer_inquiries ─ contact messages
transactions─── Paystack payments
plans────────── DB-managed pricing
```

**Key decision**: No separate `listings` table. A lawyer's profile IS their listing.

### Clean URL Routing via Middleware

The directory is served at root level on `directory.lawyard.org` — no `/directory` prefix in URLs. This is achieved via middleware rewrite:

```text
User sees:          directory.lawyard.org/dashboard
                         │
Middleware rewrites:     app/directory/dashboard/page.tsx
                         │
Filesystem:             app/directory/dashboard/page.tsx
```

**Key rules:**
1. **All redirect/callback URLs must omit the `/directory` prefix.** The middleware prepends it internally. Hardcoding `/directory/login` in a redirect produces `/directory/directory/login`.
2. **Exception paths** (`/admin`, `/_next`, `/api`, `/feed.xml`, `/sitemap.xml`) pass through without rewrite.
3. **Auth paths** (`/login`, `/signup`, `/auth/callback`) follow the same pattern — they live in `app/directory/` but users see them at root level.
4. **Build-time paths** in code (component imports, server actions, file references) always use the full `app/directory/...` filesystem path. Only user-facing redirect URLs drop the prefix.

This avoids a separate subdomain deployment while keeping the URL structure clean. See `middleware.ts` for the rewrite implementation.

### Architecture Diagram

```
                    ┌──────────────────────┐
                    │   directory.lawyard   │
                    │     .org (Vercel)     │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    Middleware.ts        Server Actions        API Routes
    (subdomain →        (app/directory/       (/api/lawyers,
     /directory/*)       actions/*.ts)         /api/chambers)
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │   Supabase Project   │
                    │  (lawyard-v2)        │
                    │                     │
                    │  PostgreSQL DB ──────┼── 25+ tables
                    │  Auth (GoTrue) ──────┼── email + OAuth
                    │  Storage ────────────┼── avatars, listings, articles
                    │  Realtime ───────────┼── chat (Tier 4)
                    │  Edge Functions ─────┼── webhooks, cron
                    └─────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │   External Services  │
                    │                     │
                     │  Paystack (payments) │
                     │  Brevo (emails)      │
                    │  Slack (editorial)   │
                    └─────────────────────┘
```

### Route Groups

#### Main (`app/(main)/`)
Articles, podcasts, TV, Corporate Posts, RSS feed, shop.

- **Routes**: Homepage, insights, podcasts, TV, category archive, RSS, Corporate Posts (listing + submit + payment + success), About, contact, cart, checkout, shop
- **Corporate Posts**: Paid submission (3 tiers), Paystack, Slack approve/deny, scheduled publishing via edge function

#### Admin (`app/admin/`)
Admin dashboard for managing lawyers, content, and subscribers.

- **Lawyers Directory**: View, search, verify/reject
- **Content Manager**: Articles, Podcasts, Corporate Posts tabs with approve/reject
- **Subscribers**: View, search, export, broadcast
- **Settings**: Auto-approve hours, brand press clash window from DB
- **Auth**: Supabase Auth with admin role enforcement

#### Directory (`app/directory/`)
Legal marketplace — lawyer profiles, chambers, search, dashboard.

- **Search**: Filter by specialty, location, rating, price, experience
- **Profiles**: Lawyer profile pages (bio, specialties, reviews, articles, gallery, working hours, FAQs, social links, intro video)
- **Dashboard**: Lawyer dashboard (profile management, inquiries inbox, content studio, listings, favorites, settings)
- **Content Studio**: Articles + podcasts with Slack editorial review
- **Auth**: Email/password + Google OAuth + magic link, role-based routing, "delayed auth chain" for add-listing flow

### Build Tiers

#### Tier 0 — Profile Rename (0.5 session)
- [ ] "Edit Listing" → "Manage Profile" everywhere
- [ ] Sidebar nav label updates
- [ ] Dashboard page CTA button updates

#### Tier 1 — Profile Completion (1 session)
- [ ] WorkingHoursEditor component
- [ ] GalleryUpload component
- [ ] Intro Video URL field
- [ ] Wire into LawyerForm step 3 (Media)

#### Tier 2 — Public Profile Polish (1 session)
- [ ] Verification badge (blue checkmark) on profile hero + search cards
- [ ] Gallery display grid on profile
- [ ] Working hours display on profile
- [ ] Intro video embed

#### Tier 3 — Calendly Integration (1 session)
- [x] `calendly_url` field on lawyers table
- [x] Calendly link input in LawyerForm step 4 (Contact)
- [x] "Book via Calendly" button on public profile sidebar
- Lawyers use their own Calendly accounts — no custom booking system needed

#### Tier 4 — Live Chat (2 sessions)
- [ ] `conversations`, `messages` tables with Supabase Realtime
- [ ] Chat UI in dashboard (lawyer + client)
- [ ] Unread count badge in nav

#### Tier 5 — Analytics (1 session)
- [x] `profile_views` tracking table
- [x] ProfileViewTracker fires on `/lawyer/[id]` page load (30-min cookie dedup)
- [x] Dashboard widgets — Profile Views count + 14-day sparkline + change %
- [x] Inquiry trend stats (7-day comparison)
- No cookies, no GDPR headache, no external service

#### Tier 6 — Admin Dashboard (2 sessions)
- [ ] Lawyer verification queue (approve/reject)
- [ ] User management
- [ ] Content moderation
- [ ] Transaction log
- [ ] Coupon CRUD UI

#### Tier 7 — Infrastructure Hardening (1 session)
- [ ] Paystack webhook fix (service role, chamber subs)
- [ ] Subscription expiry cron job
- [ ] Email notification system
- [ ] RLS audit

---

## Key Flows

### Slack Approve/Deny (Articles)
1. Subscriber submits article → saved as `pending_review`
2. Posted to **#lawyard-directory** with ✅ Approve / ❌ Deny
3. Approve → WordPress draft + DB → `published`
4. Deny → DB → `archived`
5. Auto-approves after `auto_approve_hours` if no action

### Corporate Posts
1. Submit → select tier → article created (`payment_status='pending'`)
2. Paystack → callback verifies → `payment_status='paid'`
3. Posted to Slack with Approve/Deny
4. Edge function: when `scheduled_date` passes → publish WP live
5. Clash detection: prevents scheduling within configurable window

### Newsletter
- Subscribe via footer or popup
- Admin broadcasts from subscribers page
- Powered by Brevo

---

## Environment Variables

Single `.env.local` at project root:

```ini
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Payments
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=

# Email (Brevo)
BREVO_API_KEY=
ADMIN_EMAIL=admin@lawyard.org

# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# WordPress
WP_API_URL=https://www.lawyard.org/wp-json/wp/v2
WP_USERNAME=danieladebayo
WP_APP_PASSWORD=

# Slack (Directory App — dedicated, separate from newsletter bot)
DIRECTORY_SLACK_WEBHOOK=
DIRECTORY_SLACK_SIGNING_SECRET=

# Slack (Legacy editorial inbox)
SLACK_WEBHOOK_EDITORIAL_INBOX=

# Cron job protection
CRON_SECRET=
```

Supabase secrets (set via `supabase secrets set`):
- `WP_API_URL`, `WP_USERNAME`, `WP_APP_PASSWORD` — edge function WP publishing
- `BREVO_API_KEY` — edge function email notifications (via Brevo SMTP)

---

## Deployment

### Supabase
```bash
supabase db push
supabase functions deploy publish-scheduled --no-verify-jwt
# Cron: 0 * * * * (hourly) via Supabase Dashboard
```

### Vercel
```bash
vercel --prod
# Set CRON_SECRET env var in Vercel dashboard (protects /api/cron/expire-subscriptions)
```

Domain routing via middleware:
- `lawyard.org` → main site
- `admin.lawyard.org` → /admin
- `directory.lawyard.org` → /directory

---

## Status

### ✅ Completed

| Area | Status |
|------|--------|
| Auth (email, Google OAuth, magic link, password recovery) | ✅ |
| Lawyer 5-step profile wizard | ✅ |
| Chamber management | ✅ |
| Search (specialty, location, rating, price, experience) | ✅ |
| Lawyer public profile page | ✅ |
| Chamber public profile page | ✅ |
| Reviews (submit, display, auto-rating calc) | ✅ |
| Bookmarks / Favorites | ✅ |
| Inquiries inbox (lawyer dashboard) | ✅ |
| Content Studio (articles + podcasts) | ✅ |
| Dashboard + sidebar navigation | ✅ |
| Mobile responsive nav (hamburger + drawer) | ✅ |
| Pricing + Paystack payments | ✅ |
| Plans table (DB-managed pricing) | ✅ |
| Coupons table (server-side enforced) | ✅ |
| Lawyer verification flow | ✅ |
| Account settings (profile, password, email change, delete) | ✅ |
| Turnstile CAPTCHA | ✅ |
| Slack editorial workflow (articles + corporate posts) | ✅ |
| Auto-approve edge function | ✅ |
| Admin dashboard (lawyers CRUD, content manager, subscribers, settings) | ✅ |
| Forgot password modal | ✅ |
| Password visibility toggles | ✅ |
| Social icons in email footer | ✅ |
| Multi-step form navigation (FormStep wrapper) | ✅ |
| Client-only rendering (hydration fix) | ✅ |
| Route restructure (clean URLs without /directory/ prefix) | ✅ |
| Middleware rewrite (subdomain routing) | ✅ |
| Google OAuth callback path fix | ✅ |
| LinkedIn OAuth disabled | ✅ |
| Password recovery flow fix | ✅ |
| "Edit Listing" → "Manage Profile" rename | ✅ |
| Full architecture plan documented | ✅ |

### Active / In Progress
- Multi-listing decision: single profile per lawyer confirmed
- Profile -> Practice areas enhancement planned (Tier 1)

### Next Build Priorities
1. **Tier 0**: Rename "Edit Listing" → "Manage Profile" across all UI
2. **Tier 1**: WorkingHoursEditor, GalleryUpload, IntroVideo UI
3. **Tier 2**: Verification badges, gallery display, working hours display
4. **Tier 3**: Appointment/booking system
5. **Tier 4**: Live chat
6. **Tier 5**: Analytics dashboard
7. **Tier 6**: Admin enhancements
8. **Tier 7**: Infrastructure hardening

#### Must Do Before Public Launch
- [ ] Rate limiting (Upstash Redis) on forms
- [ ] pg_cron: auto-archive stuck `pending_payment` > 24h
- [ ] PDF download infrastructure
- [ ] Error boundaries on all routes
- [ ] 301 redirects from old WordPress URLs
- [x] Subscription expiry cron job (Vercel Cron, daily at midnight)
- [x] Paystack webhook fix (service role, chamber subs, featured flag)
- [ ] Email notification system

#### Admin App
- [ ] Coupon CRUD UI
- [ ] Subscriber CSV export and growth charts
- [ ] Multiple admin user management + roles
- [ ] Audit log
- [ ] Corporate Post analytics
- [ ] WYSIWYG content editor

#### Publish App
- [ ] Article search
- [ ] Real comment system
- [ ] Author profile pages
- [ ] Pagination/infinite scroll
- [ ] Loading skeletons
- [ ] Sitemap, JSON-LD, dynamic OG images

#### Testing & Infra
- [ ] Unit tests + E2E tests
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring and alerting
- [ ] Supabase backup strategy
- [ ] Local Supabase Docker setup with seed.sql
