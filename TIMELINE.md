# Timeline

> **GENERATED FILE — do not edit by hand.** Source of truth: `docs/data/timeline.json`.
> Regenerate: `pnpm run docs:render` · Gate: `pnpm run docs:check` · Graph: `pnpm run docs:graph`.
>
> One row per session: what was asked, what changed, why, and what is still blocked.
> Changeset items, defects and commit SHAs found in the text are extracted into fields, so the
> same session becomes a node with edges to the work it delivered. Oldest first — read it as history.

## 2026-06-16

### Focus
Category taxonomy alignment, TanStack Query migration for publish forms

### What Changed
- **CategoryMultiselect**: rewritten to load options from `specialties.json` — articles and podcasts now use the same practice area taxonomy as lawyer specialties
- **PublishPodcastForm**: rewritten: `useMutation` replaces `useTransition`/`startTransition`; controlled state instead of raw FormData; matches `LawyerForm` pattern
- **PublishArticleForm**: rewritten: same migration to `useMutation` + controlled state; old single-select category dropdown replaced with `CategoryMultiselect`
- **Migration default**: changed from `'documentation'` to `'general-practice'` in `20260616000004_multiselect_categories.sql`

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

### Related Files
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
- **Root cause:**: `sync_profile_to_lawyer()` ran on EVERY profile INSERT (clients included) with unqualified `UPDATE lawyers`. In Supabase Auth's session context, `public` is not in the search_path → "relation 'lawyers' does not exist" → transaction rollback → "Database error creating new user".
- **Fix 1:**: Role-gated `sync_profile_to_lawyer()` to `'lawyer'`/`'admin'` only + qualified `public.lawyers` prefix to survive any search_path context.
- **Fix 2:**: `handle_new_user()` deployed version was missing the `full_name` COALESCE fallback chain (only had direct `->>'full_name'`). Added fallback: `full_name` → `name` (Google OAuth field) → `split_part(email, '@', 1)`.
- **Fix 3:**: `handle_new_user()` now also splits `full_name` into `first_name`/`last_name` (splits on first space) — previously only set `full_name`, leaving `first_name`/`last_name` NULL for new users.
- **Fix 4:**: Email signup `emailRedirectTo` had `/directory/auth/callback` instead of `/auth/callback` — middleware already rewrites, causing double prefix on production.
- **Fix 5:**: Auth callback route `redirectTo` had same double `/directory` prefix issue.
- **Dark mode:**: Pricing page cards, tabs, notice section, and payment buttons now render with yellow-toned colors in dark mode for proper visibility.

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
- **`HANDOFF.md` created**: 8-section cold-start doc: locations, people, the uncommitted changeset (last commit 2026-08-12), the Sunday call, Tobi's email-signing bug, open work, the 5 blocking NGN prices, and the 12 Sep decisions.
- **12 Sep transcript decoded**: (`~40% usable`; phone recording, noisy room). HANDOFF §6 rewritten from summary → decoded readout:
  - **Spine = monetization architecture.** Enterprise (law firms/chambers) > individual lawyers. Tobi cites a competitor directory forced to focus on law firms.
  - **Chambers tier** — separate pricing; chamber subscribes; a **site administrator** manages the chamber page + publishes PR (e.g. IPO work).
  - **Tiering** silver/premium; **enterprise ₦3–5M/annum** vs ₦155k individual.
  - **Post caps** ~3/month, extra posts paid; funnel = 1 free post → premium. **Article publishing** from backend, editorial-gated.
  - **1-min intro video** on own backend, not free tier, cloud-storage cost to model.
  - **Directory profile**: profile picture only; FAQs; website link; working hours; presentation video; **private** pricing option. **Service requests** (renamed from booking); **bookings must be paid** (no off-platform drift). **DECISION: no Calendly / external calendar integration.** **Remove "link to directory" attribution** for paying users.
  - **Courses (Lawyard Lens)** — AI-governance ₦200k, ₦150k for directory subscribers (cross-sell).
  - **Dashboard cleanup** (bookmarks/history); **move to AWS**; NGN for Nigeria, foreign listings TBD.
