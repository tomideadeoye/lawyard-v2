# Brand Press — Session State (June 15, 2026)

## Done

### Invoice PDF
- Installed `@react-pdf/renderer` (v4.5.1) — works on Vercel serverless
- Created `lib/api/invoice-pdf.tsx` — React PDF component with branded invoice layout
- `sendBrandPressInvoice()` generates PDF buffer via `renderToBuffer`, attaches to Resend email
- Falls back to HTML-only if PDF generation fails

### Nullable author_id/user_id
- Migration `20260615000003` applied to remote Supabase (drops NOT NULL on both columns)
- Removed hardcoded guest UUID constant — passes `null` instead

### Paystack Webhook Handler
- Created `app/api/webhooks/paystack/route.ts`
- HMAC-SHA512 signature verification using `PAYSTACK_SECRET_KEY`
- Handles `charge.success` events for `brand_press` type
- Idempotent: skips if transaction already `success`
- Updates transaction + article status, sends confirmation email
- **Not active until deployed to Vercel** — add URL to Paystack dashboard after deploy

### Config Fixes
- `middleware.ts` → `proxy.ts` (Next.js 16 convention, was showing deprecation warning)
- `next.config.js` — added `turbopack.root: process.cwd()` to silence lockfile ambiguity
- All 8 env vars added to Vercel Production (RESEND_API_KEY, ADMIN_EMAIL, etc.)

### Transactions View
- Created `app/admin/transactions/page.tsx` with table showing Reference, Plan, Amount, Currency, Status, Contact, Article ID, Date
- Added `getTransactions()` to `lib/admin/api.ts`
- Sidebar nav links fixed (were pointing to root instead of /admin/*)
- Dashboard active-state now exact-matches `/admin`

### JWT Role Claims
- Created migration `20260615000004_sync_role_to_jwt.sql`
  - Trigger function `sync_role_to_app_metadata()` syncs `profiles.role` → `auth.users.raw_app_meta_data`
  - Trigger fires on INSERT/UPDATE of `profiles.role`
  - Backfills existing users
- Updated `proxy.ts` — reads `user.app_metadata.role` directly from JWT, no DB round-trip on every request

## Not Done (Remaining)

| Priority | Task | Notes |
|----------|------|-------|
| **Low** | **Configure webhook URL in Paystack** | Add `https://lawyard.org/api/webhooks/paystack` after deploy |
| **Low** | **Navigation link** | `/brand-press` not in header/footer |
| **Low** | **Rate limiting + CAPTCHA** | Cloudflare Turnstile + Upstash Redis for production |
| **Low** | **pg_cron cleanup** | Stuck `pending_payment` articles older than 24h |

## Key Files
- `app/api/webhooks/paystack/route.ts` — webhook handler
- `lib/api/invoice-pdf.tsx` — React PDF invoice component
- `lib/api/email.ts` — `sendBrandPressInvoice()` with PDF attachment
- `app/actions/brand-press.ts` — nullable author_id/user_id
- `proxy.ts` — admin auth proxy (renamed from middleware.ts)
- `next.config.js` — turbopack.root configured

## Relevant Skills
- `skills/brand_press_skills.md`
- `skills/payment_skills.md`
- `skills/supabase_patterns_skills.md`
