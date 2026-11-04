# Lawyard v2 — Feature Status Board

> **The single glance.** One row per feature, status at a glance.
> Reconciled from README §Status, `CHANGELOG.md`, `docs/features.md`, `HANDOFF.md` §6 (12 Sep decisions).
> **Re-verified against the codebase on 2026-11-04**, after the 12 Sep changeset was committed and deployed (`164510d`).
> Replaces the README status table and `docs/features.md` as the source of truth for "is it built?"

## Legend

| Mark | Meaning |
|---|---|
| ✅ | Shipped — verified present + wired in code |
| 🟡 | Partial — exists but incomplete (URL-only, hardcoded, missing piece) |
| 🟦 | Scaffolded — route/dir exists but empty (stub) |
| 🔴 | Not started |
| 💬 | Spec'd only — agreed in the 12 Sep call, not built |
| 🗑 | Built but marked for removal (12 Sep decision) |
| ❓ | Needs verification / confirm with Tobi |

---

## 1. Shipped ✅

| Feature | Notes / evidence |
|---|---|
| Auth — email/password, Google OAuth, magic link, password recovery | `app/directory/login`, `components/directory/auth/*` |
| Account settings — profile, password, email change, delete | `dashboard/settings`, `EmailChangeDialog`, `DeleteAccountDialog` |
| Branded auth emails (Brevo auth hook) | `app/api/auth/hook/route.ts` — shipped in `05caa76`, verify URL fixed |
| Turnstile CAPTCHA | `components/directory/auth/TurnstileWidget.tsx` |
| Lawyer multi-step profile wizard | `components/directory/forms/LawyerForm.tsx` + `FormStep` |
| Working-hours editor | `WorkingHoursEditor.tsx` → wired `LawyerForm.tsx:374` |
| Gallery upload | `GalleryUpload.tsx` → wired `LawyerForm.tsx:367` *(cap enforcement — see 🟡)* |
| FAQs / social links / awards / publications / memberships | schema (`20260617000001_extend_lawyers_table.sql`) + form editors |
| Chamber (Law Firm) management + public page | `app/directory/chamber/[id]`, `dashboard/chamber`, `ChamberForm` — full parity: hours, FAQs, gallery, intro video |
| Chamber site-admin role | `20261016000007_chamber_admins.sql` — owner/admin, RLS-managed; PR publishing via `press-releases.ts` |
| Search (specialty, location, rating, price, experience + keyword) | `app/directory/search`, `SearchFilters.tsx` |
| Featured-first ranking + Featured badge | `.order('is_featured', {ascending:false})` `lib/directory/api.ts:77`; badge `LawyerCard.tsx:41,67` |
| Lawyer public profile page | `app/directory/lawyer/[id]` |
| Reviews (submit, display, auto-rating) | `components/directory/ReviewsSection.tsx`, reviews table |
| Client inquiries inbox | `dashboard/inquiries`, `lawyer_inquiries` table |
| Service requests (structured + payable) | `actions/service-requests.ts` (₦5,000 `app_settings.booking_fee`), `ServiceRequestForm.tsx`, webhook confirmation |
| Bookings dashboard | `dashboard/bookings/page.tsx` → `getServiceRequestsForLawyer()`, role-gated |
| Lawyard Lens courses | `20261016000006_lens_courses.sql`, `actions/courses.ts`, `/lens` + `/lens/[slug]`, Paystack checkout, ₦200k → ₦150k subscriber discount |
| Content Studio (articles + podcasts) | `forms/PublishArticleForm.tsx`, `PublishPodcastForm.tsx` |
| Post caps + credit ledger | `lib/directory/publishing.ts` (free 1 lifetime → paid 3/mo → ₦20,000 extra), `PublishQuotaBanner`, `20261016000002` |
| Publishing surfaced on /directory/insights | Real `getArticles({limit:30})` grid, no longer a stub |
| Intro video — premium-gated | `upload-intro-video.ts` (Supabase `intro-videos` bucket, 25MB) **or** external URL (`IntroVideoField.tsx`) |
| Private pricing | `hide_price` toggle (`LawyerForm.tsx:436`), profile renders "Contact for pricing" |
| Slack editorial workflow (articles, podcasts, corporate posts, press releases) | `lib/slack.ts`, `app/api/slack/interactions` |
| WordPress publishing + media/tags/categories sync | `lib/wordpress.ts` |
| Coupon-gated article publishing | `actions/content.ts` + `components/ui/coupon-input.tsx` |
| Corporate posts (3 tiers, Paystack, admin review, scheduling) | `app/directory/corporate-posts/*` |
| Shop + cart + checkout + orders | `app/(main)/shop`, `app/dashboard/orders` |
| Paystack payments + webhook (HMAC-SHA512) | `lib/api/paystack.ts`, `app/directory/api/webhooks/paystack` |
| Plans table (DB-managed pricing) | `actions/plans.ts`, `getPlans()` — *values still dollar-era, see 🟡* |
| Coupons (server-side enforced) + admin coupons UI | `app/admin/coupons`, coupons table |
| Subscription expiry cron | `app/directory/api/cron` (Vercel Cron, daily) |
| Verification flow (admin review) + Verified badge on cards | `app/admin/verifications`, `LawyerCard.tsx` |
| Per-lawyer analytics — profile views + 14-day sparkline, inquiry trends | `AnalyticsSparkline.tsx`, `actions/analytics.ts` |
| Admin — lawyers CRUD, content manager, subscribers, settings, transactions, pipeline | `app/admin/*` |
| Route restructure (clean URLs, no `/directory` prefix) + middleware subdomain routing | `middleware.ts` |
| Error boundary (root + directory) | `app/error.tsx`, `app/directory/error.tsx` *(not "all routes" — see 🟡)* |
| Password visibility toggles, forgot-password modal, social icons in email footer | — |

