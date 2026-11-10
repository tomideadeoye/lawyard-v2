# Lawyard v2 — Feature Status Board

> **GENERATED FILE — do not edit by hand.** Source of truth: `docs/data/features.json`, `docs/data/defects.json`,
> `docs/data/changeset.json`, `docs/data/questions.json`.
> Regenerate: `pnpm run docs:render` · Gate: `pnpm run docs:check`.
>
> Reconciled from README §Status, `CHANGELOG.md`, `docs/features.md`, `HANDOFF.md` §6 (12 Sep decisions).
> **Re-verified against the codebase: 2026-11-04** — after the 12 Sep changeset shipped (`164510d`).
> Replaces the README status table and `docs/features.md` as the source of truth for "is it built?".

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
| ⏸ | Parked — decided not to build |

## 1. Shipped ✅

| Feature | Evidence / notes |
|---|---|
| Auth — email/password, Google OAuth, magic link, password recovery | `app/directory/login` · `components/directory/auth` · `lib/auth/oauth-account.ts` |
| Account settings — profile, password, email change, delete | `app/directory/dashboard/settings/page.tsx` · `components/directory/dashboard/EmailChangeDialog.tsx` · `components/directory/dashboard/DeleteAccountDialog.tsx` |
| Branded auth emails (Brevo auth hook) | `app/api/auth/hook/route.ts` — Verify URLs always built on NEXT_PUBLIC_SUPABASE_URL (fixed in 05caa76). |
| Turnstile CAPTCHA on auth flows | `components/directory/auth/TurnstileWidget.tsx` |
| Lawyer multi-step profile wizard | `components/directory/forms/LawyerForm.tsx` · `components/directory/forms/FormStep.tsx` |
| Working-hours editor | `components/directory/forms/listing/WorkingHoursEditor.tsx` · `components/directory/forms/LawyerForm.tsx` |
| Gallery upload | `components/directory/forms/listing/GalleryUpload.tsx` · `components/directory/forms/LawyerForm.tsx` |
| FAQs, social links, awards, publications, memberships | `supabase/migrations/20260617000001_extend_lawyers_table.sql` · `components/directory/forms/listing/FaqEditor.tsx` · `components/directory/forms/listing/SocialLinksEditor.tsx` |
| Law Firm (chamber) management + public page, full parity | `app/directory/chamber/[id]/page.tsx` · `app/directory/dashboard/chamber/page.tsx` · `app/directory/dashboard/chamber/chamber-form.tsx` — Hours, FAQs, gallery, intro video all render on the public page. |
| Chamber site-admin role + press-release publishing | `supabase/migrations/20261016000007_chamber_admins.sql` · `app/directory/actions/press-releases.ts` · `app/directory/dashboard/chamber/publish-press-release-form.tsx` |
| Search — specialty, location, rating, price, experience + keyword | `app/directory/search/page.tsx` · `components/directory/search/SearchFilters.tsx` |
| Featured-first ranking + Featured badge | `lib/directory/api.ts` · `components/directory/LawyerCard.tsx` |
| Lawyer public profile page | `app/directory/lawyer/[id]/page.tsx` |
| Reviews — submit, display, auto-rating | `components/directory/ReviewsSection.tsx` |
| Client inquiries inbox | `app/directory/dashboard/inquiries/page.tsx` · `app/directory/actions/inquiries.ts` |
| Service requests — structured + payable | `app/directory/actions/service-requests.ts` · `app/directory/lawyer/[id]/ServiceRequestForm.tsx` · `supabase/migrations/20261016000003_service_requests.sql` — ₦5,000 booking fee seeded in app_settings; confirmed by the Paystack webhook. |
| Bookings dashboard | `app/directory/dashboard/bookings/page.tsx` · `app/directory/dashboard/bookings/bookings-client.tsx` |
| Lawyard Lens courses + subscriber discount | `app/directory/lens/page.tsx` · `app/directory/lens/[slug]/page.tsx` · `app/directory/actions/courses.ts` · `supabase/migrations/20261016000006_lens_courses.sql` — AI Governance seeded ₦200k, ₦150k for directory subscribers; Paystack checkout. |
| Content Studio — articles + podcasts | `components/directory/forms/PublishArticleForm.tsx` · `components/directory/forms/PublishPodcastForm.tsx` |
| Post caps + credit ledger | `lib/directory/publishing.ts` · `app/directory/actions/publishing.ts` · `app/directory/dashboard/publish/PublishQuotaBanner.tsx` · `supabase/migrations/20261016000002_post_caps_and_credits.sql` — Free 1 lifetime → paid 3/month → ₦20,000 extra-post credits. |
| Published articles surface on /directory/insights | `app/directory/insights/page.tsx` |
| Intro video — premium-gated, upload or external URL | `app/directory/actions/upload-intro-video.ts` · `components/directory/forms/listing/IntroVideoField.tsx` · `supabase/migrations/20261016000004_intro_videos_bucket.sql` — Supabase storage bucket (25MB cap) rather than R2; external YouTube/Vimeo URL accepted too. |
| Private pricing — hide the number, keep the section | `supabase/migrations/20261016000001_add_hide_price_to_lawyers.sql` · `components/directory/forms/LawyerForm.tsx` · `app/directory/lawyer/[id]/page.tsx` — Profile renders 'Contact for pricing'; search cards have no price field, so the toggle is moot there. |
| Slack editorial workflow (articles, podcasts, corporate posts, PR) | `lib/slack.ts` · `app/api/slack/interactions/route.ts` |
| WordPress publishing + media/tags/categories sync | `lib/wordpress.ts` |
| Coupon-gated article publishing | `app/directory/actions/content.ts` · `components/ui/coupon-input.tsx` |
| Corporate posts — 3 tiers, Paystack, admin review, scheduling | `app/directory/corporate-posts/page.tsx` · `app/directory/corporate-posts/submit/page.tsx` · `app/actions/corporate-posts.ts` |
| Shop + cart + checkout + orders | `app/(main)/shop` · `app/dashboard/orders/page.tsx` |
| Paystack payments + webhook (HMAC-SHA512) | `lib/api/paystack.ts` · `app/directory/api/webhooks/paystack/route.ts` |
| Plans table (DB-managed pricing) | `app/directory/actions/plans.ts` · `supabase/migrations/20260628000001_create_plans_table.sql` — Mechanism works; the seeded values are dollar-era — see D1. |
| Coupons — server-side enforced + admin UI | `app/admin/coupons/page.tsx` · `app/actions/validate-coupon.ts` |
| Subscription expiry cron | `app/directory/api/cron/expire-subscriptions/route.ts` |
| Verification flow (admin review) + Verified badge on cards | `app/admin/verifications/verifications-table.tsx` · `components/directory/LawyerCard.tsx` |
| Per-lawyer analytics — profile views, 14-day sparkline, inquiry trends | `components/directory/dashboard/AnalyticsSparkline.tsx` · `app/directory/actions/analytics.ts` |
| Admin suite — lawyers, content, subscribers, settings, transactions, pipeline | `app/admin/page.tsx` · `app/admin/lawyers/page.tsx` · `app/admin/pipeline/actions.ts` |
| Route restructure (clean URLs) + middleware subdomain routing | `middleware.ts` |
| Error boundary — root + directory | `app/error.tsx` · `app/directory/error.tsx` |
| Auth UX polish — password toggles, forgot-password modal, email footer | `components/directory/auth` |

