# Changelog

## [Unreleased]

### Added
- **Subscription expiry**: `subscription_expires_at` column on profiles, set on payment (both webhook + verifyPayment), expired listings filtered from featured sections (`supabase/migrations/20260616000007_subscription_expiry.sql`)
- **Enterprise tier label**: Added to dashboard tier badge map
- **Chamber subscription model**: Migration adds `user_id`, `subscription_tier`, `subscription_status`, `subscription_expires_at`, contact fields to chambers (`supabase/migrations/20260622000001_extend_chambers.sql`)
- **Chamber detail page**: `/directory/chamber/[id]` — shows name, focus, description, contact, member lawyers
- **Chamber management**: `/directory/dashboard/chamber/` — create/edit chamber, view subscription status, upgrade link

### Changed
- **Subscription expiry**: Featured lawyers filtered by `subscription_expires_at` — expired/seed listings excluded; null-expiry requires non-free tier (`lib/directory/api.ts`)
- **Chamber featured filtering**: `getChambers()` now checks `subscription_status = 'active'` and `subscription_expires_at` (null ok, expired excluded) — seed data excluded (`lib/directory/api.ts`)
- **Inbox read state**: Fixed desync bug — replaced query key invalidation with local state update (`app/directory/dashboard/inquiries/inbox-client.tsx`)
- **Inquiry error handling**: `submitInquiry`/`markInquiryRead` now throw on DB failure so TanStack Query catches errors (`app/directory/actions/inquiries.ts`)
- **Webhook safety**: Null guard on `metadata` in `handleBrandPress`/`handleSubscription`/`handleChamberSubscription` to prevent TypeError crash (`app/api/webhooks/paystack/route.ts`)
- **Redirect in mutations**: Server actions return `{ success: true }` instead of `redirect()`; client forms use `useRouter().push()` in `onSuccess` — prevents TanStack Query catching redirect errors (`app/directory/actions/content.ts`, `PublishArticleForm`, `PublishPodcastForm`)
- **Category taxonomy**: Articles and podcasts now categorised by legal practice areas (from `specialties.json`) instead of internal content types

### Blocked
- Content pipeline (Slack bot) integration — waiting on Shefiu to clarify endpoint, payload, auth, and data flow for directory + brand press posts