---

## 2. Partial 🟡

| Feature | Gap |
|---|---|
| **Gallery plan caps** | Caps defined (free 3 / premium 6 / firm 12) `lib/directory/publishing.ts:52-61` and passed in the lawyer + chamber forms, but **server-side enforcement is incomplete**: `submit-listing.ts:65,74` calls `galleryCapFor(tier)` without `isFirm`, so the firm cap isn't enforced; `chamber-form.tsx` writes straight from the browser Supabase client — **no server enforcement for chambers at all**. |
| **Pricing currency** | `lib/currency.ts` formats NGN correctly, but `plans` is still seeded with dollar-era values (`20260629000002_update_plans_data_exact.sql`: `20.00`, `2.00`) and the table has **no currency column** — pages therefore render "₦20 / ₦2". Only the new `app_settings` prices (booking fee, course price, extra-post credits) are correctly NGN. Blocked on Tobi's 5 prices (Q2–Q6). |
| **Silver tier** | Visible in the ladder and rank map (`publishing.ts:10,19`), upgrade card `BillingUpgradeCards.tsx:20` — but the plan rows are **₦0 with empty features** (`20261016000002:47-56`, marked PLACEHOLDER). Needs C21 contents. |
| **Bookmarks** | Kept and renamed "Saved Lawyers", but the bookmark button renders **only on the profile page** (`lawyer/[id]/page.tsx:180`); `LawyerCard` accepts `bookmarked` and ignores it (`_bookmarked`), so cards have no save affordance. |
| **Calendly removal** | UI is gone (form + profile), column kept by decision — but dead state/type fields remain (`LawyerForm.tsx:76,86,163`, `lawyer/[id]/page.tsx:42` never rendered). |
| **Verified badge** | Card-level done; confirm profile-level + "Claim Badge" flow. |
| **Error boundaries** | Only two (`app/error.tsx`, `app/directory/error.tsx`) — no `app/admin/error.tsx`, no dashboard-level boundary. |

---

## 3. Scaffolded but empty 🟦

Route directories exist but contain **no `page.tsx`** — dead scaffolding. Confirmed 2026-11-04 that **no nav links point at them** (sidebar only links `/dashboard/bookings`, which resolves).

| Feature | Path |
|---|---|
| Live chat dashboard | `app/directory/dashboard/chat/` |
| Wallet | `app/directory/dashboard/wallet/` |
| Packages | `app/directory/dashboard/packages/` |
| Legislations (directory) | `app/directory/legislations/page.tsx` → `ComingSoon` only |

---

## 4. Not started 🔴

| Feature | Tier | Notes |
|---|---|---|
| Live chat | 4 | Empty dashboard dir; pricing page advertises it. |
| Admin product analytics (signups · subscribers · revenue · funnel) | 5 | No `app/admin/analytics`. Stats exist only as a block on `app/admin/page.tsx:19`. **Scope confirmed 2026-10-16** (distinct from per-lawyer widgets). |
| Admin enhancements — CSV export, growth charts, multi-admin roles, audit log, corporate-post analytics, WYSIWYG | 6 | — |
| Infrastructure hardening | 7 | — |
| Unit + E2E tests, CI/CD, monitoring, backup strategy | — | README "Testing & Infra" |

---

## 5. 12 Sep call 💬 → mostly built ✅

Agreed with Tobi 2026-09-12. Full context: `HANDOFF.md` §6. **Item-by-item walkthrough + build outcome: [`docs/TOBI-12SEP-CHANGES.md`](TOBI-12SEP-CHANGES.md).**