## 2. Partial 🟡

| Feature | Gap |
|---|---|
| Gallery plan caps | Caps defined (free 3 / premium 6 / firm 12) but the firm cap is never passed server-side, and the chamber form writes from the browser client with no validation. See D2. |
| Pricing currency (NGN) | Formatter is correct, but plans are seeded with dollar-era values and the table has no currency column — pages render ₦20 / ₦2. Blocked on Q2–Q6. See D1. |
| Silver tier | Visible in the ladder and upgrade card, but the plan rows are ₦0 with empty features (PLACEHOLDER). Needs C21 contents. See D3. |
| Bookmarks — 'Saved Lawyers' | Kept and renamed, but the button renders only on the profile page; cards accept `bookmarked` and ignore it. See D5. |
| Calendly removal | UI is gone (column kept by decision), but dead state/type fields remain. See D6. |
| Verified badge at profile level + Claim Badge flow | Card-level done; profile-level badge and claim flow unconfirmed. |
| Error boundaries on all routes | No app/admin/error.tsx and no dashboard-level boundary. See D9. |

## 3. Scaffolded but empty 🟦

Route directories exist but contain **no `page.tsx`**. Confirmed 2026-11-04 that no nav link points at them.

| Feature | Path | Note |
|---|---|---|
| Legislations archive | `app/directory/legislations/page.tsx` | ComingSoon stub only. |

