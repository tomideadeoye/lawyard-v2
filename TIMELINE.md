# Timeline

## 2026-06-16

### Focus
Category taxonomy alignment, TanStack Query migration for publish forms

### What Changed
- **CategoryMultiselect** rewritten to load options from `specialties.json` — articles and podcasts now use the same practice area taxonomy as lawyer specialties
- **PublishPodcastForm** rewritten: `useMutation` replaces `useTransition`/`startTransition`; controlled state instead of raw FormData; matches `LawyerForm` pattern
- **PublishArticleForm** rewritten: same migration to `useMutation` + controlled state; old single-select category dropdown replaced with `CategoryMultiselect`
- **Migration default** changed from `'documentation'` to `'general-practice'` in `20260616000004_multiselect_categories.sql`

### Rationale
- Practice areas are what users search by; internal content categories were meaningless to readers
- TanStack Query provides consistent error/success/pending state across all directory forms

### Related Files
- `components/directory/forms/CategoryMultiselect.tsx`
- `components/directory/forms/PublishPodcastForm.tsx`
- `components/directory/forms/PublishArticleForm.tsx`
- `supabase/migrations/20260616000004_multiselect_categories.sql`

---

## 2026-06-16 (Second Session)

### Focus
Client inquiry system, listing detail page rewrite, inquiry inbox

### What Changed
- **Migration**: Created `lawyer_inquiries` table with RLS (anyone inserts, lawyers see their own, admins see all)
- **Server actions**: `submitInquiry`, `getInquiries`, `getInquiryStats`, `markInquiryRead`, `getAllInquiriesAdmin` — full CRUD for client-to-lawyer messaging
- **Listing detail page**: Complete rewrite of `/directory/lawyer/[id]/page.tsx` — Tailwind replaces CSS modules; shows all extended fields (education, awards, FAQs, working hours, social links, gallery, intro video, contact info, volunteer/pro bono); live contact form that submits to `lawyer_inquiries`; sticky sidebar with inquiry form and quick info card
- **Inquiry inbox**: New `app/directory/dashboard/inquiries/` page with split layout (list + detail panes), auto-marks as read when selected; linked from dashboard sidebar and stats card
- **Dashboard**: Inquiries stat card now shows live count + unread badge; Quick Actions now includes Inquiries card with badge

### Rationale
- Lawyers need to receive and manage client inquiries from their directory listing
- The listing detail page needed the full set of extended fields to match the live site's feature set
- Inbox follows the established dashboard layout pattern with sidebar navigation

### Related Files
- `supabase/migrations/20260616000005_create_lawyer_inquiries.sql`
- `app/directory/actions/inquiries.ts`
- `app/directory/lawyer/[id]/page.tsx`
- `app/directory/lawyer/[id]/inquiry-form.tsx`
- `app/directory/dashboard/inquiries/page.tsx`
- `app/directory/dashboard/inquiries/inbox-client.tsx`
- `app/directory/dashboard/page.tsx`
- `app/directory/dashboard/layout.tsx`

---

## 2026-06-16 (Session End)

### Blockers
Content pipeline integration is blocked pending clarification from Shefiu:

1. **API endpoint before Slack bot?** — URL to POST to when directory articles/podcasts are published, and when corporate post payments clear
2. **Payload structure** — Expected JSON for article vs podcast vs corporate post
3. **Auth method** — API key, HMAC, or IP whitelist
4. **Other entry points** — External sources (direct brand submissions, scrapers) feeding the pipeline
5. **Full data flow**: source → [?] → Slack bot → distribution

### Next Steps
1. Get answers from Shefiu on content pipeline
2. Wire publish flow to POST to endpoint after DB insert
3. Wire corporate post webhook to same endpoint after Paystack confirmation
4. Rate limiting (Upstash Redis / Vercel Edge) + CAPTCHA (Cloudflare Turnstile) on directory forms

---

## 2026-06-22

### Focus
Subscription expiry enforcement, chamber subscription model, bug fixes

