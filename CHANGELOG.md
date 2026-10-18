# Changelog

## [Unreleased]

### Docs
- **`docs/TOBI-12SEP-CHANGES.md` added**: item-by-item walkthrough checklist (C01–C22) of Tobi's 12 Sep requests — index table + per-item decision/checkbox, anchored to the transcript + `docs/FEATURE-STATUS.md`
- **`docs/FEATURE-STATUS.md` added**: canonical feature status board (✅ shipped · 🟡 partial · 🟦 scaffolded · 🔴 not started · 💬 spec'd-only), verified against code 2026-10-16 — supersedes the README §Status table + `docs/features.md`
- **`HANDOFF.md` added**: cold-start handoff (locations, people, the uncommitted changeset, the 18 Oct call, the email-signing bug, open work, blocking prices, 12 Sep decisions)
- **12 Sep transcript decoded** into `HANDOFF.md` §6 — monetization spine (enterprise > individual), chambers tier + admin role, silver/premium, post caps + paid extras, 1-min video, service requests (bookings must be paid; **no Calendly**), private pricing, directory-attribution removal, Lawyard Lens cross-sell, AWS move

### Fixed
- **Login error masking by Supabase CAPTCHA**: All auth flows (directory login, magic link, signup, password reset, admin login) failed with `captcha_failed` but fell through to a generic "Something went wrong". Root cause: Supabase Auth CAPTCHA enabled while admin login sent no `captchaToken`; error mapping had no `captcha` case. Added `captcha` handling everywhere + consolidated error mapping into single source of truth (`lib/auth/auth-errors.ts`)
- **Admin login CAPTCHA support**: Previously sent zero Turnstile — hardcoded "Invalid email or password" masked real errors. Now includes Turnstile widget + `captchaToken` passthrough on both password + magic link actions (`app/admin/login/actions.ts`, `app/admin/login/login-form.tsx`)
- **Corporate post image upload RLS**: Guests could not upload images — route used `createClient()` (user-scoped) instead of service role, so Storage uploads failed under RLS (`app/api/upload/corporate-posts/route.ts`)
- **`sync_profile_to_lawyer()` trigger**: Ran unqualified `UPDATE lawyers` on raw user context where `public` not in search_path + fired for every profile insert including clients. Now role-gated to `lawyer`/`admin` and qualified `public.lawyers` (`supabase/migrations/20260630000001_sync_profiles_to_lawyers.sql`)
- **`handle_new_user()` schema init**: Added proper `LANGUAGE plpgsql SECURITY DEFINER` + COALESCE fallback chain (full_name → Google `name` → email local-part) + `first_name`/`last_name` split, fixing `full_name_length` violations on Google signups (`schema.sql`)

### Changed
- **Slack editorial pipeline**: Podcasts now post with full review buttons (View/Approve/Deny/Editor) instead of plain text; shared `reviewActions()` builder for all three content types; corporate post Slack messages include submitter name (`lib/slack.ts`)
- **WordPress integration**: Posts now upload featured images to WP media, auto-create tags, set categories/authors — podcasts embed audio/video, corporate posts use author 4 (Lawyard Staff), category 7358, per-brand tags + meta (`lib/wordpress.ts`)
- **Approval UX**: After approval Slack shows "👁 View on WordPress" + "↩ Rescind" — rescind reverts WP post to draft and moves article back to `pending_review` for all content types (`app/api/slack/interactions/route.ts`)
- **Corporate posts moved**: Routes relocated from `app/(main)/corporate-posts` to `app/directory/corporate-posts` with new submit/payment/success/[slug] pages; logged-in submitters now tracked (`author_id`, `submitter_name`); transactions record `currency: 'NGN'` explicitly
- **Article publishing gated on coupon**: `publishArticle()` now requires a valid free coupon (`validateCoupon`) — no coupon, no publish (`app/directory/actions/content.ts`, `components/ui/coupon-input.tsx`)
- **Article form**: Auto-saves draft to localStorage (`lawyard_article_draft`), full scheduling UI (DatePicker + time + timezone Africa/Lagos), coupon field required (`components/directory/forms/PublishArticleForm.tsx`)
- **Search**: New keyword box in sidebar filters (`q` param); `LawyerCard` extracted and reused on directory home + search (dedupe of duplicate card markup)
- **Pricing page dark mode**: Yellow-toned dark variants for prices, features, badges (`app/directory/pricing/page.tsx`)
- **BREVO auth emails**: New custom auth hook serves branded confirm/magic-link/reset/email-change emails via Brevo transactional (`app/api/auth/hook/route.ts`)
- **Corporate post Basic tier**: Still on TEST PRICE ₦100 — do not forget to revert after testing (`lib/corporate-posts.json`)
- **ARCHITECTURE.md**: Updated to reflect new auth + content pipeline layout

### Added
- **`lib/auth/auth-errors.ts`**: Single `mapAuthError()` source of truth — replaces 3 duplicated copies (directory login, auth callback, admin login)
- **`docs/CONTENT_WORKFLOW.md`**: Canonical doc for the three content pipelines (Articles / Corporate Posts / Podcasts): Supabase → Slack review → WordPress
- **`components/directory/LawyerCard.tsx`**, `components/ui/avatar.tsx`, `components/ui/section.tsx` — shared presentational components
- **Podcast approval in Slack**: `approve_podcast`/`deny_podcast` actions + `publishPodcastToWordPress()` (`lib/wordpress.ts`)

### Added (sync: 2026-10-18 — 12 Sep changeset build pass)
- **Lawyard Lens (C09)**: thin bespoke courses — `courses` + `course_enrollments` tables (AI Governance seeded at ₦200k / ₦150k for subscribers), `/lens` + `/lens/[slug]` pages, Paystack checkout with the subscriber discount computed server-side from `profiles.subscription_tier`; `course_enrollment` handled in both the webhook and `verifyPayment` (`app/directory/actions/courses.ts`)
- **Law-firm admin role + PR publishing (C17)**: `chamber_admins` (owner/admin, multi-user, RLS-managed; creator auto-registers on chamber create) — delegates manage the listing via `/dashboard/chamber`; `publishPressRelease()` inserts `article_type='press_release'` as `pending_review` and posts to Slack for editorial approval; the public firm page renders published PRs, the main Insights feed excludes them
- **Law-firm page parity (C11)**: `20261016000005_chambers_parity.sql` adds `working_hours`, `faqs`, `gallery_images`, `intro_video_url`, reusing the lawyer editors; display sections added to the public page
- **Service requests (C14/C15)**: `20261016000003_service_requests.sql` + `service-requests.ts` + `ServiceRequestForm` — structured service type/scope/budget request, **payable** via Paystack before the slot is confirmed (no free bookings)
- **Post quotas + paid extras (C05)**: `20261016000002_post_caps_and_credits.sql` + `lib/directory/publishing.ts` quota model (free 1 total → paid 3/month → extra posts as one-off credits) + `PublishQuotaBanner`
- **Premium intro video (C08)**: `20261016000004_intro_videos_bucket.sql` + `upload-intro-video.ts` + `IntroVideoField` (self-hosted upload **or** external URL), tier-gated
- **Private pricing (C12)**: `20261016000001_add_hide_price_to_lawyers.sql` + `LawyerForm` toggle → profile shows "Contact for pricing"
- **`lib/currency.ts`**: NGN formatter as the single source of truth — hardcoded `$` stripped from the pricing fallback, `getPlans()` and the `Price` component (C20)

### Changed (sync: 2026-10-18 — 12 Sep changeset build pass)
- **"Chamber" → "Law Firm" (C23)**: all user-facing labels switched through centralized `TERMS` (`lib/constants.ts`) — nav, dashboard, forms, pricing, help; the `chambers` table and `/directory/chamber/*` routes unchanged
- **Three-tier pricing (C02)**: Free → Silver → Premium ladder in `lib/directory/publishing.ts`, wired into plans/pricing
- **Featured placement (C03)**: `.order('is_featured', desc)` on `getLawyers`/`getChambers` + a visible Featured badge on cards
- **Gallery caps (C10)**: enforced by tier (free 3 / premium 6, higher for law firms) with image type/size validation
- **Calendly removed from UI (C16)**: field dropped from `LawyerForm` and the profile display; `calendly_url` column retained
- **Bookmarks → "Saved Lawyers" (C18)**: renamed in sidebar, mobile nav and page title; subscription/history duplication cleaned up
- **Directory insights (C07)**: `/directory/insights` now surfaces published articles instead of a ComingSoon stub; `getPublishedArticles()` `excludeType` accepts an array
- **NGN transactions (C20)**: pricing/plans/currency flows record and display ₦ end-to-end

### Fixed (sync: 2026-10-18 — tooling)
- **Lint was dead repo-wide**: `pnpm run lint` ran `next lint`, which fails with "Invalid project directory provided" on Next 16 (and no eslint config existed). Added `eslint.config.mjs` (eslint-config-next 16.2.0 flat config), switched the script to `eslint .`, and fixed all **58 errors** it surfaced (46 unused vars/imports, 11 from a `ToolBtn` nested inside render in the rich-text editor, 1 TDZ/immutability in `theme-provider`). Now 0 errors / 181 warnings
- **Silently unapplied migrations**: added `scripts/migration-drift.mjs` + `pnpm run check:migrations` — parses `supabase migration list` and exits non-zero when local files are unapplied (or migrations exist only remotely). Also `pnpm run migrations:push`. Wired into `HANDOFF.md` §7 and the lawyard-ops skill's Verification Gates

### Fixed (sync: 2026-07-28)
- **Paystack public key trailing newline**: `echo` added `\n` to `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` on Vercel, causing "Please enter a valid Key" from PaystackPop. Re-set with `printf` (no trailing newline).
- **New user signup blocked by `sync_profile_to_lawyer()` trigger**: Trigger ran unqualified `UPDATE lawyers` for ALL profile inserts (including clients) in the auth trigger context where `public` is not in the search_path. Role-gated to `lawyer`/`admin` only and qualified `public.lawyers` (`supabase/migrations/20260630000001_sync_profiles_to_lawyers.sql`)
- **`handle_new_user()` missing full_name fallback**: Deployed version used direct `->>'full_name'` without fallback to Google's `name` field or email local-part. Caused `full_name_length` constraint violation when metadata lacked `full_name`. Added COALESCE fallback chain + `first_name`/`last_name` split from full_name.
- **Email signup redirectTo double prefix**: OAuth callback URL had `/directory/auth/callback` instead of `/auth/callback` — middleware already handles rewrite, causing double `/directory/directory/` prefix on production (`app/directory/login/actions.ts:117`)
- **Auth callback route double `/directory` prefix**: Same issue — `redirectTo` was building URLs with double `/directory` prefix (`app/directory/auth/callback/route.ts`)

### Changed (sync: 2026-07-28)
- **Paystack currency explicit NGN**: `initializeTransaction()` now requires `currency` param (was implicitly NGN via account default). All callers pass `'NGN'` (`lib/api/paystack.ts`, `app/directory/actions/payments.ts`, `app/actions/shop.ts`, `app/actions/corporate-posts.ts`)
- **Transaction inserts record currency NGN**: All three flows (subscription, shop, corporate post) now insert `currency: 'NGN'` explicitly instead of relying on table default `'USD'`
- **Live Paystack keys**: `.env.local` + Vercel production switched from `sk_test_*`/`pk_test_*` to live keys. Test keys kept commented in `.env.local` for local dev
- **`NEXT_PUBLIC_SITE_URL`**: Set to `https://directory.lawyard.org` (was localhost)
- **Corporate post Basic tier price**: Temporarily set to ₦100 for live testing (was ₦175,000) — REVERT AFTER TESTING (`lib/corporate-posts.json`)
- **README**: Added "Questions for Tobi" section — 5 subscription prices in NGN unset + clash detection feature question
- **Pricing page dark mode**: All cards, tabs, notice section, and buttons now use yellow-toned dark mode variants for visibility (`app/directory/pricing/page.tsx`, `components/directory/paystack-button.tsx`)

### Added (sync: 2026-07-28)
- **Paystack webhook configured**: `https://directory.lawyard.org/api/webhooks/paystack` set on Paystack dashboard (live mode)
- **Drive client folder**: `Clients/Lawyard/` in Google Drive with `.env.local` + `lawyard-notes.md` (matches Avid and Grace format)