## 4. Not started 🔴

| Feature | Tier | Notes |
|---|---|---|
| Live chat dashboard | — | Directory exists with no page.tsx; no nav link points at it. |
| Wallet | — | Empty dir; no nav link. |
| Packages | — | Empty dir; no nav link. |
| Live chat | 4 | Pricing page advertises live chat; no code. |
| Admin product analytics — signups, subscribers, revenue, funnel | 5 | No app/admin/analytics; stats live as a block on the dashboard. |
| Admin enhancements — CSV export, growth charts, multi-admin, audit log, WYSIWYG | 6 | No work started. |
| Infrastructure hardening | 7 | No work started. |
| Unit + E2E tests, CI/CD, monitoring, backup strategy | — | README 'Testing & Infra' section only. |

## 5. 12 Sep call — what's still open

Agreed with Tobi on 2026-09-12. Full context: `HANDOFF.md` §6. Item-by-item walkthrough: [`docs/TOBI-12SEP-CHANGES.md`](TOBI-12SEP-CHANGES.md).

**Built and verified:** 14 of 23 changeset items fully shipped · 4 partial — tier ladder, featured ranking, post caps + paid extras, insights surfacing, premium intro video, Lens courses, chamber parity, private pricing, service requests + paid bookings, no Calendly (UI), chamber admin + PR publishing, dashboard cleanup, NGN formatting, law-firm labels.

| # | Item | Status | What's blocking it |
|---|---|---|---|
| C01 | Chambers subscribe — separate pricing | 💬 | Per member lawyer (seat-based) — uncertain, confirm with Tobi (→ Q1). |
| C04 | Enterprise price ₦3–5M/annum | 💬 | Same as chamber — enterprise = chamber/law firm, one price. Exact annual figure still needs Tobi (→ Q9). |
| C10 | Profile picture only (restrict uploads) | 🟡 | Keep the gallery; enforce plan caps — free 3 / premium 6 — plus a higher cap for law firms. No blanket 'profile picture only'. Add image validation. Overrides Tobi's instinct: photos convert. |
| C13 | Remove 'link to directory' attribution | 🔴 | Q10 — Take out the 'link to directory' — remove the Link Directory feature, or a badge/attribution? |
| C16 | No Calendly / external calendar | 🟡 | Hide UI only — remove the LawyerForm field + the profile display; keep the calendly_url column in the DB (no destructive migration). |
| C18 | Dashboard cleanup (bookmarks, history) | 🟡 | Keep Bookmarks for both roles — a lawyer saving a peer is valid (referrals, co-counsel, benchmarking). Fix the confusion with clarity, not deletion: rename to 'Saved Lawyers'. Also clean up the subscription/history section. |
| C19 | Move to AWS | ⏸ | Keep building with Supabase. If Shefiu insists on DigitalOcean, self-host Supabase on DO (code unchanged). No full migration off Supabase — 66 files are coupled to the SDK: auth, createClient, RLS, Storage. |
| C20 | Currency — Naira for Nigeria | 🟡 | Q2 — Premium Single (Lawyer, 365d) — NGN price?<br>Q3 — Premium Package (Lawyer, 365d) — NGN price?<br>Q4 — Premium Single (Client, 90d) — NGN price?<br>Q5 — Premium Package (Client, 90d) — NGN price?<br>Q6 — Premium (Chamber / Law Firm, 365d) — NGN price? |
| C21 | Silver category (which items stay/add) | 💬 | Q8 — Silver category — which items stay vs get added? |