### What Changed
- **Subscription expiry**: Added `subscription_expires_at` column to profiles via migration. Both `verifyPayment` and Paystack webhook now set an expiry date (365 days from payment). Backfilled existing premium users. Expired listings are filtered from the featured lawyers section.
- **Chamber subscription model**: Extended chambers table with `user_id`, `subscription_tier`, `subscription_status`, `subscription_expires_at`, `email`, `phone`, `website`, `description`. Updated RLS policies. Deduplicated seed records (6 → 2). `getChambers()` now filters by active subscription + expiry. Paystack webhook + `verifyPayment` handle `type: 'chamber_subscription'`.
- **Chamber detail page**: `/directory/chamber/[id]` — public page showing name, focus, contact info, description, member lawyers. Featured chamber cards on homepage now link here.
- **Chamber management**: `/directory/dashboard/chamber/` — create/edit chamber form (consolidated FormState), subscription badge, upgrade link. Sidebar nav added.
- **Bug fixes**: Inbox read state now updates locally (no stale query cache). `submitInquiry`/`markInquiryRead` throw errors on DB failure so TanStack Query catches them. Paystack webhook handlers guard against null metadata. Server actions return `{ success: true }` instead of `redirect()` to prevent TanStack Query catching redirect errors in mutations.

### Rationale
Closing the loop on payments — subscriptions now have real expiry enforcement so featured listings degrade properly. Chambers get parity with lawyers: subscription-backed featured status, a public detail page, and owner management. Four bugs caught in a single review pass and fixed.

### Related files
- `supabase/migrations/20260616000007_subscription_expiry.sql`
- `supabase/migrations/20260622000001_extend_chambers.sql`
- `app/api/webhooks/paystack/route.ts`
- `app/directory/actions/payments.ts`
- `app/directory/actions/inquiries.ts`
- `app/directory/actions/content.ts`
- `lib/directory/api.ts`
- `app/directory/page.tsx`
- `app/directory/chamber/[id]/page.tsx`
- `app/directory/dashboard/chamber/page.tsx`
- `app/directory/dashboard/chamber/chamber-form.tsx`
- `app/directory/dashboard/layout.tsx`
- `app/directory/dashboard/inquiries/inbox-client.tsx`
- `components/directory/forms/PublishArticleForm.tsx`
- `components/directory/forms/PublishPodcastForm.tsx`

---

## 2026-07-18

### Focus
New user signup blocked by trigger chain, pricing page dark mode

### What Changed
- **Root cause:** `sync_profile_to_lawyer()` ran on EVERY profile INSERT (clients included) with unqualified `UPDATE lawyers`. In Supabase Auth's session context, `public` is not in the search_path → "relation 'lawyers' does not exist" → transaction rollback → "Database error creating new user".
- **Fix 1:** Role-gated `sync_profile_to_lawyer()` to `'lawyer'`/`'admin'` only + qualified `public.lawyers` prefix to survive any search_path context.
- **Fix 2:** `handle_new_user()` deployed version was missing the `full_name` COALESCE fallback chain (only had direct `->>'full_name'`). Added fallback: `full_name` → `name` (Google OAuth field) → `split_part(email, '@', 1)`.
- **Fix 3:** `handle_new_user()` now also splits `full_name` into `first_name`/`last_name` (splits on first space) — previously only set `full_name`, leaving `first_name`/`last_name` NULL for new users.
- **Fix 4:** Email signup `emailRedirectTo` had `/directory/auth/callback` instead of `/auth/callback` — middleware already rewrites, causing double prefix on production.
- **Fix 5:** Auth callback route `redirectTo` had same double `/directory` prefix issue.
- **Dark mode:** Pricing page cards, tabs, notice section, and payment buttons now render with yellow-toned colors in dark mode for proper visibility.

### Rationale
New user signups were completely broken — anyone attempting to create an account (email, Google OAuth, or admin API) would get "Database error creating new user." The `sync_profile_to_lawyer()` trigger was the culprit: it ran in the auth session context where `public` is not in the search_path, causing an unresolvable table reference. The role gate also prevents unnecessary `lawyers` table writes for client accounts.

