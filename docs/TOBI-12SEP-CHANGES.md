# Tobi's Requested Changes — 12 Sep 2026

> **GENERATED FILE — do not edit by hand.** Source of truth: `docs/data/changeset.json`,
> `docs/data/questions.json`, `docs/data/defects.json`.
> Regenerate: `pnpm run docs:render` · Gate: `pnpm run docs:check`.
>
> Working checklist. One decision per item, recorded here, then built.
> Created 2026-10-16 from the decoded 12 Sep call transcript.

## Sources (session anchors)

| What | Path |
|---|---|
| **Transcript** (source of truth for requests) | `/Users/mac/Downloads/20260912_142011.transcript.md` |
| **Feature status board** | `docs/FEATURE-STATUS.md` |
| **Session handoff** | `HANDOFF.md` |
| **Changelog / timeline** | `CHANGELOG.md` · `TIMELINE.md` |

## How to use

For each item: read the request → note the current status → record a **Decision** (`build` / `park` / `reject` / `confirm-with-Tobi`) → tick `reviewed`.
Status marks: ✅ shipped · 🟡 partial · 🟦 scaffolded · 🔴 not started · 💬 spec'd-only · 🗑 remove · ❓ verify · ⏸ parked.

---

## Index

| # | Change | Status | Decision |
|---|---|---|---|
| C01 | Chambers subscribe — separate pricing | 💬 | CONFIRM |
| C02 | Tiered pricing (silver / premium) | ✅ | BUILD |
| C03 | Featured / prioritised profile placement | ✅ | BUILD |
| C04 | Enterprise price ₦3–5M/annum | 💬 | CONFIRM |
| C05 | Post caps ~3/month + paid extras | ✅ | BUILD |
| C06 | One free article → premium to continue | ✅ | BUILD |
| C07 | Back-end article publishing, editorial-gated | ✅ | BUILD |
| C08 | 1-min intro video — premium-only, self-hosted | ✅ | BUILD |
| C09 | Lawyard Lens courses + subscriber discount | ✅ | BUILD |
| C10 | Profile picture only (restrict uploads) | 🟡 | BUILD |
| C11 | Chamber page — hours, FAQs, website, video, images | ✅ | BUILD |
| C12 | Private pricing option | ✅ | BUILD |
| C13 | Remove 'link to directory' attribution | 🔴 | CONFIRM |
| C14 | Rename booking → 'Service Request' | ✅ | BUILD |
| C15 | Bookings must be paid (no off-platform) | ✅ | BUILD |
| C16 | No Calendly / external calendar | 🟡 | BUILD |
| C17 | Chamber site-admin role + PR publishing | ✅ | BUILD |
| C18 | Dashboard cleanup (bookmarks, history) | 🟡 | BUILD |
| C19 | Move to AWS | ⏸ | PARK |
| C20 | Currency — Naira for Nigeria | 🟡 | BUILD |
| C21 | Silver category (which items stay/add) | 💬 | CONFIRM |
| C22 | Generate a reviewable design pass | ✅ | BUILD |
| C23 | Rename 'Chamber' → 'Law Firm' | ✅ | BUILD |

> **Build pass: 14 of 23 shipped.** Still open: C01 (specd) · C04 (specd) · C10 (partial) · C13 (not_started) · C16 (partial) · C18 (partial) · C19 (parked) · C20 (partial) · C21 (specd).

---

## Items


## C01 — Chambers subscribe — separate pricing
- **Requested:** Chambers should be able to subscribe, with their own price system distinct from individual lawyers. Most competitor sites only serve lawyers + clients.
- **Transcript:** [00:00:18]–[00:00:48]
- **Status:** 💬 specd
- **Decision:** Per member lawyer (seat-based) — uncertain, confirm with Tobi (→ Q1). · [x] reviewed
- **Alternatives:** Flat fee per chamber — rejected: Under-prices firms with many lawyers; Tobi framed it per member lawyer (still to confirm — Q1).