- **New vs prior summary**: no-Calendly decision, remove-attribution, private-pricing option, service-request rename, chamber admin role, post-cap-as-revenue + 1-free-then-subscribe funnel, currency handling, Tobi's silver-category note.
- **Telemetry scope confirmed**: (Tomide): Tier 5 = admin-facing product analytics (signups, subscribers, revenue, funnel) — distinct from the shipped per-lawyer widgets.

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
- **`docs/FEATURE-STATUS.md` created**: single status board. Sections: Shipped ✅ · Partial 🟡 · Scaffolded-but-empty 🟦 · Not started 🔴 · Spec'd-only from 12 Sep 💬 · Conflicts/cleanup 🗑❓ · Launch checklist · Open questions.
- **Verified against code, not docs.**: Corrections to the stale README table: WorkingHoursEditor + GalleryUpload are **built and wired** (`LawyerForm.tsx:365,374`); intro video is **partial** (URL/YouTube embed only, no upload UI); Verified badge shipped; per-lawyer analytics (profile views + sparkline) shipped.
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
- **18 of 23 items shipped, build + TypeScript green.**: Open: C01/C04/C21 (need Tobi's figures), C13 (intent unclear), C19 (decided "no build").
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

> changeset C01 C04 C09 C13 C17 C19 C21

---

## 2026-10-18 (Evening — auth fix + deploy)

### Focus
Tobi's report: "email login doesn't work, only Google works."

### What Changed
- **Root cause (two bugs, one report)**: (1) Tobi's account is Google-identity-only with no password, so `signInWithPassword` always failed — and our error said "Incorrect email or password", a dead end; (2) the Brevo auth-email hook built `/auth/v1/verify` URLs on the **app domain**, which 404s — GoTrue hosts verify on the Supabase project domain (proved via `admin/generate_link` ground truth).
- **Fixes**: `lib/auth/oauth-account.ts` detects OAuth-only accounts after a failed login/signup and points users at the provider + the set-password path; `app/api/auth/hook/route.ts` always builds verify URLs on `NEXT_PUBLIC_SUPABASE_URL`.
- **Deployed**: commit `05caa76` → pushed → Vercel production (SHA verified against live deployment); `check:migrations` clean (40, in sync).
- **Industry grounding**: (researched): Auth0 keeps identities separate by default, Clerk auto-links on verified email both-sides, Google says key on `sub` not email, Ory/WorkOS document pre-account-takeover from unverified-email auto-linking — so: tell them which provider owns the account + set-password from an authenticated surface, never blind auto-merge.

### Rationale
A user with no password cannot be told "wrong password" — the message must name the real fix. The hook fix was on the critical path because "Forgot your password?" is how a Google-only user sets their first password.

### Related Files
- `lib/auth/oauth-account.ts` (new), `app/directory/login/actions.ts`, `app/api/auth/hook/route.ts`

> commits 05caa76

---

## 2026-10-20

### Focus
Full-repo read-through after the changeset deploy — static checks, auth/RLS/middleware review, payment-flow and repo-hygiene review.

### What Changed
- **`docs/AUDIT-2026-10-20.md` created**: 75-commit history audited; `tsc --noEmit` clean, `eslint` 0 errors/181 warnings.
- **3 Critical**: C1 any logged-in user can self-promote to admin (`profiles.role` UPDATE policy has no `WITH CHECK`/column restriction + role→JWT trigger); C2 leaked keys in git history (rotate); C3 `/api/auth/hook` is an unauthenticated mail relay with HTML injection.
- **High**: cron path broken (subscription expiry never fires), `verifyPayment` missing ownership/idempotency checks, dual-webhook overlap, `service_requests` RLS gaps, upload-route auth.
- **Suggested order of work**: recorded in the doc (rotate keys → lock role → secure hook → cron → payments → RLS → CI).

### Rationale
Architecture/authorization/process findings, not build breakage — an action isn't done until its effect is read back, and the same applies to the security posture.

### Related Files
- `docs/AUDIT-2026-10-20.md` (new)

---

## 2026-10-28

### Focus
Product-owner workflow for Tobi — surface pending questions/insights, then move to the multi-client system.

### What Changed
- **`/product-owner` board**: (`153014d`): token-gated API route + board component + `product_owner_questions` migration — pending questions + insight dump.
- **Replaced by an embed of the shared project board**: (`7454fc2`): Lawyard's pending questions now live in the multi-client product-owner system instead of a bespoke page.
- **Middleware exemption**: (`518a5e3`): `/product-owner` removed from the directory rewrite so the route resolves.

### Rationale
The bespoke board duplicated the shared project board — one board is easier to keep honest than two.

### Related Files
- `app/product-owner/page.tsx`, `app/api/product-owner/route.ts`, `middleware.ts`, `supabase/migrations/20261028000001_product_owner_questions.sql`

> commits 153014d 7454fc2 518a5e3

---

## 2026-11-04 (Evening — changeset shipped + status board re-verified)

### Focus
Commit/push the 12 Sep changeset, then re-verify the feature board against code instead of trusting a two-week-old doc.

### What Changed
- **Changeset pushed**: `164510d` — 121 files, +5890/−839 (C02 tiers, C03 featured ranking, C05 post caps, C07 insights, C08 intro video, C09 Lens, C10 gallery caps, C11 chamber parity, C12 private pricing, C14/C15 service requests, corporate-posts moved under `/directory`, migrations `20261016000001..07`, eslint flat config). Pre-push secret scan clean.
- **`docs/FEATURE-STATUS.md` re-verified 2026-11-04**: (was last verified 2026-10-16): 20 items checked in code, 15 confirmed shipped clean, 5 shipped-with-gaps, plus a new **§6 defect table (D1–D9)** so the gaps live in one place instead of evaporating into a session.
- **Headline defects**: plans still seeded in USD but formatted as NGN (every plan page renders "₦20 / ₦2"); firm/chamber gallery caps unenforced server-side; silver tier is a ₦0 placeholder; corporate-posts Basic still on the ₦100 test price; bookmark button only on profile pages; dead Calendly fields; three empty dashboard dirs; no admin analytics; only two error boundaries.
- **`docs/TOBI-12SEP-CHANGES.md`**: added a *Post-build verification* subsection mapping each gap back to its C-item, so Tobi's checklist and the code stop disagreeing.

### Rationale
A checklist that says ✅ and code that can't enforce the cap is the same false-success as a lint script that exits 0 without running — the board has to be read back from the code, not remembered. "18 of 23 shipped" was true; "all shipped cleanly" was not.

### Related Files
- `docs/FEATURE-STATUS.md` (re-verified + D1–D9), `docs/TOBI-12SEP-CHANGES.md` (post-build verification)
- `lib/directory/publishing.ts`, `app/directory/actions/submit-listing.ts`, `app/directory/dashboard/chamber/chamber-form.tsx`
- `supabase/migrations/20260629000002_update_plans_data_exact.sql` (root of D1)

> changeset C02 C03 C05 C07 C08 C09 C10 C11 C12 C14 C15 · defects D1 D2 D3 D4 D5 D6 D7 D8 D9 · commits 164510d

---

## 2026-11-05 — Docs become data (registry + render gate)

### Focus
Stop letting markdown drift from the code: make the living docs machine-readable so a stale claim fails the build.

### What Changed
- **`docs/data/{features,changeset,defects,questions}.json`**: added as the source of truth: 54 features, 23 changeset items (with `alternatives` — the rejected option and why), 9 defects, 11 questions.
- **`scripts/docs.mjs`**: renders `docs/FEATURE-STATUS.md` + `docs/TOBI-12SEP-CHANGES.md` and validates: id formats/uniqueness, status vocabularies, cross-references in both directions (feature ↔ change ↔ defect ↔ question), and **every evidence pointer against the real filesystem**.
- **Commands**: `pnpm run docs:render` · `docs:check` (fails on drift, dangling refs, deleted evidence) · `docs:ask` (open questions for Tobi) · `docs:stats`.
- **`alternatives`**: added to changeset items — the fork not taken, and why it lost (e.g. C15: routing the lawyer's fee rejected for escrow/payment-intermediary exposure).
- Verified the gate both ways: a hand edit to the md fails `--check` with the first differing line; a missing evidence path fails validation.

### Rationale
The same failure mode as a lint script that exits 0 without running: a doc that says ✅ while the code can't enforce the cap. If the page is generated from data that is validated against the filesystem, a stale claim becomes a build error instead of a false memory.

### Related Files
- `docs/data/*.json`, `scripts/docs.mjs`, `package.json` (docs scripts)
- `docs/FEATURE-STATUS.md`, `docs/TOBI-12SEP-CHANGES.md` (now generated)

> changeset C15

---

## 2026-11-09 — Tobi's 8 Nov thread: the email verification flow, and category pages that were dead sitewide

### Focus
Work through the product owner's 8 November report; separate real defects from a WordPress/Next hosting mix-up, then fix both.

### What Changed
- **Diagnosis first**: `www.lawyard.org` is still WordPress on Bluehost — Next serves only `directory.lawyard.org`. That explains "published post not on the website", "Categories dropdown has no Corporate Post", and why the redesign is the real unblocker.
- **Category filtering was dead sitewide**: `articles.category` is `TEXT[]`, but every query filtered it with `.eq('category','news')` → PostgREST 400 `malformed array literal`, error swallowed, page empty. Added `categoryCandidates()` + `.overlaps()` in `lib/api/articles.ts`; applied at insights, category, knowledge-category and related-articles.
- **Corporate Posts listing starved**: `app/directory/corporate-posts/page.tsx` fetched the 50 newest published articles then filtered in JS. Now filtered in Postgres via a new `articleType` option.
- **Email verification signed nobody in**: The Send Email hook pointed at GoTrue `/auth/v1/verify`, which returns `?code=` (needs the code-verifier cookie) or `#access_token` (a fragment a route can never read). Added `lib/auth/confirm.ts` with `verifyOtp({type, token_hash})` — no cookie needed — served at `/auth/confirm` on both hosts; the hook now mails that link and preserves `?next=`.
- **Per-account coupon caps**: `max_uses` was global and `frequency_days` a global cooldown; neither means "three times by an account". Added `coupons.per_user_limit`, enforced against `transactions.metadata->>submitter_id`, and seeded `LAWYARD100` (3) and `LAWYARD30` (1) in production.
- **Nav and copy**: Corporate Posts added to the main-site header/insights chips/footer and to the live directory nav via `config/site-config.json`. Replaced the last third-party product reference in `app/directory/add-listing/page.tsx`.
- **Test data purged**: Deleted the six MerisLabs corporate-post test rows plus the orphaned ₦250k pending transaction; only the real Kredete post remains.

### Next Steps
1. Send Tobi the reply — blocked on a delivery date for the redesign.
2. WordPress → Next cutover on www.lawyard.org, then the `/category/*` pages and the new header go live.

### Verification
- `tsc --noEmit` clean; `eslint` 0 errors on touched files; `next build` succeeds.
- Live data: category filters return news 1000+, opinions 235, judgements 30, sports-law 6, corporate-post 2 (all previously 400ing).
- Live `/auth/confirm`: bogus token → `/login?message=expired`; real token → session cookie + `/search`.
- Coupon cap predicate returns 3 after three synthetic redemptions; rows removed after the check.
- Deployed to production (`vercel --prod`), aliased to https://directory.lawyard.org.

### Rationale
- Two of Tobi's five items were not bugs in the new app — he was auditing a WordPress site that no longer holds the data. Saying that plainly, then fixing the latent bugs it exposed, is cheaper than building features for a mismatch.
- The verification failure was only findable by reproducing it: the link looked correct in the code and returned 200s everywhere, but the session arrived in a form no server route can read.

### Related Files
- `lib/api/articles.ts` · `lib/auth/confirm.ts` · `app/auth/confirm` · `app/directory/auth/confirm` · `app/api/auth/hook/route.ts`
- `app/actions/validate-coupon.ts` · `app/actions/corporate-posts.ts` · `app/admin/coupons/*` · `supabase/migrations/20261109000001_*.sql`, `20261109000002_*.sql`
- `app/directory/corporate-posts/page.tsx` · `app/(main)/insights/page.tsx` · `components/Header.tsx` · `components/Footer.tsx` · `config/site-config.json`

> defects D10 D11 D12

---

## 2026-11-21 — Kredete post showed its own markup — render the body, then make rendering it safe

### Focus
A live Corporate Post displayed `<p><a target="_blank"…` to readers. Find why one page escaped what every other page renders, fix it, and close the hole that fix opens.

### What Changed
- **The detail page escaped the body**: `app/directory/corporate-posts/[slug]/page.tsx` passed `{article.content}` as a React child, so React escaped it. `/insights/[slug]` and the admin pipeline preview already used `dangerouslySetInnerHTML`; the corporate-post page was the only article surface that never got it.
- **`lib/sanitize.ts`**: `sanitizeRichHtml()` — allowlist of exactly the tags TipTap produces, `http`/`https`/`mailto`/`tel` only, `rel="noopener noreferrer nofollow"` forced on links, empty editor paragraphs dropped; `stripHtml()` and `excerptFromHtml()` for plain-text excerpts. Cleaned on save in `submitCorporatePost()` and again on read for rows written earlier.
- **Excerpts were cut out of the HTML**: The fallback was `data.content.substring(0,160)` — the raw markup, which then surfaced on cards and in the Slack preview. Now `excerptFromHtml()`; `ArticleCard` also strips legacy HTML excerpts at render.
- **`lib/sanitize.test.ts`**: 11 cases: kept markup, stripped script/style/`onclick`, refused `javascript:` and `data:` URLs, forced `rel`, dropped empty paragraphs, kept image-only paragraphs, treated null as empty.
- **The page, rebuilt to the WordPress standard**: Same article layout as `/insights/[slug]`: serif headline, brand + tier line, date/read-time strip, share bar, 16:9 cover with brand caption, body, paid-announcement disclosure, related posts, and a sticky sidebar (search, recent posts, submit CTA priced from the tier config). Read time is computed from the body, not hardcoded. `generateMetadata` adds title, description, canonical and OG image — the page had none. Includes the opening drop cap (`::first-letter`, floated, 5.333em / 0.68 line-height) at the same metrics as the WordPress theme.
- **Typography actually exists now**: `@tailwindcss/typography` was never installed, so every `.prose` in the repo was inert. Added it, set Lawyard's register through the plugin's variables (bronze links, serif headings), then fixed what the change exposed: `prose-invert` used unconditionally on the light terms/privacy pages, and `text-accent` headings that were near-white on white. `.prose` in the submission editor gets the same styles, so submitters now see what they will get.
- **House ads: from theme slots to data**: The live page's three banner ads were hand-edited WordPress theme slots. Added `ad_slots` — placement, creative, destination, flight window, weight, intrinsic image size — with `/admin/ads` for CRUD and a server `<AdSlot>` that renders the live creative or nothing at all. Destinations limited to http(s) or site-relative, links carry `rel="sponsored nofollow noopener noreferrer"`, and the stored width/height reserves the box so an ad load cannot shift the article. Seeded with the live LawPavilion banners. `docs/OPERATIONS.md` §1 previously left the model as an open comparison; it now records the decision (direct-sold house inventory), how each of its own non-negotiables is met, and the two open gaps.
- **Ad delivery counters**: Vercel Analytics and GA4 measure pages, not creatives — so the sold banners had no report. Added `ad_events` (daily rollup per creative per kind) through a `SECURITY DEFINER` function, `/ads/click/[id]` counting clicks before the redirect (destination re-validated, no open redirect), and a viewport beacon counting an impression only when the creative is seen, once per session. `/admin/ads` shows 7-day views/clicks and 28-day CTR. Verified end to end on the dev server: impression on scroll, 302 to the advertiser, both rows written; test rows deleted afterwards.
- **Migration version collision**: The observability commit added `20261121000001_app_errors.sql` after `20261121000001_ad_slots.sql` was already applied, so every `db push` aborted on a duplicate `schema_migrations` key. Renumbered the unapplied file to `...000003`; applied history untouched. 47/47 in sync.
- **Migration guard, and a live duplicate it caught**: `check:migrations` trusted `supabase migration list`, which prints one row per version — so two files sharing a version read as clean. The script now scans the directory first and fails on duplicate versions or filenames Supabase would silently ignore. On its first run it found `20261121000002` claimed by both `ad_events` (applied) and `chamber_publish_gate` (another session, unapplied); the unapplied file was renamed to `…000004`. The check then reported the honest state: one migration pending.

### Next Steps
1. Confirm the Kredete post renders as an article on production after deploy.
2. House ads: promote `ad_slots` to production (`pnpm migrations:push` already applied) and let Tobi book creatives at `/admin/ads` instead of editing a WordPress post body.
3. Optional: wire an AdSense slot alongside house ads if Google inventory is wanted back.

### Verification
- `vitest run` — 76/76 pass, including 12 sanitiser and 14 ad-inventory cases.
- `tsc --noEmit` clean; `eslint .` 0 errors; `pnpm build` succeeds (routes `/admin/ads`, `/directory/corporate-posts/[slug]`, `/insights/[slug]`); `pnpm docs:check` passes.
- Rendered on the dev server at 1440px and 390px, light and dark: headline, cover, drop cap, body, disclosure, sidebar and the three seeded banners all read; article column 805px, matching the WordPress 800px reference.
- `pnpm migrations:push` applied the ad table to the linked project; `pnpm check:migrations` clean (44/44). Live rows confirmed through PostgREST.
- Ad counters verified live on the dev server: one impression on scroll, one click → 302 to lpstore.lawpavilion.com, both written to `ad_events`; synthetic rows removed. `pnpm check:migrations` 47/47 clean. `vitest run` 93/93.

### Rationale
- The bug was a renderer decision, not bad data — the HTML was stored correctly, which is why the WordPress copy read fine while the Next page did not. Escaped markup is always the render path.
- The moment the page renders HTML, submitted HTML becomes live, so the sanitizer belongs on the write path where it is checked once — with a second pass at read so the fix covers rows already in the table.
- The allowlist is exactly what the Tiptap editor can produce, not a general HTML allowlist. A submission containing something else is not content we meant to accept, and stripping it silently is better than rejecting a paid post over markup the submitter did not type.
- Sanitising on read as well as on write is the cheap way to cover rows that predate the guard: no backfill migration, no window where an old post renders differently from a new one.
- `@tailwindcss/typography` over hand-written article CSS because `.prose` was already used on six surfaces. Enabling the plugin fixed all of them at once; the brand register lives in plugin variables in one place, so the next article template inherits it instead of restyling.
- The drop cap is CSS-only (`::first-letter`) rather than a span: submitted content cannot break it, and a body that opens with an image or heading simply gets no cap instead of a broken layout.
- Ads are rows, not theme slots, because inventory changes weekly and a creative swap should not be a deploy. Flight windows and weights are sales operations, so they belong in a table an operator can edit.
- Direct-sold over AdSense for the article: the sold banner is the higher-value product and it is what proves the page can carry paid placement. AdSense stays authorised in `ads.txt` so the option is not lost, but a Google unit above and below a paid Corporate Post devalues the page the client forwards onward.
- Clicks are counted in a redirect route rather than in the browser: a client counter loses every click from an ad blocker or a no-JS visitor, and the count is the thing the advertiser is paying for. The destination is re-validated on the way out because a click route on our own domain is an open redirect otherwise.
- An impression is an intersection event, not a render. Counting renders would pay a banner for being below the fold on a page nobody scrolls, and would count prefetch and crawlers.
- Counters are a daily rollup written through one `SECURITY DEFINER` function, so the table stays small forever and anonymous readers can add an event without any right to read or forge it. The function validates the kind and that the creative exists.
- No GA4 in this app yet: the news site already runs GA4 and adding a second property to a second host double-counts the same readers and muddies the numbers Tobi is using. Re-point at cutover, when the redirect map keeps the history coherent.
- The migration guard scans the directory locally because `supabase migration list` prints one row per version — two files sharing a version read as clean. The CLI cannot tell you about uniqueness; the filesystem can.
- Assumption: the delivery numbers are directional, not audited. They are first-party, session-deduped and unfiltered by bots — right for a house-inventory conversation with a direct buyer, not for billing a third party by impression.
- Assumption: the seeded creatives stay hotlinked to `www.lawyard.org/wp-content/...` for now. Accepted as a time-boxed gap because WordPress is still serving them; recorded as a cutover blocker in `docs/CUTOVER.md` rather than fixed silently.
- Assumption: renaming another session's `chamber_publish_gate` migration was safe because it had never been applied — `supabase migration list` showed the version applied to `ad_events`, and the rename only changed a file no remote row pointed at.
- Assumption: the Kredete post is representative of a Corporate Post body (a link-led first paragraph, bold pseudo-headings, no images inside the body). The drop cap and the prose defaults were tuned against it; a body that opens with an image degrades to no cap rather than breaking.

### Related Files
- `app/directory/corporate-posts/[slug]/page.tsx` · `app/directory/knowledge/[slug]/page.tsx` · `app/actions/corporate-posts.ts` · `components/ui/article-card.tsx`
- `lib/sanitize.ts` · `lib/sanitize.test.ts` · `app/globals.css` · `app/directory/{terms,privacy}/page.tsx`
- `supabase/migrations/20261121000001_ad_slots.sql` · `lib/ads.ts` · `lib/ads.test.ts` · `components/ads/ad-slot.tsx` · `app/admin/ads/page.tsx`
- `package.json` (`sanitize-html`, `@tailwindcss/typography`)
- `docs/OPERATIONS.md` §1 (advertising decision)
- `supabase/migrations/20261121000002_ad_events.sql` · `supabase/migrations/20261121000003_app_errors.sql` · `app/ads/click/[id]/route.ts` · `app/api/ads/impression/route.ts` · `components/ads/ad-beacon.tsx` · `middleware.ts`
- `scripts/migration-drift.mjs`

> defects D13 D14

---

## 2026-11-21 — Firms had no teams — seats, invites, and one answer about what an account is

### Focus
Does the category chosen on /add-listing do anything after signup, and how is a law firm supposed to add its lawyers? Tracing the auth chain showed the category was pure UI state with a four-hop journey, while firm membership was a column nobody could write from the UI.

### What Changed
- **Membership is a row, not a column**: `chamber_members` holds a seat with history (pending/active/ended, who invited, who ended), one open membership per lawyer. `lawyers.chamber_id` stays only as a read cache, written by `chamber_accept_seat()` / cleared by `chamber_end_seat()`.
- **Seats are enforced where they are spent**: `chambers.seat_limit` is what the firm bought. Activation row-locks the chamber, counts active seats and refuses at the cap with `seat_limit_reached`; the firm gets a buy-more prompt instead of a silent failure. Per-seat checkout charges price × seats and re-clamps the count server-side.
- **Join and leave both exist**: Invite by email (Brevo, plus a copy-link for WhatsApp), accept in one click, self-request from the public firm page, approve/decline on Team & seats, leave or be removed without losing the listing. Leaving or a lapsed firm subscription drops the firm-conferred tier only.
- **One answer about the account**: `profiles.role` stays client | lawyer | admin; firm ownership is a membership, not a role, so a managing partner can be both. Signup radios deleted; the /add-listing category sets the role in `signup` and in `auth/callback` for OAuth; the silent role flip on form submission is gone.
- **Firm checkout stopped taking money for nothing**: `paystack-button` never sent `chamber_id`, and `verifyPayment` only upgrades a chamber when it has one — so an Enterprise purchase recorded a receipt and provisioned nothing. Checkout now requires the chamber, verifies the caller manages it, and terms follow the plan (90 days for client plans, was a hardcoded 365).

### Next Steps
1. Apply `20261122000001_chamber_members_and_seats.sql` (`pnpm migrations:push` / `supabase db push`) — the features are inert until it runs.
2. Tobi's firm numbers: price per seat per year, and the Enterprise annual figure (Q6/Q9). Until they land the firm card shows "Contact sales" and checkout stays off.
3. Split the 06:43 commit: `e5e7279` ("feat(observability)") swept in `seats.ts`, `entitlements.ts`, `save-chamber.ts`, `submit-listing.ts` and the migration under an unrelated message.

### Verification
- `tsc --noEmit` clean; `vitest run lib/directory` 21/21 (effective tier, seat state, seat clamping); `eslint` 0 errors on every touched file.
- Firm tab renders in dark at 1280px with no horizontal overflow, price unit reads "Per seat / year", free tier "Owner seat included"; signup shows 0 role radios and the contextual account line; `/invite/<bad-token>` renders its unavailable state.
- Not yet exercised end to end: the three new tables and two functions are unapplied, so activation, invites and seat enforcement have not run against a real database.

### Rationale
- The category question and the firm question are the same model. A `role` column cannot say "lawyer who owns a firm", which is why adding `'chamber'` to the constraint would have forced a false choice and re-created the silent flip.
- Seat accounting belongs in the database, not the action: the count and the activation have to share a lock or two accepts can both take the last seat.
- A firm seat is only worth paying for if it confers the firm's tier, so entitlement became `max(own plan, firm plan)` in one helper instead of five scattered reads of `profiles.subscription_tier`.

### Related Files
- `supabase/migrations/20261122000001_chamber_members_and_seats.sql` · `lib/directory/seats.ts` · `lib/directory/entitlements.ts` · `lib/directory/roles.ts`
- `app/directory/actions/chamber-members.ts` · `app/directory/actions/payments.ts` · `app/directory/actions/save-chamber.ts` · `app/directory/actions/submit-listing.ts`
- `app/directory/dashboard/chamber/team/{page,team-client}.tsx` · `app/directory/invite/[token]/{page,accept-invite}.tsx` · `components/directory/{seat-checkout,request-seat}.tsx`
- `app/directory/pricing/page.tsx` · `components/directory/paystack-button.tsx` · `app/directory/chamber/[id]/page.tsx` · `components/directory/auth/signup-form.tsx` · `app/directory/auth/callback/route.ts`

---

## 2026-11-22 — A new firm could not exist: separating listing from indexing

### Focus
The publish gate treated three matters or a 120-character description as the price of a firm page. A firm that incorporated last month has neither, so the rule blocked exactly the supply a cold-start directory needs — and the only firm in the directory was unreachable at its own URL.

### What Changed
- **Existence is firm details only**: A firm page goes live on name, location and at least one practice area. Description, matters, contact channels and images are optional; the gate no longer asks for anything a new firm cannot yet have.
- **Indexing is its own bar**: A page without a description and without three matters is served with noindex, follow and kept out of the sitemap. It is still reachable by link and still appears on the firm listing, so a client given the URL sees it while search engines do not.
- **Publishing actually happens now**: The save action never wrote published_at, so no firm could publish through the product at all — the column was only ever set by a one-off migration. Every save now evaluates the gate and stamps the page; publishing is one-way, so an edit that clears a field cannot take a live page down.
- **A taxonomy that disagreed with itself**: data/specialties.json offered five ids the specialties table does not contain and omitted five it does, so the ids the picker offered could not be saved against either junction table. The table is now the source of truth, two advertised areas (Dispute Resolution, Commercial) were added, and old slugs still resolve.

### Next Steps
1. Bloomfield has no description, no matters and no contact channel, so it is live but not indexable. A 120-character description from the firm is the cheapest way to change that.
2. The homepage featured rail is empty: it filters on an active subscription, and the one firm is on the free tier.

### Verification
- Migrations applied: taxonomy 22 rows in both the table and the JSON, chamber_specialties backfilled to three areas for the one firm, published_at stamped. `check:migrations` clean at 51.
- The firm page returns 200 with no draft banner, three practice areas and noindex, follow; it appears on /chamber and is absent from the sitemap. 112 unit tests, typecheck and docs render pass.

### Rationale
- Existing and being findable are different promises. Blocking existence to protect the index punishes the wrong party: the firm that has just started, not the search engine.
- Three matters was a well-meant proxy for substance but it is unearnable on day one. A page-level noindex achieves the same SEO protection without making the firm wait a year.
- Once published_at started being written, a saved edit could have flipped it back to null and silently removed a live page. Publishing had to become monotonic.

### Related Files
- `lib/directory/publishability.ts` · `lib/directory/practice-areas.ts` · `lib/directory/api.ts`
- `app/directory/actions/save-chamber.ts` · `app/directory/chamber/[id]/page.tsx` · `app/sitemap.ts` · `app/directory/layout.tsx`
- `components/directory/FirmMatters.tsx` · `components/directory/forms/listing/MattersEditor.tsx` · `data/specialties.json`
- `supabase/migrations/20261122000002–000005`

---

## 2026-11-24 — A live firm page with no way to reach the firm

### Focus
Publishing firms on their details made a page reachable that had no contact route at all: no email, no phone, no website, and the only button asked lawyers to join the firm. The one firm on the directory was live and unusable.

### What Changed
- **Inquiries addressed to the firm**: `chamber_inquiries` mirrors the lawyer table with a chamber foreign key. Reads are limited to the billing owner and chamber admins; writes are open to guests, since requiring an account would put a signup wall in front of the page's only action.
- **Delivery that cannot dead-end**: The notification prefers the firm's own address, then the login emails of its admins, then the Lawyard inbox. An unclaimed listing therefore still reaches a person instead of a table nobody reads.
- **Validation where it can be trusted**: Length caps, an email check and a UUID check run server-side in a pure module with its own tests; the browser checks nothing. A hidden honeypot drops bots without telling them.
- **A seed image that did not exist**: The one firm pointed at `/chamber-1.jpg`, which is not in the repo, so every page load requested a 400 from the image optimiser. The value was cleared and the existing building-icon fallback now renders.

### Next Steps
1. A firm-side inbox for inquiries — today the owner only sees them by email.
2. The claim flow: the one live firm has no owner, so its inquiries route to Lawyard rather than the firm.

### Verification
- Submitted through the form in a browser: success state rendered and the row stored with name, email, phone and message. The row was deleted afterwards; email delivery was suppressed for the run by starting the server without a Brevo key, so the send itself is unexercised.
- Guest insert verified directly against the API (201) and reads confirmed empty for anonymous callers. 121 tests, typecheck and docs render pass; `check:migrations` clean at 53.

### Rationale
- The page was made publishable without a contact route — that was the gap the change created, so it is fixed before anything else.
- Guests, not accounts: the directory's value is a client reaching counsel, and the registration step is exactly where that stops.
- Falling back to the Lawyard inbox keeps an unclaimed listing useful until the claim flow exists.

### Related Files
- `supabase/migrations/20261122000006_chamber_inquiries.sql` · `lib/directory/inquiries.ts` · `lib/directory/inquiries.test.ts`
- `app/directory/actions/chamber-inquiries.ts` · `components/directory/ChamberInquiryForm.tsx` · `app/directory/chamber/[id]/page.tsx`
- `lib/api/email.ts` · `lib/api/email-layout.ts` · `lib/api/email-layout.test.ts`

---

## 2026-11-24 — The contact form was a hand-off, not a channel

### Focus
The inquiry built hours earlier emailed the firm the client address and told it to reply directly. That moves every relationship off-platform on message one, which is the exact outcome the directory exists to prevent.

### What Changed
- **Email and phone are no longer published**: Firm and lawyer pages keep location, address and website; the mailto/tel links are gone. The inquiry form is the contact channel.
- **Notifications became pointers**: Both templates now say there is a message and link to the dashboard. No client name, no address, no body — so the notification cannot be replied to by email.
- **Inquiry became a thread**: `chamber_inquiry_messages` holds client and firm messages. The firm replies in a dashboard inbox; the client replies through a private 256-bit token link, which is how a guest returns without an account and without the firm learning their address.
- **Client contact is unreachable from the firm role**: A table-level SELECT grant includes every column, so the grant was dropped and re-issued without email and phone. Row-level security alone would not have hidden them.

### Next Steps
1. Claim the firm, then open the inbox with a real account.
2. Detect contact details typed into messages — the remaining bypass is a phone number in the body.
3. Apply the same thread model to lawyer inquiries; today only their notification was made pointer-only.

### Verification
- Submitted through the form in a browser, opened the mailed token link, replied as the client: both messages rendered in order, the page served `noindex, nofollow, nocache`, deletion cascaded the thread. Email delivery suppressed by starting the server without a Brevo key, so the send itself is unexercised.
- The firm inbox was not exercised — it needs a firm session and the one firm has no owner. 128 tests, typecheck and docs render pass; migrations clean at 54.

### Rationale
- A conversation that starts in email cannot be measured, moderated or defended — it is the directory paying for acquisition and the firm keeping the client.
- Hashing the token would force rotation on every reply, and a rotated link silently breaks every older email in the client's inbox. It is stored as issued but outside every grant, readable only by the service role.
- Removing the affordances is honest: a determined pair can still exchange a phone number in a message. What changed is that the default path is now on-platform.

### Related Files
- `supabase/migrations/20261124000001_inquiry_threads.sql` · `lib/directory/inquiry-thread.ts` · `lib/directory/inquiry-server.ts`
- `app/directory/actions/chamber-inquiries.ts` · `app/directory/dashboard/chamber/inquiries/{page,inbox-client}.tsx` · `app/directory/inquiry/[token]/{page,reply-form}.tsx`
- `app/directory/chamber/[id]/page.tsx` · `app/directory/lawyer/[id]/page.tsx` · `lib/api/email-layout.ts`

---

## 2026-11-25 — The lawyer inbox listed messages and stopped

### Focus
Firm inquiries had become threads; lawyer inquiries had only lost the client address from the notification. A lawyer could read a message and had no way to answer except off-platform — the half-migration was worse than either state.

### What Changed
- **Lawyer inquiries are threads**: `lawyer_inquiry_messages` plus an access token on the inquiry. The client replies through the same `/inquiry/[token]` page used for firms; one link shape, resolved against both tables.
- **One inbox component**: The firm and lawyer dashboards now render the same master-detail thread UI, differing only in which action the buttons call. The lawyer inbox gained replies; the firm inbox lost its bespoke copy.
- **Client contact removed from the lawyer grant**: Same column-level revocation as firms: a lawyer can read the inquiry row and cannot read the client's email or phone. The admin query was moved to explicit columns so it survives the grant.
- **No sign-in to ask a lawyer a question**: The public form was gated behind an account while the firm form was not. Both are now guest-open, because the token link is what keeps the conversation on-platform.

### Next Steps
1. Open a real lawyer account and exercise the dashboard inbox end to end.
2. Detect contact details typed into message bodies; that is the remaining bypass.
3. The lawyer page still has no generateMetadata, so its title is the directory default.

### Verification
- Created a temporary lawyer listing, submitted the public form as a guest, opened the mailed token link and replied: both messages rendered in order, page served noindex/nofollow/nocache, and deleting the lawyer cascaded the inquiry and its messages. Listing and test rows removed.
- Email delivery suppressed by starting without a Brevo key, so the send path is still unexercised. The lawyer dashboard inbox was not opened with a session — it needs a real account. 135 tests, typecheck and docs render pass; migrations clean at 56.

### Rationale
- A notification without a reply path is not a channel — it is an instruction to leave.
- Sharing the inbox UI removes the drift that let the two provider types diverge in the first place.
- Guest access is the point: the client returns through a link, not an account, and the provider never learns the address.

### Related Files
- `supabase/migrations/20261125000001_lawyer_inquiry_threads.sql` · `lib/directory/lawyer-inquiry-server.ts` · `lib/directory/inquiries.ts`
- `app/directory/actions/inquiries.ts` · `components/directory/InquiryInbox.tsx` · `app/directory/inquiry/[token]/{page,reply-form}.tsx`
- `app/directory/dashboard/inquiries/page.tsx` · `app/directory/dashboard/chamber/inquiries/page.tsx` · `app/directory/lawyer/[id]/page.tsx`

---

## 2026-11-25 — Closing the last obvious exit

### Focus
Threads kept the conversation in-app only until someone typed an address into the first message. That is one field and no friction, so the model was still bypassable by anyone who wanted to leave.

### What Changed
- **Messages are screened at the boundary**: A pure detector runs in every server action that can reach the other side — firm and lawyer, first message and reply. Email addresses, bracketed obfuscation, phone numbers in any spacing and social handles are all caught.
- **The block explains itself**: The send is refused with a message naming what was found and why the thread is the better route, rather than a generic validation error.
- **Blocks are recorded**: `contact_flags` keeps surface, direction and kinds. It has no insert policy, so only the server can write one; admins can read them.
- **False positives were designed out**: Money with commas, suit numbers, dates and years do not match, and unbracketed "at ... dot ..." prose is left alone. Website links remain allowed because the firm's site is already published.

### Next Steps
1. An admin view for contact_flags; today they are queryable but not surfaced.
2. The header logs a duplicate React key ("Search Lawyers") on every page — unrelated, but visible in the console.

### Verification
- Submitted "Call me on 0803 123 4567 or email ada@example.com" through the public firm form: refused, both kinds named, no inquiry stored, one flag recorded with kinds email,phone.
- Submitted a message containing a suit number, a date and a price: accepted, so the detector does not eat ordinary legal text. Test rows and flags removed. All 74 directory and API tests, typecheck and docs render pass; migrations clean at 57. The full suite is red on an unrelated shop test (lib/shop/catalogue.test.ts), owned by other in-flight work.

### Rationale
- A rule nobody can see is a trap. The block has to say what it objected to or it reads as a broken form.
- Recording attempts turns an anti-bypass rule into a signal: a listing that keeps triggering it is a listing that is leaving.
- This is friction, not prevention. Two determined people can still meet; the point is that the easy path is now the on-platform one.

### Related Files
- `lib/directory/contact-filter.ts` · `lib/directory/contact-filter.test.ts` · `lib/directory/contact-guard.ts`
- `supabase/migrations/20261125000002_contact_flags.sql` · `app/directory/actions/{chamber-inquiries,inquiries}.ts`
- `components/directory/{ChamberInquiryForm,InquiryInbox}.tsx` · `app/directory/inquiry/[token]/reply-form.tsx`

---

## Maintenance

- **Never edit this file.** Add or change a session in `docs/data/timeline.json`, then run `pnpm run docs:render`.
- `S-YYYY-MM-DD-NN` ids are stable references; the graph links a session to the changelog entries dated the same day.
- `changeset` / `defects` / `commits` are the edges the graph is built from — keep them as arrays of ids.