### Related Files
- `schema.sql` — `handle_new_user()` synced with COALESCE fallback + first_name/last_name split
- `supabase/migrations/20260630000001_sync_profiles_to_lawyers.sql` — role gate + `public.lawyers`
- `app/directory/login/actions.ts:117` — emailRedirectTo path fix
- `app/directory/auth/callback/route.ts` — redirect URL prefix fix
- `app/directory/pricing/page.tsx` — dark mode yellow styling
- `components/directory/paystack-button.tsx` — dark mode yellow button variants

---

## 2026-07-28

### Focus
Live payment pipeline — Paystack live keys, NGN currency, live testing prep

### What Changed
- **Switched Paystack to live mode**: `.env.local` + Vercel production env vars now use `sk_live_*`/`pk_live_*`. Test keys kept commented in `.env.local` for local dev.
- **Fixed trailing newline on live public key**: `echo` piping added `\n` to `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in Vercel — PaystackPop rejected it with "Please enter a valid Key". Re-set via `printf` (no newline).
- **Currency made explicit NGN**: `initializeTransaction()` now requires a `currency` param. All 3 payment flows (directory subscription, shop, corporate post) pass `'NGN'` and insert `currency: 'NGN'` into `transactions` (table default was `'USD'` — misleading).
- **`NEXT_PUBLIC_SITE_URL`**: localhost → `https://directory.lawyard.org` (callback URLs now point at production).
- **Webhook configured on Paystack dashboard**: Live webhook URL = `https://directory.lawyard.org/api/webhooks/paystack`.
- **Corporate post Basic tier price**: ₦175,000 → ₦100 temporarily for live testing. `formatted_price` + description flagged "TEST PRICE — revert after testing".
- **README**: New "Questions for Tobi" section — 5 NGN subscription prices unanswered + clash detection feature question (should the 60-min scheduling window be scrapped?).
- **Drive**: Created `Clients/Lawyard/` in Google Drive with `.env.local` + `lawyard-notes.md` (matches Avid and Grace client folder format).

### Rationale
Directory subscriptions were pricing in USD (2.00, 20.00) but Paystack charges NGN at 1:1 — a ₦2 charge for what was meant as $2. Decided: NGN now, multi-currency later (Nigerian market is 99% of users). One successful live transaction proves the whole pipe (DB → server → Paystack → webhook → DB updates); price is data, not infrastructure.

### Related Files
- `.env.local` — live keys + commented test keys
- `lib/api/paystack.ts` — `currency` required param
- `app/directory/actions/payments.ts` — NGN on subscription init + insert
- `app/actions/shop.ts` — NGN on shop init
- `app/actions/corporate-posts.ts` — NGN on transaction insert
- `lib/corporate-posts.json` — Basic tier ₦100 (TEST)
- `README.md` — Questions for Tobi
- Vercel project env vars — live Paystack keys, SITE_URL
- Paystack dashboard — live webhook URL

---

## 2026-08-12

### Focus
Editorial pipeline hardening — Slack review for all content types, WordPress media sync, coupon-gated publishing, auth fixes

