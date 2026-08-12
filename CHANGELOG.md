# Changelog

## [Unreleased]

### Fixed
- **Paystack public key trailing newline**: `echo` added `\n` to `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` on Vercel, causing "Please enter a valid Key" from PaystackPop. Re-set with `printf` (no trailing newline).
- **New user signup blocked by `sync_profile_to_lawyer()` trigger**: Trigger ran unqualified `UPDATE lawyers` for ALL profile inserts (including clients) in the auth trigger context where `public` is not in the search_path. Role-gated to `lawyer`/`admin` only and qualified `public.lawyers` (`supabase/migrations/20260630000001_sync_profiles_to_lawyers.sql`)
- **`handle_new_user()` missing full_name fallback**: Deployed version used direct `->>'full_name'` without fallback to Google's `name` field or email local-part. Caused `full_name_length` constraint violation when metadata lacked `full_name`. Added COALESCE fallback chain + `first_name`/`last_name` split from full_name.
- **Email signup redirectTo double prefix**: OAuth callback URL had `/directory/auth/callback` instead of `/auth/callback` — middleware already handles rewrite, causing double `/directory/directory/` prefix on production (`app/directory/login/actions.ts:117`)
- **Auth callback route double `/directory` prefix**: Same issue — `redirectTo` was building URLs with double `/directory` prefix (`app/directory/auth/callback/route.ts`)

### Changed
- **Paystack currency explicit NGN**: `initializeTransaction()` now requires `currency` param (was implicitly NGN via account default). All callers pass `'NGN'` (`lib/api/paystack.ts`, `app/directory/actions/payments.ts`, `app/actions/shop.ts`, `app/actions/corporate-posts.ts`)
- **Transaction inserts record currency NGN**: All three flows (subscription, shop, corporate post) now insert `currency: 'NGN'` explicitly instead of relying on table default `'USD'`
- **Live Paystack keys**: `.env.local` + Vercel production switched from `sk_test_*`/`pk_test_*` to live keys. Test keys kept commented in `.env.local` for local dev
- **`NEXT_PUBLIC_SITE_URL`**: Set to `https://directory.lawyard.org` (was localhost)
- **Corporate post Basic tier price**: Temporarily set to ₦100 for live testing (was ₦175,000) — REVERT AFTER TESTING (`lib/corporate-posts.json`)
- **README**: Added "Questions for Tobi" section — 5 subscription prices in NGN unset + clash detection feature question
- **Pricing page dark mode**: All cards, tabs, notice section, and buttons now use yellow-toned dark mode variants for visibility (`app/directory/pricing/page.tsx`, `components/directory/paystack-button.tsx`)

### Added
- **Paystack webhook configured**: `https://directory.lawyard.org/api/webhooks/paystack` set on Paystack dashboard (live mode)
- **Drive client folder**: `Clients/Lawyard/` in Google Drive with `.env.local` + `lawyard-notes.md` (matches Avid and Grace format)