Built and verified in code (2026-11-04): tier ladder, featured ranking, post caps + paid extras, insights surfacing, premium intro video (upload or URL), Lens courses, chamber parity, private pricing, service requests + paid bookings, no Calendly (UI), chamber admin + PR publishing, dashboard cleanup, NGN formatting, chamber→law-firm labels, gallery caps *(UI + lawyer path; enforcement gap above)*.

Still open:

| Feature | Detail |
|---|---|
| **Chambers tier (separate pricing)** | Chamber subscribes at its own price point; enterprise ₦3–5M/annum discussed vs ₦155k individual — needs Tobi's figures (C01/C04, Q1/Q9). |
| **Silver tier contents** | Ladder built (Free→Silver→Premium) but silver plans are ₦0 placeholders — Tobi owes the note (C21, Q8). |
| **Remove "link to directory" attribution** | Intent unclear — confirm with Tobi (C13, Q10). No attribution badge exists in code today. |
| **Move to AWS** | Decided **no build** — stay on Supabase; self-host on DigitalOcean only if Shefiu insists (C19). |
| **Foreign-currency listings** | NGN shipped end-to-end; foreign-listing handling still TBD (C20). |

---

## 6. Known defects found in the 2026-11-04 verification

| # | Defect | Evidence | Impact |
|---|---|---|---|
| D1 | `plans` still seeded in USD and formatted as NGN | `20260629000002_update_plans_data_exact.sql:13,24`; no currency column in `20260628000001_create_plans_table.sql` | Every plan page shows **₦20 / ₦2**. Blocked on Q2–Q6. |
| D2 | Firm/law-firm gallery cap not enforced server-side; chamber gallery not validated at all | `submit-listing.ts:65,74` (no `isFirm`), `chamber-form.tsx` browser-client write | Free users can exceed caps via the chamber form. |
| D3 | Silver plan rows are ₦0 with no features | `20261016000002:47-56` (PLACEHOLDER) | Pricing page advertises an empty tier. |
| D4 | Corporate-posts Basic tier still on test price ₦100 | `lib/corporate-posts.json:6-7` | Do not ship to production pricing. |
| D5 | Bookmark affordance absent from cards | `LawyerCard.tsx` destructures `_bookmarked` and ignores it | "Saved Lawyers" only usable from a profile page. |
| D6 | Dead Calendly state/type fields after UI removal | `LawyerForm.tsx:76,86,163`, `lawyer/[id]/page.tsx:42` | Dead code; misleads future readers. |
| D7 | Three empty dashboard dirs (chat/wallet/packages) | `app/directory/dashboard/{chat,wallet,packages}/` | Harmless, but suggests shipped features. |
| D8 | No admin analytics route | no `app/admin/analytics` | Tier 5 blocked. |
| D9 | Error boundaries on only two routes | `app/error.tsx`, `app/directory/error.tsx` | Admin + dashboard failures fall to the root boundary. |

Security findings are **not** duplicated here — see [`docs/AUDIT-2026-10-20.md`](AUDIT-2026-10-20.md).

---

## 7. Must-do before public launch

| Item | Status |
|---|---|
| Rate limiting (Upstash Redis) on forms | 🔴 |
| pg_cron: auto-archive `pending_payment` > 24h | 🔴 |
| PDF download infrastructure | 🔴 |
| Error boundaries on all routes | 🟡 (D9) |
| 301 redirects from old WordPress URLs | 🔴 |
| Email notification system | 🔴 |
| Subscription expiry cron | ✅ |
| Paystack webhook fix (service role, chamber subs, featured) | ✅ |
| Plans priced in NGN | 🔴 (D1 — blocked on Tobi Q2–Q6) |

---

## 8. Open questions (blocking)

**Chamber subscription model** — confirmed *per member lawyer* (seat-based) but flagged uncertain; confirm with Tobi. *(from C01)*
**Pricing — 5 NGN prices unset:** Premium Single (Lawyer, 365d) · Premium Package (Lawyer, 365d) · Premium Single (Client, 90d) · Premium Package (Client, 90d) · Premium (Chamber, 365d).
**Plus:** scrap the 60-min corporate-post clash detection? (blocks back-to-back posts from different brands)

> Accumulating list as the 12 Sep walkthrough proceeds: [`docs/TOBI-12SEP-CHANGES.md`](TOBI-12SEP-CHANGES.md) § *Questions for Tobi*.

---

## Maintenance

- **Update this board** whenever a feature ships or a decision lands — same pass as `CHANGELOG.md` / `TIMELINE.md`.
- **Never trust the docs alone:** re-verify 🟡/🟦 rows against code before marking ✅. Last full sweep: 2026-11-04.
- Superseded by this file: the `README.md` §Status table and `docs/features.md` (task archive; references a missing `AGENT_TASKS.md`).