### What Changed
- **Slack editorial pipeline now covers podcasts + 2-way actions**: `postPodcastToSlackWithButtons()` replaces the plain-text podcast ping; shared `reviewActions()` builder standardizes View/Approve/Deny/Editor buttons across articles, podcasts, corporate posts. Corporate post messages carry submitter name (`lib/slack.ts`).
- **WordPress integration upgrade**: New `publishPostWithImage()` helper uploads featured images to WP media, auto-creates tags, sets category/author. `uploadImage()` + `ensureTag()` added. Podcasts publish with audio/video embed HTML; corporate posts go to author 4 (Lawyard Staff), category 7358, with brand/tier/contact metadata (`lib/wordpress.ts`).
- **Approve → "View on WordPress" + "Rescind" UX**: After approval, Slack updates the message with a link to the WP post and a danger button. Rescind reverts the WP post to draft and returns the article to `pending_review`. Try/catch logging added throughout interactions route (`app/api/slack/interactions/route.ts`).
- **Coupon-gated article publishing**: `publishArticle()` now requires a valid free coupon via shared `validateCoupon()`. New `components/ui/coupon-input.tsx`. Article form blocks submit until coupon applied (`app/directory/actions/content.ts`).
- **Article form overhaul**: localStorage draft autosave (`lawyard_article_draft`), DatePicker + time + timezone (Africa/Lagos) scheduling replacing raw datetime input (`components/directory/forms/PublishArticleForm.tsx`).
- **Corporate posts relocated**: `app/(main)/corporate-posts/*` deleted → `app/directory/corporate-posts/*` (submit/payment/success/[slug]). `submitCorporatePost()` detects logged-in users → captures `author_id` + `submitter_name`; posts Slack review notification; image upload route switched to service role client (fixes guest upload RLS) (`app/actions/corporate-posts.ts`, `app/api/upload/corporate-posts/route.ts`).
- **Search improvements**: keyword search box in sidebar filters; `LawyerCard` component extracted, reused on home + search (removes duplicated card markup) (`app/directory/search/page.tsx`, `components/directory/LawyerCard.tsx`).
- **Auth fixes**: Supabase CAPTCHA was blocking all password/OTP-auth while error mapper showed generic message. Added `captcha` message mapping + admin login now renders Turnstile and passes `captchaToken`. All three duplicated `mapAuthError()` copies consolidated into `lib/auth/auth-errors.ts` (directory login, auth callback, admin login).
- **Custom auth emails**: New `app/api/auth/hook/route.ts` serves branded Supabase auth emails (signup confirmation, magic link, reset, email change) via Brevo transactional.
- **DB trigger fixes**: `handle_new_user()` now proper SECURITY DEFINER + COALESCE fallback chain (full_name → Google name → email local-part) + first/last name split; `sync_profile_to_lawyer()` role-gated to lawyer/admin + qualified `public.lawyers` (`schema.sql`, `supabase/migrations/20260630000001_sync_profiles_to_lawyers.sql`).
- **Docs**: New `docs/CONTENT_WORKFLOW.md` — canonical reference for the three content pipelines (Supabase → Slack review → WordPress). `docs/ARCHITECTURE.md` updated.

### Rationale
The content pipeline was already live for articles; podcasts and corporate posts were still manual email pings. The Slack review loop now handles all three uniformly, WordPress posts carry real images/tags/categories instead of bare HTML, and approval is reversible (rescind). Coupon-gating article publishing ties publishing capacity to paid partner coupons (PARTNER1/PARTNER2 are the valid free codes). Auth-blocking CAPTCHA confusion traced to dashboard config + missing error mapping — code now fails visibly, config fix still pending (Supabase dashboard CAPTCHA setting).

### Related Files
- `lib/slack.ts`, `lib/wordpress.ts`, `app/api/slack/interactions/route.ts`
- `app/directory/actions/content.ts`, `app/actions/corporate-posts.ts`, `app/actions/validate-coupon.ts`
- `components/directory/forms/PublishArticleForm.tsx`, `components/ui/coupon-input.tsx`, `components/directory/LawyerCard.tsx`
- `app/directory/corporate-posts/*` (moved from `app/(main)/corporate-posts/*`)
- `lib/auth/auth-errors.ts` (new), `app/admin/login/*` (Turnstile + captcha), `app/directory/login/actions.ts`, `app/directory/auth/callback/route.ts`
- `app/api/auth/hook/route.ts` (new), `schema.sql`, `supabase/migrations/20260630000001_sync_profiles_to_lawyers.sql`
- `docs/CONTENT_WORKFLOW.md` (new), `docs/ARCHITECTURE.md`

---

## 2026-10-16

### Focus
Session handoff + decode of the 12 Sep feature/design call (Tobi) — establishing a clean decision record ahead of the Sun 18 Oct 7pm call.

