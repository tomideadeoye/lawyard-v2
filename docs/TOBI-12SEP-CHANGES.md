# Tobi's Requested Changes — 12 Sep 2026

> Working checklist. We go through these **one by one**, record a decision per item, then build.
> Created 2026-10-16 (Orion) from the decoded 12 Sep call transcript.

## Sources (session anchors)

| What | Path |
|---|---|
| **Transcript** (source of truth for requests) | `/Users/mac/Downloads/20260912_142011.transcript.md` |
| **Feature status board** (what's built vs not) | `docs/FEATURE-STATUS.md` |
| **Session handoff** | `HANDOFF.md` |
| **Changelog / timeline** | `CHANGELOG.md`, `TIMELINE.md` |

## How to use

For each item: read the request → note the current status → record a **Decision** (`build` / `park` / `reject` / `confirm-with-Tobi`) → tick the box. Status marks mirror `docs/FEATURE-STATUS.md`: ✅ shipped · 🟡 partial · 🟦 scaffolded · 🔴 not started · 💬 spec'd-only · 🗑 remove · ❓ verify.

**Legend for decisions:** `BUILD` = do it · `PARK` = later · `REJECT` = no · `CONFIRM` = ask Tobi · `DONE` = already built.

---

## Index

| # | Change | Status | Decision |
|---|---|---|---|
| C01 | Chambers subscribe — separate pricing | 💬 | PER-MEMBER (⚠ Tobi) |
| C02 | Tiered pricing (silver / premium) | ✅ | 3-TIER: Free→Silver→Premium |
| C03 | Featured/prioritised profile placement | ✅ | BUILD: featured-first + badge |
| C04 | Enterprise price ₦3–5M/annum | 💬 | SAME AS CHAMBER (= law firm) |
| C05 | Post caps ~3/month + paid extras | ✅ | BUILD: Free 1 → Prem 3/mo → paid extras |
| C06 | One free article → premium to continue | ✅ | MERGED → C05 |
| C07 | Back-end article publishing, editorial-gated | ✅ | BUILD: surface on /directory/insights |
| C08 | 1-min intro video — premium-only, self-hosted | ✅ | BUILD BOTH: upload (R2) OR URL |
| C09 | Lawyard Lens courses + subscriber discount | ✅ | THIN bespoke (Next.js) now; LMS later |
| C10 | Profile picture only (restrict uploads) | ✅ | KEEP GALLERY: enforce caps (3/6) + firm uplift |
| C11 | Chamber page — hours, FAQs, website, video, images | ✅ | BUILD: full parity (reuse lawyer editors) |
| C12 | Private pricing option | ✅ | BUILD: toggle → "Contact for pricing" |
| C13 | Remove "link to directory" attribution | 🔴 | UNDECIDED (⚠ Tobi) |
| C14 | Rename booking → "Service Request" | ✅ | BUILD: new structured+payable request |
| C15 | Bookings must be paid (no off-platform) | ✅ | BUILD: client pays Lawyard booking fee |
| C16 | No Calendly / external calendar | ✅ | HIDE UI ONLY (keep column) |
| C17 | Chamber site-admin role + PR publishing | ✅ | BUILD: chamber-side admin role + PR posts |
| C18 | Dashboard cleanup (bookmarks, history) | ✅ | KEEP bookmarks (both roles); rename; clean history |
| C19 | Move to AWS | ✅ | KEEP Supabase; self-host on DO only if Shefiu insists |
| C20 | Currency — Naira for Nigeria | ✅ | BUILD: NGN end-to-end + foreign handling |
| C21 | Silver category — which items stay/add | 💬 | DRAFT proposal → Tobi reacts |
| C22 | Generate a reviewable design pass | ✅ | SHIP IT; Tobi voice-feedback loop |
| C23 | Rename "Chamber" → "Law Firm" | ✅ | UI LABELS ONLY |

> **Build pass complete: 18 of 23 shipped** (2026-10-16/18). Remaining open: **C01, C04, C21** (need Tobi's figures/notes), **C13** (intent unclear), **C19** (decided "no build" — stay on Supabase). All build items compile (`pnpm run build` green, TypeScript clean).

---

## C01 — Chambers can subscribe (separate pricing)
- **Requested:** Chambers should be able to subscribe, with their own price system distinct from individual lawyers. Most competitor sites only serve lawyers + clients.
- **Transcript:** [00:00:18]–[00:00:48]
- **Status:** 💬 spec'd-only. Chamber management exists (`dashboard/chamber`, `ChamberForm`) but no separate subscription pricing.
- **Decision:** **Per member lawyer (seat-based)** — ⚠ *uncertain*, confirm with Tobi (→ Q1). · [x] reviewed

## C02 — Tiered pricing (silver / premium)
- **Requested:** Tiers where premium gates "the important" features.
- **Transcript:** [00:02:34]–[00:02:41]
- **Status:** 💬 Current plans are Free / Premium (Single) / Premium (Package) — no silver tier.
- **Decision:** **Three-tier ladder Free → Silver → Premium**; premium gates "the important" features; silver's exact contents deferred to Tobi's note (→ C21). Derived from transcript ("three tiers", "three and three and one" = 3 lawyer / 3 client / 1 chamber, matching DB). Tobi to give feedback. · [x] reviewed

## C03 — Featured/prioritised profile placement
- **Requested:** Paid profiles get priority; they show up on the site (ranked/first).
- **Transcript:** [00:03:52]–[00:04:01]
- **Status:** 🟡 `is_featured` / `featured` exists on lawyers + chambers; confirm ranking behaviour end-to-end.
- **Decision:** **BUILD both** — (1) rank featured-first in search results (add `.order('is_featured', desc)` to `getLawyers`/`getChambers`), and (2) a visible **"Featured" badge** on the card. Homepage featured section stays. · [x] reviewed

## C04 — Enterprise price ₦3–5M/annum
- **Requested:** Enterprise (law firm) price bigger than ₦155k individual — around ₦3–5M per annum.
- **Transcript:** [00:18:06]
- **Status:** 💬 (needs Tobi's firm figure — see open questions).
- **Decision:** **Same as chamber** — "enterprise" = chamber/law firm, one price (C01 + C04 are one thing). Exact annual figure still needs Tobi (→ Q9). · [x] reviewed

## C05 — Post caps ~3/month + paid extras
- **Requested:** Cap publishing at ~3 posts/month; publishing extra posts costs a set amount (added revenue).
- **Transcript:** [00:19:21]–[00:19:43]
- **Status:** 💬 Not built. Currently coupon-gated publishing only.
- **Decision:** **Free: 1 post total → Premium: 3/month → extra posts = one-off Paystack payment.** This is both the free→paid funnel and the monthly cap. · [x] reviewed

## C06 — One free article → premium to continue
- **Requested:** Give one free article; the next time they want to publish, require a premium subscription.
- **Transcript:** [00:05:37]–[00:05:49]
- **Status:** 💬 Not built.
- **Decision:** **Merged into C05** — the "one free article then subscribe" is the free allowance in C05(a). No separate build. · [x] reviewed

## C07 — Back-end article publishing, editorial-gated
- **Requested:** Lawyers publish articles from their backend onto the Lawyard site, subject to editorial review.
- **Transcript:** [00:04:06]
- **Status:** 🟡 Content Studio + Slack editorial workflow shipped; confirm this matches the "from backend to main site" flow.
- **Decision:** **Gap = surface published articles on the directory.** Build out `/directory/insights` (currently a `ComingSoon` stub) so articles appear there too, not only on WordPress. Publishing flow itself stays. ⚠ *The publish target is currently WordPress, which Lawyard is moving away from — revisit in the WordPress-exit migration.* · [x] reviewed

## C08 — 1-min intro video (premium-only, self-hosted)
- **Requested:** Premium subscribers can offer a 1-minute intro video hosted on our own backend (not free tier); factor cloud-storage cost into pricing.
- **Transcript:** [00:07:46]–[00:08:35]
- **Status:** 🟡 `intro_video_url` + YouTube-embed display exist; no upload/hosting UI, no tier gating.
- **Decision:** **Both** — premium-gated intro video that accepts EITHER a **self-hosted upload** (Cloudflare R2, 1-min limit) OR an **external URL** (YouTube/Vimeo). Upload path ≈$1/mo at 2k videos on R2 (egress-free); URL path costs $0. Cost model: storage trivial, bandwidth is the driver. · [x] reviewed

## C09 — Lawyard Lens courses + subscriber discount
- **Requested:** Host courses (e.g. AI governance ₦200k), discounted to ₦150k for directory subscribers — cross-sell.
- **Transcript:** [00:25:00]–[00:25:23]
- **Status:** 💬 Not built (no courses/Lens code).
- **Decision:** **Thin, bespoke in the Next.js app — no WordPress.** Course table + listing + checkout via existing Paystack + subscriber discount (₦200k → ₦150k); video via R2/Stream. Full LMS built bespoke later only if it proves out. ⚠ *Direction: Lawyard is moving off WordPress (AI-written bespoke preferred over plugins).* · [x] reviewed

## C10 — Profile picture only (restrict uploads)
- **Requested:** Individuals upload only their profile picture (no free image galleries); note law firms may want more images/branding.
- **Transcript:** [00:13:36]–[00:14:47]
- **Status:** 🟡 Gallery upload exists (`GalleryUpload.tsx`) — would need restriction/tiering.
- **Decision:** **Keep the gallery; enforce plan caps** — free 3 / premium 6 — plus a **higher cap for law firms**. No blanket "profile picture only". Add image validation (type/size). *(Overrides Tobi's "profile picture only" instinct — photos convert.)* · [x] reviewed

## C11 — Chamber page: hours, FAQs, website, video, images
- **Requested:** Chamber page should have working-hours control, FAQs, website link, presentation video, and images.
- **Transcript:** [00:38:19]–[00:38:34]
- **Status:** 🟡 Some fields exist on lawyers; confirm chamber-specific coverage.
- **Decision:** **Full parity** — extend `chambers` with `working_hours`, `faqs`, `gallery_images`, `intro_video_url` (website already exists), reusing the existing lawyer editors. · [x] reviewed

## C12 — Private pricing option
- **Requested:** Allow a "private" pricing option (hide price on the profile).
- **Transcript:** [00:38:49]–[00:38:59]
- **Status:** 🔴 Not built (`price_range` exists but no private/hide toggle).
- **Decision:** **Toggle hides the number, keeps the section** → shows **"Contact for pricing"**. Keeps the inquiry CTA while honouring the privacy ask. · [x] reviewed

## C13 — Remove "link to directory" attribution
- **Requested:** Remove the "link to directory" attribution/badge.
- **Transcript:** [00:23:50]–[00:24:21]
- **Status:** 🔴 Confirm current attribution UI, then remove.
- **Decision:** **UNDECIDED — parked.** "Link Directory" is a plan *feature* (external links); no "Powered by Lawyard" attribution found. Intent unclear → confirm with Tobi (→ Q10). · [x] reviewed

## C14 — Rename booking → "Service Request"
- **Requested:** Rename the feature to "Service Request" — clients ask for services.
- **Transcript:** [00:26:07]–[00:27:09]
- **Status:** 🔴 No service-request feature; pricing page currently says "Booking Included".
- **Decision:** **New structured feature — not a rename of Inquiries.** Captures service type, scope, budget; **payable**; entry point to the paid booking flow (C15). Inquiries stay as the free "contact me" form. · [x] reviewed

## C15 — Bookings must be paid (no off-platform)
- **Requested:** Prevent free bookings that let the conversation move off-platform ("I don't want this to be a tracing cabinet").
- **Transcript:** [00:28:10]–[00:28:33]
- **Status:** 🔴 No booking system (`dashboard/bookings` is an empty stub).
- **Decision:** **Client pays a booking fee to Lawyard via Paystack, before the slot is confirmed.** Chosen over routing the lawyer's consultation fee — keeps Lawyard charging for its own service (booking/introduction), avoids handling client legal money (Rules of Professional Conduct) and payment-intermediary/escrow obligations, and is the simplest build (one Paystack charge, no payouts). Fee **amount** = Tobi (→ Q11). · [x] reviewed

## C16 — No Calendly / external calendar
- **Requested:** Do **not** integrate Calendly or an external calendar.
- **Transcript:** [00:27:14]–[00:29:41]
- **Status:** 🗑 **Built but decided-against** — `calendly_url` migration + field + display on lawyer page. Remove.
- **Decision:** **Hide UI only** — remove the `LawyerForm` field + the profile display; **keep the `calendly_url` column** in the DB (no destructive migration). · [x] reviewed

## C17 — Chamber site-admin role + PR publishing
- **Requested:** A chamber subscribes and gets a site administrator who manages the chamber page and publishes PR/announcements (e.g. IPO work) to the directory.
- **Transcript:** [00:15:43]–[00:16:32]
- **Status:** 🟡 Chamber management exists; no multi-admin/PR-publishing role.
- **Decision:** **Chamber-side role** — the chamber gets a user (or several) with login who manage the chamber page + publish PR/announcement posts to the directory. Supports multiple users per chamber. · [x] reviewed

## C18 — Dashboard cleanup (bookmarks, history)
- **Requested:** Change the dashboard — remove bookmarks (not for client receipts); revisit the subscription/history section.
- **Transcript:** [00:42:37]–[00:43:45]
- **Status:** 🟡 Bookmarks shipped (`dashboard/favorites`); history/subscription section to review.
- **Decision:** **Keep Bookmarks for both roles** — a lawyer saving a peer is valid (referrals, co-counsel, benchmarking, later reference). Fix Tobi's confusion with **clarity, not deletion**: rename "Bookmarks" → **"Saved Lawyers"**. Also **clean up the subscription/history section** (duplicates the billing/settings tab). · [x] reviewed

## C19 — Move to AWS
- **Requested:** Move infrastructure to AWS (a feature is getting heavy usage).
- **Transcript:** [00:11:23]–[00:11:31]
- **Status:** 🔴 Currently on Vercel + Supabase.
- **Decision:** **Keep building with Supabase.** Stay on managed Supabase; if Shefiu insists on DigitalOcean, **self-host Supabase on DO** (code unchanged — still `supabase-js`). Do **not** do a full migration off Supabase (66 files coupled to the SDK: auth 85×, `createClient` 189×, RLS policies, Storage). ⚠ Item titled "AWS" in the transcript, but the real target is DO/Supabase. · [x] reviewed

## C20 — Currency — Naira for Nigeria
- **Requested:** Naira for Nigeria; foreign listings need handling.
- **Transcript:** [00:42:11]–[00:42:24]
- **Status:** 🟡 Transactions record NGN; plans seed still USD ($20/$2). Blocked on Tobi's prices.
- **Decision:** **NGN end-to-end** — strip the hardcoded `$` (3 layers: pricing-page fallback, `getPlans()` formatting, `Price` component), format as `₦`, use Tobi's real NGN prices. **Plus** a foreign-user/listing handling decision. · [x] reviewed

## C21 — Silver category (which items stay/add)
- **Requested:** Tobi to send a note on which items to retain in the **silver** category and which to add.
- **Transcript:** [00:41:34]–[00:41:54]
- **Status:** 💬 Awaiting Tobi's note.
- **Decision:** **Draft a proposed silver feature set** ourselves (middle tier between Free and Premium, derived from existing plan features) and send it to Tobi to react to / edit — rather than waiting blank. · [x] reviewed

## C22 — Generate a reviewable design pass
- **Requested:** *"Can you generate something for me to review — I'll review and send you notes next week."*
- **Transcript:** [00:41:05]–[00:41:24]
- **Status:** 💬 This whole checklist is the input; the design pass is the output.
- **Decision:** **Build & ship the changes; Tobi reviews via voice recordings** for the next round of updates — no separate design-pass/prototype stage. **This checklist is the build spec.** · [x] reviewed

## C23 — Rename "Chamber" → "Law Firm"
- **Requested:** Switch the product term **"Chamber" to "Law Firm"** throughout (raised during C01/C04).
- **Transcript:** context — [00:00:18]–[00:00:48], [00:15:43]–[00:16:45]
- **Status:** 🔴 Cross-cutting. Affects UI labels, plan/role names, `chambers` table/routes (`/directory/chamber/*`), and C11/C17.
- **Decision:** **UI labels only** — user-facing text says "Law Firm"; keep the `chambers` table + `/directory/chamber/*` routes as-is internally. · [x] reviewed

---

## Build outcome (2026-10-16 → 2026-10-18)

| # | What shipped |
|---|---|
| C02 | Silver/Free/Premium tier ladder (`lib/directory/publishing.ts` tier map + role ordering) wired into plans/pricing. |
| C03 | Featured-first ranking — `.order('is_featured', desc)` in `getLawyers` + `getChambers` (`lib/directory/api.ts`) and a visible Featured badge on cards. |
| C05 | Post-credit system: `lib/directory/publishing.ts` quota model + `20261016000002_post_caps_and_credits.sql` (free 1 total, paid 3/mo, extra = one-off Paystack credits) + `PublishQuotaBanner` in the publish flow. |
| C06 | Merged into C05 — the free allowance *is* the one-free-article funnel. |
| C07 | `/directory/insights` no longer a stub — published articles surface there through `getPublishedArticles`. |
| C08 | Premium intro video: `20261016000004_intro_videos_bucket.sql` (R2-style bucket) + `upload-intro-video.ts` action + `IntroVideoField` (upload **or** external URL), tier-gated. |
| C09 | Lawyard Lens: `20261016000006_lens_courses.sql` (courses + enrollments, AI Governance ₦200k/₦150k seeded), `courses.ts`, `/lens` + `/lens/[slug]` with Paystack checkout and server-side subscriber discount; `course_enrollment` handled in webhook + `verifyPayment`. |
| C10 | Gallery caps enforced by tier (free 3 / premium 6, higher for law firms) + image type/size validation. |
| C11 | Full chamber parity: `20261016000005_chambers_parity.sql` (`working_hours`, `faqs`, `gallery_images`, `intro_video_url`) reusing the lawyer editors, plus the matching display sections on the public chamber page. |
| C12 | `20261016000001_add_hide_price_to_lawyers.sql` + toggle in `LawyerForm` → profile shows **"Contact for pricing"** instead of the number. |
| C14 | `20261016000003_service_requests.sql` + `service-requests.ts` + `ServiceRequestForm` — structured service type / scope / budget request. |
| C15 | Service requests are **payable** (Paystack booking fee to Lawyard before the slot is confirmed); no off-platform free bookings. |
| C16 | Calendly UI hidden from `LawyerForm` + lawyer profile display; `calendly_url` column kept. |
| C17 | `20261016000007_chamber_admins.sql` — multi-user chamber admin role (owner/admin, RLS-managed, creator auto-registers as owner) + `press-releases.ts` publishing (`article_type='press_release'`, editorial-gated via Slack review) + dashboard "Announcements & Press" section + published PRs rendered on the public chamber page (excluded from the main Insights feed). |
| C18 | Bookmarks kept for both roles, renamed **"Saved Lawyers"** (sidebar, mobile nav, page title); subscription/history duplication cleaned up. |
| C20 | `lib/currency.ts` NGN formatter end-to-end — hardcoded `$` removed from pricing fallback, `getPlans()` formatting and the `Price` component; foreign-listing handling noted. |
| C22 | This checklist + the build pass *is* the deliverable — Tobi reviews via voice notes for the next round. |
| C23 | UI labels switched to **"Law Firm"** via centralized `TERMS` (`lib/constants.ts`) across nav, dashboard, forms, pricing and help; `chambers` table + `/directory/chamber/*` routes unchanged. |

**Not built (deliberate):** C01, C04, C21 — blocked on Tobi's figures/notes · C13 — intent unclear · C19 — decided to stay on Supabase.

---

## Questions for Tobi (accumulating → Sunday call)

| # | Question | From | Status |
|---|---|---|---|
| Q1 | Chamber subscription model — confirmed **per member lawyer** (seat-based), but is that right? Or flat per chamber? | C01 | ⚠ confirm |
| Q2 | Premium Single (Lawyer, 365d) — NGN price? | pre-existing | open |
| Q3 | Premium Package (Lawyer, 365d) — NGN price? | pre-existing | open |
| Q4 | Premium Single (Client, 90d) — NGN price? | pre-existing | open |
| Q5 | Premium Package (Client, 90d) — NGN price? | pre-existing | open |
| Q6 | Premium (Chamber, 365d) — NGN price? | pre-existing | open |
| Q7 | Scrap the 60-min corporate-post clash detection? | pre-existing | open |
| Q8 | Silver category — which items stay vs get added? | C21 | open |
| Q9 | Exact annual figure for enterprise/law-firm (range heard as ₦3–5M — confirm) | C04 | open |
| Q10 | "Take out the link to directory" — remove the *Link Directory* feature, or a badge/attribution? | C13 | open |
| Q11 | Booking fee amount (client → Lawyard, before slot confirmed) | C15 | open |

---

## Out of scope (mentioned, not a Tobi request)
- Competitor metered-pricing signal ("$20 / quota reducing") — [00:04:53]–[00:05:24]. ASR-garbled; reads as a market signal, not a Lawyard change.
- Competitor "case study" (heard "Metsu", likely Martindale) forced to focus on law firms — [00:15:24]. Strategic evidence, not a request.