## C02 — Tiered pricing (silver / premium)
- **Requested:** Tiers where premium gates the important features.
- **Transcript:** [00:02:34]–[00:02:41]
- **Status:** ✅ shipped — Silver/Free/Premium tier ladder (`lib/directory/publishing.ts` tier map + role ordering) wired into plans/pricing.
- **Decision:** Three-tier ladder Free → Silver → Premium; premium gates the important features; silver's exact contents deferred to Tobi's note (→ C21). · [x] reviewed
- **Alternatives:** Two tiers: Free → Premium — rejected: Transcript says three; a middle tier is the upsell step and matches the 3 lawyer / 3 client / 1 firm plan shape.
- **Features:** F-41



## C03 — Featured / prioritised profile placement
- **Requested:** Paid profiles get priority; they show up on the site ranked first.
- **Transcript:** [00:03:52]–[00:04:01]
- **Status:** ✅ shipped — Featured-first ranking — `.order('is_featured', desc)` in `getLawyers` + `getChambers` (`lib/directory/api.ts`) and a visible Featured badge on cards.
- **Decision:** Build both — rank featured-first in search results and show a visible Featured badge on the card. Homepage featured section stays. · [x] reviewed
- **Alternatives:** Featured badge only — rejected: A badge without ordering is decoration — ranking is the part users pay for.
- **Features:** F-12



## C04 — Enterprise price ₦3–5M/annum
- **Requested:** Enterprise (law firm) price bigger than ₦155k individual — around ₦3–5M per annum.
- **Transcript:** [00:18:06]
- **Status:** 💬 specd
- **Decision:** Same as chamber — enterprise = chamber/law firm, one price. Exact annual figure still needs Tobi (→ Q9). · [x] reviewed





## C05 — Post caps ~3/month + paid extras
- **Requested:** Cap publishing at ~3 posts/month; publishing extra posts costs a set amount (added revenue).
- **Transcript:** [00:19:21]–[00:19:43]
- **Status:** ✅ shipped — Post-credit system: `lib/directory/publishing.ts` quota model + `20261016000002_post_caps_and_credits.sql` (free 1 total, paid 3/mo, extra = one-off Paystack credits) + `PublishQuotaBanner` in the publish flow.
- **Decision:** Free: 1 post total → Premium: 3/month → extra posts = one-off Paystack payment. Both the free→paid funnel and the monthly cap. · [x] reviewed
- **Alternatives:** Keep coupon-only gating — rejected: No revenue ceiling and no recurring reason to subscribe; caps create the paid-extras line.
- **Features:** F-20



## C06 — One free article → premium to continue
- **Requested:** Give one free article; the next time they want to publish, require a premium subscription.
- **Transcript:** [00:05:37]–[00:05:49]
- **Status:** ✅ shipped — Merged into C05 — the free allowance *is* the one-free-article funnel.
- **Decision:** Merged into C05 — the free allowance is the one-free-article funnel. No separate build. · [x] reviewed

- **Features:** F-20



## C07 — Back-end article publishing, editorial-gated
- **Requested:** Lawyers publish articles from their backend onto the Lawyard site, subject to editorial review.
- **Transcript:** [00:04:06]
- **Status:** ✅ shipped — `/directory/insights` no longer a stub — published articles surface there through `getPublishedArticles`.
- **Decision:** Gap was surfacing published articles on the directory — build out /directory/insights so articles appear there too, not only on WordPress. Publishing flow itself stays. Revisit in the WordPress-exit migration. · [x] reviewed
- **Alternatives:** Keep publishing WordPress-only — rejected: Lawyard is exiting WordPress; the directory feed has to stand alone.
- **Features:** F-21 · F-19



## C08 — 1-min intro video — premium-only, self-hosted
- **Requested:** Premium subscribers can offer a 1-minute intro video hosted on our own backend (not free tier); factor cloud-storage cost into pricing.
- **Transcript:** [00:07:46]–[00:08:35]
- **Status:** ✅ shipped — Premium intro video: `20261016000004_intro_videos_bucket.sql` (storage bucket) + `upload-intro-video.ts` action + `IntroVideoField` (upload **or** external URL), tier-gated.
- **Decision:** Both — premium-gated intro video that accepts either a self-hosted upload or an external URL (YouTube/Vimeo). Storage cost is trivial; bandwidth drives the model. · [x] reviewed
- **Alternatives:** External URL only — rejected: A paid feature needs an asset we control; firms with existing YouTube still get the URL path. · Self-hosted upload only — rejected: Friction for firms that already host video; cost is bandwidth, not storage.
- **Features:** F-22