## 6. Known defects (3 open)

Found by the 2026-11-04 code verification. Security findings are **not** duplicated here — see [`docs/AUDIT-2026-10-20.md`](AUDIT-2026-10-20.md).

| # | Defect | Severity | Impact | Evidence |
|---|---|---|---|---|
| D1 | Plans still seeded in USD but formatted as NGN | high | Every plan page renders ₦20 / ₦2. Blocked on Q2–Q6. | `supabase/migrations/20260629000002_update_plans_data_exact.sql` · `supabase/migrations/20260628000001_create_plans_table.sql` · `lib/currency.ts` |
| D2 | Firm/law-firm gallery cap not enforced server-side; chamber gallery unvalidated | high | Free users can exceed gallery caps via the chamber form. | `app/directory/actions/submit-listing.ts` · `app/directory/dashboard/chamber/chamber-form.tsx` · `lib/directory/publishing.ts` |
| D3 | Silver plan rows are ₦0 with no features | high | The pricing page advertises an empty middle tier. | `supabase/migrations/20261016000002_post_caps_and_credits.sql` |
| D4 | Corporate-posts Basic tier shipped on the ₦100 test price | medium | Every Corporate Posts surface advertised ₦100, and Paystack would have charged ₦100 for the Basic tier. | `lib/corporate-posts.json` · `app/directory/corporate-posts/page.tsx` · `app/directory/corporate-posts/submit/page.tsx` |
| D5 | Bookmark affordance absent from cards | low | 'Saved Lawyers' is only usable from a profile page. | `components/directory/LawyerCard.tsx` · `app/directory/lawyer/[id]/page.tsx` |
| D6 | Dead Calendly state/type fields after UI removal | low | Dead code; misleads future readers into thinking Calendly is supported. | `components/directory/forms/LawyerForm.tsx` · `app/directory/lawyer/[id]/page.tsx` |
| D7 | Three empty dashboard dirs (chat, wallet, packages) | low | Harmless, but suggests shipped features; no nav links point at them. | `app/directory/dashboard` |
| D8 | No admin analytics route | medium | Tier 5 telemetry (signups, subscribers, revenue, funnel) is blocked. | `app/admin/page.tsx` |
| D9 | Error boundaries on only two routes | low | Admin and dashboard failures fall through to the root boundary. | `app/error.tsx` · `app/directory/error.tsx` |
| D10 | Category filtering used `.eq()` on a TEXT[] column — every category page 400'd and rendered empty | high | `/insights?category=*` and `/category/*` returned 404/empty because PostgREST rejected `category=eq.news` with "malformed array literal". Corporate Posts were invisible for the same reason. | `lib/api/articles.ts` · `app/(main)/insights/page.tsx` · `app/(main)/category/[slug]/page.tsx` · `app/directory/knowledge/category/[id]/page.tsx` |
| D11 | Corporate Posts listing fetched the 50 newest articles then filtered in JS | medium | Any burst of ordinary published articles pushed Corporate Posts off the listing entirely. | `app/directory/corporate-posts/page.tsx` · `lib/api/articles.ts` |
| D12 | Email verification links land signed-out (PKCE code / implicit hash) | high | Confirmation links went to GoTrue /auth/v1/verify, which redirects with ?code= (needs the code-verifier cookie, so it fails on a phone) or #access_token (a fragment no route can read). Users were verified but signed out. | `lib/auth/confirm.ts` · `app/auth/confirm/route.ts` · `app/directory/auth/confirm/route.ts` · `app/api/auth/hook/route.ts` |

**Fix notes**