### What Changed
- **`HANDOFF.md` created** — 8-section cold-start doc: locations, people, the uncommitted changeset (last commit 2026-08-12), the Sunday call, Tobi's email-signing bug, open work, the 5 blocking NGN prices, and the 12 Sep decisions.
- **12 Sep transcript decoded** (`~40% usable`; phone recording, noisy room). HANDOFF §6 rewritten from summary → decoded readout:
  - **Spine = monetization architecture.** Enterprise (law firms/chambers) > individual lawyers. Tobi cites a competitor directory forced to focus on law firms.
  - **Chambers tier** — separate pricing; chamber subscribes; a **site administrator** manages the chamber page + publishes PR (e.g. IPO work).
  - **Tiering** silver/premium; **enterprise ₦3–5M/annum** vs ₦155k individual.
  - **Post caps** ~3/month, extra posts paid; funnel = 1 free post → premium. **Article publishing** from backend, editorial-gated.
  - **1-min intro video** on own backend, not free tier, cloud-storage cost to model.
  - **Directory profile**: profile picture only; FAQs; website link; working hours; presentation video; **private** pricing option. **Service requests** (renamed from booking); **bookings must be paid** (no off-platform drift). **DECISION: no Calendly / external calendar integration.** **Remove "link to directory" attribution** for paying users.
  - **Courses (Lawyard Lens)** — AI-governance ₦200k, ₦150k for directory subscribers (cross-sell).
  - **Dashboard cleanup** (bookmarks/history); **move to AWS**; NGN for Nigeria, foreign listings TBD.
- **New vs prior summary**: no-Calendly decision, remove-attribution, private-pricing option, service-request rename, chamber admin role, post-cap-as-revenue + 1-free-then-subscribe funnel, currency handling, Tobi's silver-category note.
- **Telemetry scope confirmed** (Tomide): Tier 5 = admin-facing product analytics (signups, subscribers, revenue, funnel) — distinct from the shipped per-lawyer widgets.

### Rationale
The auto-transcript is too noisy to trust as-is, but the decisions inside it gate phase-2 scope and the pricing questions on the Sunday call. Decoding it now gives Tobi a clean decision record to confirm/deny, and separates confirmed decisions from ASR-garbled items (competitor "case study" name, "$20/quota" competitor remark, the "$10,000 premium" line — almost certainly a ₦ figure).

### Related Files
- `HANDOFF.md` (§6 rewritten; §2, §5, §8)
- `TIMELINE.md`, `CHANGELOG.md`
- Source: `/Users/mac/Downloads/20260912_142011.transcript.md`

---

## 2026-10-16 (Second Session)

### Focus
Canonical feature status board — reconcile README §Status, `CHANGELOG`, `docs/features.md`, and the 12 Sep decisions into one glanceable, code-verified artifact.

### What Changed
- **`docs/FEATURE-STATUS.md` created** — single status board. Sections: Shipped ✅ · Partial 🟡 · Scaffolded-but-empty 🟦 · Not started 🔴 · Spec'd-only from 12 Sep 💬 · Conflicts/cleanup 🗑❓ · Launch checklist · Open questions.
- **Verified against code, not docs.** Corrections to the stale README table: WorkingHoursEditor + GalleryUpload are **built and wired** (`LawyerForm.tsx:365,374`); intro video is **partial** (URL/YouTube embed only, no upload UI); Verified badge shipped; per-lawyer analytics (profile views + sparkline) shipped.
- **Empty route dirs found**: `dashboard/bookings`, `dashboard/chat`, `dashboard/wallet`, `dashboard/packages` contain no `page.tsx` (scaffolded stubs).
- **Conflict surfaced**: Calendly is **built** (`calendly_url` migration + field + display) but the 12 Sep call decided to **remove** it.
- **Pointers wired**: README §Status + `docs/features.md` now redirect to `docs/FEATURE-STATUS.md` as canonical.
- **Filenames**: used `FEATURE-STATUS.md` (hyphenated) — macOS is case-insensitive, so `FEATURES.md` collides with the existing `features.md`.

### Rationale
Three overlapping status sources had drifted (README ~3 months stale; `features.md` a task archive pointing at a missing `AGENT_TASKS.md`). One verified board removes the "is it built?" guesswork ahead of the Sunday call.

### Related Files
- `docs/FEATURE-STATUS.md` (new), `docs/features.md`, `README.md` §Status, `CHANGELOG.md`

---

## 2026-10-18

### Focus
Build the 12 Sep changeset — execute `docs/TOBI-12SEP-CHANGES.md` decisions as working code ahead of the Sun 18 Oct 7pm call with Tobi.