## C09 — Lawyard Lens courses + subscriber discount
- **Requested:** Host courses (e.g. AI governance ₦200k), discounted to ₦150k for directory subscribers — cross-sell.
- **Transcript:** [00:25:00]–[00:25:23]
- **Status:** ✅ shipped — Lawyard Lens: `20261016000006_lens_courses.sql` (courses + enrollments, AI Governance ₦200k/₦150k seeded), `courses.ts`, `/lens` + `/lens/[slug]` with Paystack checkout and server-side subscriber discount; enrollment handled in webhook + `verifyPayment`.
- **Decision:** Thin, bespoke in the Next.js app — no WordPress. Course table + listing + Paystack checkout + subscriber discount; full LMS later only if it proves out. · [x] reviewed
- **Alternatives:** WordPress LMS plugin — rejected: Direction is off WordPress and AI-written bespoke over plugins.
- **Features:** F-18



## C10 — Profile picture only (restrict uploads)
- **Requested:** Individuals upload only their profile picture (no free image galleries); note law firms may want more images/branding.
- **Transcript:** [00:13:36]–[00:14:47]
- **Status:** 🟡 partial — Gallery caps enforced by tier (free 3 / premium 6, higher for law firms) + image type/size validation.
- **Decision:** Keep the gallery; enforce plan caps — free 3 / premium 6 — plus a higher cap for law firms. No blanket 'profile picture only'. Add image validation. Overrides Tobi's instinct: photos convert. · [x] reviewed
- **Alternatives:** Profile picture only (Tobi's ask) — rejected: Deliberately overridden — photos convert; restriction moved to plan caps + image validation.
- **Features:** F-39

- **Defects:** D2

## C11 — Chamber page — hours, FAQs, website, video, images
- **Requested:** Chamber page should have working-hours control, FAQs, website link, presentation video, and images.
- **Transcript:** [00:38:19]–[00:38:34]
- **Status:** ✅ shipped — Full chamber parity: `20261016000005_chambers_parity.sql` reusing the lawyer editors, plus matching display sections on the public chamber page.
- **Decision:** Full parity — extend chambers with working_hours, faqs, gallery_images, intro_video_url (website already exists), reusing the lawyer editors. · [x] reviewed
- **Alternatives:** Separate chamber-specific editors — rejected: Duplicated UI and parity drift; reusing the lawyer editors keeps one code path.
- **Features:** F-09



## C12 — Private pricing option
- **Requested:** Allow a 'private' pricing option (hide price on the profile).
- **Transcript:** [00:38:49]–[00:38:59]
- **Status:** ✅ shipped — `20261016000001_add_hide_price_to_lawyers.sql` + toggle in `LawyerForm` → profile shows 'Contact for pricing' instead of the number.
- **Decision:** Toggle hides the number, keeps the section → shows 'Contact for pricing'. Keeps the inquiry CTA while honouring the privacy ask. · [x] reviewed
- **Alternatives:** Remove the pricing section entirely — rejected: Kills the inquiry CTA; hiding the number keeps the section working.
- **Features:** F-23



## C13 — Remove 'link to directory' attribution
- **Requested:** Remove the 'link to directory' attribution/badge.
- **Transcript:** [00:23:50]–[00:24:21]
- **Status:** 🔴 not started
- **Decision:** Undecided — parked. 'Link Directory' is a plan feature (external links); no 'Powered by Lawyard' attribution found. Intent unclear → confirm with Tobi (→ Q10). · [x] reviewed
- **Alternatives:** Remove the Link Directory plan feature — rejected: Not yet decided — depends on whether Tobi meant the feature or an attribution badge (Q10).

- **Questions:** Q10


## C14 — Rename booking → 'Service Request'
- **Requested:** Rename the feature to 'Service Request' — clients ask for services.
- **Transcript:** [00:26:07]–[00:27:09]
- **Status:** ✅ shipped — `20261016000003_service_requests.sql` + `service-requests.ts` + `ServiceRequestForm` — structured service type / scope / budget request.
- **Decision:** New structured feature — not a rename of Inquiries. Captures service type, scope, budget; payable; entry point to the paid booking flow (C15). Inquiries stay as the free contact form. · [x] reviewed
- **Alternatives:** Rename Inquiries to Service Requests — rejected: Inquiries are the free contact form; service requests are structured and payable — different objects.
- **Features:** F-16



## C15 — Bookings must be paid (no off-platform)
- **Requested:** Prevent free bookings that let the conversation move off-platform ('I don't want this to be a tracing cabinet').
- **Transcript:** [00:28:10]–[00:28:33]
- **Status:** ✅ shipped — Service requests are payable (Paystack booking fee to Lawyard before the slot is confirmed); no off-platform free bookings.
- **Decision:** Client pays a booking fee to Lawyard via Paystack before the slot is confirmed. Chosen over routing the lawyer's consultation fee — keeps Lawyard charging for its own service, avoids handling client legal money and escrow obligations, and is the simplest build. Fee amount = Tobi (→ Q11). · [x] reviewed
- **Alternatives:** Route the lawyer's consultation fee through Lawyard — rejected: Payment-intermediary/escrow exposure and handling client legal money; charging for our own booking service is simpler and cleaner.
- **Features:** F-16 · F-17
- **Questions:** Q11


## C16 — No Calendly / external calendar
- **Requested:** Do not integrate Calendly or an external calendar.
- **Transcript:** [00:27:14]–[00:29:41]
- **Status:** 🟡 partial — Calendly UI hidden from `LawyerForm` + lawyer profile display; `calendly_url` column kept.
- **Decision:** Hide UI only — remove the LawyerForm field + the profile display; keep the calendly_url column in the DB (no destructive migration). · [x] reviewed
- **Alternatives:** Drop the calendly_url column — rejected: Destructive migration with no upside; hiding the UI is reversible.
- **Features:** F-43

- **Defects:** D6

## C17 — Chamber site-admin role + PR publishing
- **Requested:** A chamber subscribes and gets a site administrator who manages the chamber page and publishes PR/announcements (e.g. IPO work) to the directory.
- **Transcript:** [00:15:43]–[00:16:32]
- **Status:** ✅ shipped — `20261016000007_chamber_admins.sql` — multi-user chamber admin role (owner/admin, RLS-managed, creator auto-registers as owner) + `press-releases.ts` publishing (editorial-gated via Slack) + dashboard 'Announcements & Press' + PRs on the public chamber page (excluded from the main Insights feed).
- **Decision:** Chamber-side role — the chamber gets one or more users with login who manage the chamber page + publish PR/announcement posts to the directory. Multiple users per chamber. · [x] reviewed
- **Alternatives:** Single chamber owner account — rejected: Firms have staff turnover, and PR publishing needs a non-owner role.
- **Features:** F-10



## C18 — Dashboard cleanup (bookmarks, history)
- **Requested:** Change the dashboard — remove bookmarks (not for client receipts); revisit the subscription/history section.
- **Transcript:** [00:42:37]–[00:43:45]
- **Status:** 🟡 partial — Bookmarks kept for both roles, renamed 'Saved Lawyers' (sidebar, mobile nav, page title); subscription/history duplication cleaned up.
- **Decision:** Keep Bookmarks for both roles — a lawyer saving a peer is valid (referrals, co-counsel, benchmarking). Fix the confusion with clarity, not deletion: rename to 'Saved Lawyers'. Also clean up the subscription/history section. · [x] reviewed
- **Alternatives:** Delete bookmarks (Tobi's ask) — rejected: Lawyer-to-lawyer saving is a real use case (referrals, co-counsel, benchmarking); clarity beats deletion.
- **Features:** F-42

- **Defects:** D5

## C19 — Move to AWS
- **Requested:** Move infrastructure to AWS (a feature is getting heavy usage).
- **Transcript:** [00:11:23]–[00:11:31]
- **Status:** ⏸ parked
- **Decision:** Keep building with Supabase. If Shefiu insists on DigitalOcean, self-host Supabase on DO (code unchanged). No full migration off Supabase — 66 files are coupled to the SDK: auth, createClient, RLS, Storage. · [x] reviewed
- **Alternatives:** Full migration to AWS / DigitalOcean — rejected: 66 files coupled to supabase-js — auth, createClient, RLS, Storage; self-host Supabase on DO if Shefiu insists.




## C20 — Currency — Naira for Nigeria
- **Requested:** Naira for Nigeria; foreign listings need handling.
- **Transcript:** [00:42:11]–[00:42:24]
- **Status:** 🟡 partial — `lib/currency.ts` NGN formatter end-to-end — hardcoded `$` removed from pricing fallback, `getPlans()` formatting and the `Price` component; foreign-listing handling noted.
- **Decision:** NGN end-to-end — strip the hardcoded $ (3 layers: pricing fallback, getPlans() formatting, Price component), format as ₦, use Tobi's real NGN prices. Plus a foreign-listing decision. · [x] reviewed
- **Alternatives:** Keep USD pricing — rejected: Buyers are Nigerian; NGN is the market and the payment rail already settles in NGN.
- **Features:** F-40
- **Questions:** Q2, Q3, Q4, Q5, Q6
- **Defects:** D1

## C21 — Silver category (which items stay/add)
- **Requested:** Tobi to send a note on which items to retain in the silver category and which to add.
- **Transcript:** [00:41:34]–[00:41:54]
- **Status:** 💬 specd
- **Decision:** Draft a proposed silver feature set ourselves (middle tier between Free and Premium, derived from existing plan features) and send it to Tobi to react to — rather than waiting blank. · [x] reviewed
- **Alternatives:** Wait for Tobi's silver note — rejected: A drafted proposal gives him something to react to instead of a blank page.
- **Features:** F-41
- **Questions:** Q8


## C22 — Generate a reviewable design pass
- **Requested:** Can you generate something for me to review — I'll review and send you notes next week.
- **Transcript:** [00:41:05]–[00:41:24]
- **Status:** ✅ shipped — This checklist + the build pass *is* the deliverable — Tobi reviews via voice notes for the next round.
- **Decision:** Build & ship the changes; Tobi reviews via voice recordings for the next round. No separate design-pass stage — this checklist is the build spec. · [x] reviewed
- **Alternatives:** Separate design-pass / prototype stage — rejected: Tobi reviews voice notes on a real build faster than a static prototype.




## C23 — Rename 'Chamber' → 'Law Firm'
- **Requested:** Switch the product term 'Chamber' to 'Law Firm' throughout (raised during C01/C04).
- **Transcript:** context — [00:00:18]–[00:00:48], [00:15:43]–[00:16:45]
- **Status:** ✅ shipped — UI labels switched to 'Law Firm' via centralized `TERMS` (`lib/constants.ts`) across nav, dashboard, forms, pricing and help; `chambers` table + `/directory/chamber/*` routes unchanged.
- **Decision:** UI labels only — user-facing text says 'Law Firm'; keep the chambers table + /directory/chamber/* routes as-is internally. · [x] reviewed
- **Alternatives:** Rename the chambers table and /directory/chamber routes too — rejected: Churn across RLS, migrations and links for zero user-visible gain.
- **Features:** F-09



---

## Build outcome (2026-10-16 → 2026-10-18)

| # | What shipped |
|---|---|
| C02 | Silver/Free/Premium tier ladder (`lib/directory/publishing.ts` tier map + role ordering) wired into plans/pricing. |
| C03 | Featured-first ranking — `.order('is_featured', desc)` in `getLawyers` + `getChambers` (`lib/directory/api.ts`) and a visible Featured badge on cards. |
| C05 | Post-credit system: `lib/directory/publishing.ts` quota model + `20261016000002_post_caps_and_credits.sql` (free 1 total, paid 3/mo, extra = one-off Paystack credits) + `PublishQuotaBanner` in the publish flow. |
| C06 | Merged into C05 — the free allowance *is* the one-free-article funnel. |
| C07 | `/directory/insights` no longer a stub — published articles surface there through `getPublishedArticles`. |
| C08 | Premium intro video: `20261016000004_intro_videos_bucket.sql` (storage bucket) + `upload-intro-video.ts` action + `IntroVideoField` (upload **or** external URL), tier-gated. |
| C09 | Lawyard Lens: `20261016000006_lens_courses.sql` (courses + enrollments, AI Governance ₦200k/₦150k seeded), `courses.ts`, `/lens` + `/lens/[slug]` with Paystack checkout and server-side subscriber discount; enrollment handled in webhook + `verifyPayment`. |
| C11 | Full chamber parity: `20261016000005_chambers_parity.sql` reusing the lawyer editors, plus matching display sections on the public chamber page. |
| C12 | `20261016000001_add_hide_price_to_lawyers.sql` + toggle in `LawyerForm` → profile shows 'Contact for pricing' instead of the number. |
| C14 | `20261016000003_service_requests.sql` + `service-requests.ts` + `ServiceRequestForm` — structured service type / scope / budget request. |
| C15 | Service requests are payable (Paystack booking fee to Lawyard before the slot is confirmed); no off-platform free bookings. |
| C17 | `20261016000007_chamber_admins.sql` — multi-user chamber admin role (owner/admin, RLS-managed, creator auto-registers as owner) + `press-releases.ts` publishing (editorial-gated via Slack) + dashboard 'Announcements & Press' + PRs on the public chamber page (excluded from the main Insights feed). |
| C22 | This checklist + the build pass *is* the deliverable — Tobi reviews via voice notes for the next round. |
| C23 | UI labels switched to 'Law Firm' via centralized `TERMS` (`lib/constants.ts`) across nav, dashboard, forms, pricing and help; `chambers` table + `/directory/chamber/*` routes unchanged. |

**Not built (deliberate):** C01 — needs Tobi · C04 — needs Tobi · C10 — build · C13 — needs Tobi · C16 — build · C18 — build · C19 — park · C20 — build · C21 — needs Tobi.

### Post-build verification — 2026-11-04

Re-verified every shipped item against the code after the changeset deployed (`164510d`). The gaps that survived are recorded as defects rather than remembered:

| Defect | Change | Gap |
|---|---|---|
| D1 | C20 | Plans still seeded in USD but formatted as NGN |
| D3 | C02, C21 | Silver plan rows are ₦0 with no features |
| D8 | — | No admin analytics route |

Full detail, severity and fix notes: [`docs/FEATURE-STATUS.md`](FEATURE-STATUS.md) §6.

---

## Questions for Tobi

| # | Question | From | Status |
|---|---|---|---|
| Q1 | Chamber subscription model — per member lawyer (seat-based), or flat per chamber? | C01 | ⚠ open |
| Q2 | Premium Single (Lawyer, 365d) — NGN price? | C20 | ⚠ open |
| Q3 | Premium Package (Lawyer, 365d) — NGN price? | C20 | ⚠ open |
| Q4 | Premium Single (Client, 90d) — NGN price? | C20 | ⚠ open |
| Q5 | Premium Package (Client, 90d) — NGN price? | C20 | ⚠ open |
| Q6 | Premium (Chamber / Law Firm, 365d) — NGN price? | C20 | ⚠ open |
| Q7 | Scrap the 60-min corporate-post clash detection? (blocks back-to-back posts from different brands) | pre-existing | ⚠ open |
| Q8 | Silver category — which items stay vs get added? | C21 | ⚠ open |
| Q9 | Exact annual figure for enterprise / law firm (range heard as ₦3–5M — confirm) | C04 | ⚠ open |
| Q10 | Take out the 'link to directory' — remove the Link Directory feature, or a badge/attribution? | C13 | ⚠ open |
| Q11 | Booking fee amount (client → Lawyard, before the slot is confirmed) | C15 | ⚠ open |

---

## Out of scope (mentioned, not a Tobi request)
- Competitor metered-pricing signal ('$20 / quota reducing') — [00:04:53]–[00:05:24]. ASR-garbled; reads as a market signal, not a Lawyard change.
- Competitor 'case study' (heard 'Metsu', likely Martindale) forced to focus on law firms — [00:15:24]. Strategic evidence, not a request.