- **D1** — Add a currency column to plans and re-seed with Tobi's NGN figures once Q2–Q6 are answered.
- **D2** — Firm gallery cap now applied server-side (chamber role or chamber_id); the chamber form writes through a server action that clamps the gallery, gates the intro video and checks chamber_admin membership.
- **D3** — Fill features + price once Tobi answers Q8 (C21 contents).
- **D4** — Set Basic to ₦100,000 in lib/corporate-posts.json (price + formatted_price) and dropped the "TEST PRICE" description. Deployed and verified in the live HTML.
- **D5** — LawyerCard renders BookmarkButton when signed in, on both grid and list variants; the list variant stops click propagation so bookmarking does not navigate.
- **D6** — Removed the leftover calendly_url field from LawyerForm state and the public profile type.
- **D7** — Deleted the empty dashboard directories (chat, wallet, packages) so no nav-less shells imply shipped features.
- **D8** — Build app/admin/analytics on top of getAdminStats + revenue queries.
- **D9** — Added route-level error boundaries at app/admin/error.tsx and app/directory/dashboard/error.tsx, so admin and dashboard failures no longer fall through to the root boundary.
- **D10** — Added `categoryCandidates()` and switched every category filter to `.overlaps()` (&&), matching both slug and label spellings. Verified on prod data: news 1000+, opinions 235, judgements 30, sports-law 6, corporate-post 2.
- **D11** — Filter server-side with `article_type = corporate_post` via the new `articleType` option on `getPublishedArticles()`.
- **D12** — Added lib/auth/confirm.ts using verifyOtp({type, token_hash}) — no cookie needed — served at /auth/confirm on both hosts; the hook now mails that link and keeps ?next=. Verified live: session cookie set, redirect to /search.

## 7. Must-do before public launch

| Item | Status |
|---|---|
| Rate limiting (Upstash Redis) on forms | 🔴 |
| pg_cron: auto-archive pending_payment > 24h | 🔴 |
| PDF download infrastructure | 🔴 |
| Error boundaries on all routes | 🟡 |
| 301 redirects from old WordPress URLs | 🔴 |
| Email notification system | 🔴 |
| Subscription expiry cron | ✅ |
| Paystack webhook fix (service role, chamber subs, featured) | ✅ |
| Plans priced in NGN | 🔴 |

## 8. Open questions (blocking)

- **Q1** — Chamber subscription model — per member lawyer (seat-based), or flat per chamber? *(from C01)*
- **Q2** — Premium Single (Lawyer, 365d) — NGN price? *(from C20)*
- **Q3** — Premium Package (Lawyer, 365d) — NGN price? *(from C20)*
- **Q4** — Premium Single (Client, 90d) — NGN price? *(from C20)*
- **Q5** — Premium Package (Client, 90d) — NGN price? *(from C20)*
- **Q6** — Premium (Chamber / Law Firm, 365d) — NGN price? *(from C20)*
- **Q7** — Scrap the 60-min corporate-post clash detection? (blocks back-to-back posts from different brands) *(from )*
- **Q8** — Silver category — which items stay vs get added? *(from C21)*
- **Q9** — Exact annual figure for enterprise / law firm (range heard as ₦3–5M — confirm) *(from C04)*
- **Q10** — Take out the 'link to directory' — remove the Link Directory feature, or a badge/attribution? *(from C13)*
- **Q11** — Booking fee amount (client → Lawyard, before the slot is confirmed) *(from C15)*

> Accumulating list: [`docs/TOBI-12SEP-CHANGES.md`](TOBI-12SEP-CHANGES.md) § *Questions for Tobi*.

---

## Maintenance

- **Never edit this file.** Add or change a row in `docs/data/*.json`, then run `pnpm run docs:render`.
- **Never trust the docs alone:** re-verify 🟡/🟦 rows against code before flipping a status, and set `verified` in `features.json`.
- `pnpm run docs:check` fails if this file and the JSON disagree, if an id is duplicated, if a cross-reference dangles, or if an evidence path no longer exists.
- Superseded by this system: the `README.md` §Status table and `docs/features.md`.