### What Changed
- **18 of 23 items shipped, build + TypeScript green.** Open: C01/C04/C21 (need Tobi's figures), C13 (intent unclear), C19 (decided "no build").
- **Seven migrations**: `hide_price` toggle · post caps + credits · service requests · intro-videos bucket · chambers parity · lens courses · chamber admins.
- **Pricing/commerce**: three-tier Free→Silver→Premium; NGN end-to-end via `lib/currency.ts` (removed the last hardcoded `$`); post quotas (free 1 total → paid 3/mo → extra posts as one-off credits) with a `PublishQuotaBanner`; paid, payable service requests replacing free bookings; Calendly UI removed (column kept).
- **Directory listing**: featured-first ranking + Featured badge in `getLawyers`/`getChambers`; "Contact for pricing" privacy toggle; gallery caps by tier with image validation; full law-firm page parity (working hours, FAQs, gallery, intro video) reusing the lawyer editors; "Chamber" → "Law Firm" in UI labels through centralized `TERMS`.
- **Lawyard Lens (C09)**: thin bespoke — `courses` + `course_enrollments`, Paystack checkout with server-side subscriber discount (₦200k → ₦150k), `course_enrollment` handled in both webhook and `verifyPayment`, `/lens` + `/lens/[slug]`.
- **Law-firm admin role (C17)**: `chamber_admins` (owner/admin, multi-user, RLS) with auto-registration on chamber creation; delegates manage the listing; PR/announcement publishing as `article_type='press_release'` — editorial-gated through the existing Slack review, rendered on the public firm page, excluded from the main Insights feed.
- **Dashboard**: bookmarks kept for both roles, renamed "Saved Lawyers"; subscription/history duplication cleaned; `/directory/insights` is now a real article surface instead of a stub.

### Rationale
Tobi asked for a reviewable pass rather than a prototype: build the changes, he reacts with voice notes, we iterate. The pattern this pass validated — **an action isn't done until its effect is read back** — kept every claim honest: real migrations, real checkout paths, a real RLS policy, verified against `pnpm run build`.

### Related Files
- `docs/TOBI-12SEP-CHANGES.md` (index statuses + build-outcome table)
- `supabase/migrations/20261016000001..07_*.sql` (new)
- `app/directory/{lens,actions/{courses,press-releases,service-requests,upload-intro-video}}`
- `lib/{currency.ts,directory/publishing.ts,constants.ts}`

## 2026-10-18 (Evening — auth fix + deploy)

### Focus
Tobi's report: "email login doesn't work, only Google works."

### What Changed
- **Root cause (two bugs, one report)**: (1) Tobi's account is Google-identity-only with no password, so `signInWithPassword` always failed — and our error said "Incorrect email or password", a dead end; (2) the Brevo auth-email hook built `/auth/v1/verify` URLs on the **app domain**, which 404s — GoTrue hosts verify on the Supabase project domain (proved via `admin/generate_link` ground truth).
- **Fixes**: `lib/auth/oauth-account.ts` detects OAuth-only accounts after a failed login/signup and points users at the provider + the set-password path; `app/api/auth/hook/route.ts` always builds verify URLs on `NEXT_PUBLIC_SUPABASE_URL`.
- **Deployed**: commit `05caa76` → pushed → Vercel production (SHA verified against live deployment); `check:migrations` clean (40, in sync).
- **Industry grounding** (researched): Auth0 keeps identities separate by default, Clerk auto-links on verified email both-sides, Google says key on `sub` not email, Ory/WorkOS document pre-account-takeover from unverified-email auto-linking — so: tell them which provider owns the account + set-password from an authenticated surface, never blind auto-merge.

### Rationale
A user with no password cannot be told "wrong password" — the message must name the real fix. The hook fix was on the critical path because "Forgot your password?" is how a Google-only user sets their first password.

### Related Files
- `lib/auth/oauth-account.ts` (new), `app/directory/login/actions.ts`, `app/api/auth/hook/route.ts`

## 2026-10-20

### Focus
Full-repo read-through after the changeset deploy — static checks, auth/RLS/middleware review, payment-flow and repo-hygiene review.

### What Changed
- **`docs/AUDIT-2026-10-20.md` created** — 75-commit history audited; `tsc --noEmit` clean, `eslint` 0 errors/181 warnings.
- **3 Critical**: C1 any logged-in user can self-promote to admin (`profiles.role` UPDATE policy has no `WITH CHECK`/column restriction + role→JWT trigger); C2 leaked keys in git history (rotate); C3 `/api/auth/hook` is an unauthenticated mail relay with HTML injection.
- **High**: cron path broken (subscription expiry never fires), `verifyPayment` missing ownership/idempotency checks, dual-webhook overlap, `service_requests` RLS gaps, upload-route auth.
- **Suggested order of work** recorded in the doc (rotate keys → lock role → secure hook → cron → payments → RLS → CI).

### Rationale
Architecture/authorization/process findings, not build breakage — an action isn't done until its effect is read back, and the same applies to the security posture.

### Related Files
- `docs/AUDIT-2026-10-20.md` (new)

## 2026-10-28

### Focus
Product-owner workflow for Tobi — surface pending questions/insights, then move to the multi-client system.

### What Changed
- **`/product-owner` board** (`153014d`): token-gated API route + board component + `product_owner_questions` migration — pending questions + insight dump.
- **Replaced by MerisLabs PM board embed** (`7454fc2`): Lawyard's pending questions now live in the multi-client product-owner system instead of a bespoke page.
- **Middleware exemption** (`518a5e3`): `/product-owner` removed from the directory rewrite so the route resolves.

### Rationale
The bespoke board duplicated what the MerisLabs PM board already does for a multi-client setup — sovereignty over own infrastructure means one board, not two.

### Related Files
- `app/product-owner/page.tsx`, `app/api/product-owner/route.ts`, `middleware.ts`, `supabase/migrations/20261028000001_product_owner_questions.sql`

## 2026-11-04 (Evening — changeset shipped + status board re-verified)

### Focus
Commit/push the 12 Sep changeset, then re-verify the feature board against code instead of trusting a two-week-old doc.

### What Changed
- **Changeset pushed**: `164510d` — 121 files, +5890/−839 (C02 tiers, C03 featured ranking, C05 post caps, C07 insights, C08 intro video, C09 Lens, C10 gallery caps, C11 chamber parity, C12 private pricing, C14/C15 service requests, corporate-posts moved under `/directory`, migrations `20261016000001..07`, eslint flat config). Pre-push secret scan clean.
- **`docs/FEATURE-STATUS.md` re-verified 2026-11-04** (was last verified 2026-10-16): 20 items checked in code, 15 confirmed shipped clean, 5 shipped-with-gaps, plus a new **§6 defect table (D1–D9)** so the gaps live in one place instead of evaporating into a session.
- **Headline defects**: plans still seeded in USD but formatted as NGN (every plan page renders "₦20 / ₦2"); firm/chamber gallery caps unenforced server-side; silver tier is a ₦0 placeholder; corporate-posts Basic still on the ₦100 test price; bookmark button only on profile pages; dead Calendly fields; three empty dashboard dirs; no admin analytics; only two error boundaries.
- **`docs/TOBI-12SEP-CHANGES.md`**: added a *Post-build verification* subsection mapping each gap back to its C-item, so Tobi's checklist and the code stop disagreeing.

### Rationale
A checklist that says ✅ and code that can't enforce the cap is the same false-success as a lint script that exits 0 without running — the board has to be read back from the code, not remembered. "18 of 23 shipped" was true; "all shipped cleanly" was not.

### Related Files
- `docs/FEATURE-STATUS.md` (re-verified + D1–D9), `docs/TOBI-12SEP-CHANGES.md` (post-build verification)
- `lib/directory/publishing.ts`, `app/directory/actions/submit-listing.ts`, `app/directory/dashboard/chamber/chamber-form.tsx`
- `supabase/migrations/20260629000002_update_plans_data_exact.sql` (root of D1)

## 2026-11-05 — Docs become data (registry + render gate)

### Focus
Stop letting markdown drift from the code: make the living docs machine-readable, the way Orion's design register already works.

### What Changed
- **`docs/data/{features,changeset,defects,questions}.json`** added as the source of truth: 54 features, 23 changeset items (with `alternatives` — the rejected option and why), 9 defects, 11 questions.
- **`scripts/docs.mjs`** renders `docs/FEATURE-STATUS.md` + `docs/TOBI-12SEP-CHANGES.md` and validates: id formats/uniqueness, status vocabularies, cross-references in both directions (feature ↔ change ↔ defect ↔ question), and **every evidence pointer against the real filesystem**.
- **Commands**: `pnpm run docs:render` · `docs:check` (fails on drift, dangling refs, deleted evidence) · `docs:ask` (open questions for Tobi) · `docs:stats`.
- **`alternatives`** added to changeset items — the fork not taken, and why it lost (e.g. C15: routing the lawyer's fee rejected for escrow/payment-intermediary exposure).
- Verified the gate both ways: a hand edit to the md fails `--check` with the first differing line; a missing evidence path fails validation.

### Rationale
The same failure mode as a lint script that exits 0 without running: a doc that says ✅ while the code can't enforce the cap. If the page is generated from data that is validated against the filesystem, a stale claim becomes a build error instead of a false memory.

### Related Files
- `docs/data/*.json`, `scripts/docs.mjs`, `package.json` (docs scripts)
- `docs/FEATURE-STATUS.md`, `docs/TOBI-12SEP-CHANGES.md` (now generated)

## 2026-11-09 — Tobi's 8 Nov messages: category filter was dead sitewide

### Focus
Triage Tobi's last Beeper thread (8 Nov, 14:31–15:26) and close what was real code rather than a WordPress confusion.

### What Changed
- **Diagnosis first, then code**: `www.lawyard.org` is still WordPress on Bluehost — the Next app only serves `directory.lawyard.org`. That single fact explains "published post not on the website", "Categories dropdown doesn't list Corporate Post", "verification link 404 + a form" (WordPress search form nobody reads), and why "the redesign" is the actual unblocker.
- **`lib/api/articles.ts`**: added `categoryCandidates()` (slug ↔ label spellings, with small-word casing) and replaced `.eq('category', …)` with `.overlaps()`. `articles.category` is `TEXT[]`; the old filter was a 400 every time and the error was swallowed. Also added an `articleType` option and surfaced query errors instead of silently returning `[]`.
- **`app/(main)/insights/page.tsx`**, **`app/(main)/category/[slug]/page.tsx`**, **`app/directory/knowledge/category/[id]/page.tsx`**, **`getRelatedArticles()`**: all now resolve categories through the new matcher.
- **`app/directory/corporate-posts/page.tsx`**: server-side `article_type = corporate_post` instead of fetch-50-then-filter.
- **`app/auth/callback/route.ts`** added: forwards auth-link queries landing on a non-directory host to `directory.lawyard.org`, where the exchange handler lives.
- **`app/directory/add-listing/page.tsx`**: removed the last user-visible "Orion" reference (Tobi's explicit ask).
- **Docs**: defects D10 (category filter, fixed), D11 (listing starvation, fixed), D12 (auth links on WP domain, open — needs a Supabase dashboard change); `scripts/docs.mjs` defect id regex widened to `D\d{1,2}`.

### Verification
- `tsc --noEmit` clean; `eslint` clean on touched files (one pre-existing `set-state-in-effect` warning).
- `next build` succeeds; `/auth/callback` is now a route.
- Live data checks: news 1000+, opinions 235, judgements 30, sports-law 6, corporate-post 2 — all previously 400ing.
- Local smoke test with `Host: lawyard.test` (must bypass the localhost→directory rewrite): `/insights?category=news` shows only News; `?category=corporate-post` shows the Kredete post and its sibling; `/corporate-posts` no longer shows the empty state.

### Rationale
Two of Tobi's five items were not bugs in the new app — they were him auditing a WordPress site that no longer holds the data. Saying that plainly, and fixing the real latent bugs it exposed, is cheaper than building features for a mismatch.

### Related Files
- `lib/api/articles.ts`, `app/auth/callback/route.ts`, `app/directory/corporate-posts/page.tsx`
- `app/(main)/insights/page.tsx`, `app/(main)/category/[slug]/page.tsx`, `app/directory/knowledge/category/[id]/page.tsx`
- `docs/data/defects.json`, `docs/FEATURE-STATUS.md` (generated), `CHANGELOG.md`
