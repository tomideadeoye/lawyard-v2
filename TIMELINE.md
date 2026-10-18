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
