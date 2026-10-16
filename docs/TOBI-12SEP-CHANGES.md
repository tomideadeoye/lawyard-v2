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
| C01 | Chambers subscribe — separate pricing | 💬 | — |
| C02 | Tiered pricing (silver / premium) | 💬 | — |
| C03 | Featured/prioritised profile placement | 🟡 | — |
| C04 | Enterprise price ₦3–5M/annum | 💬 | — |
| C05 | Post caps ~3/month + paid extras | 💬 | — |
| C06 | One free article → premium to continue | 💬 | — |
| C07 | Back-end article publishing, editorial-gated | 🟡 | — |
| C08 | 1-min intro video — premium-only, self-hosted | 🟡 | — |
| C09 | Lawyard Lens courses + subscriber discount | 💬 | — |
| C10 | Profile picture only (restrict uploads) | 🟡 | — |
| C11 | Chamber page — hours, FAQs, website, video, images | 🟡 | — |
| C12 | Private pricing option | 🔴 | — |
| C13 | Remove "link to directory" attribution | 🔴 | — |
| C14 | Rename booking → "Service Request" | 🔴 | — |
| C15 | Bookings must be paid (no off-platform) | 🔴 | — |
| C16 | No Calendly / external calendar | 🗑 | — |
| C17 | Chamber site-admin role + PR publishing | 🟡 | — |
| C18 | Dashboard cleanup (bookmarks, history) | 🟡 | — |
| C19 | Move to AWS | 🔴 | — |
| C20 | Currency — Naira for Nigeria | 🟡 | — |
| C21 | Silver category — which items stay/add | 💬 | — |
| C22 | Generate a reviewable design pass | 💬 | — |

---

## C01 — Chambers can subscribe (separate pricing)
- **Requested:** Chambers should be able to subscribe, with their own price system distinct from individual lawyers. Most competitor sites only serve lawyers + clients.
- **Transcript:** [00:00:18]–[00:00:48]
- **Status:** 💬 spec'd-only. Chamber management exists (`dashboard/chamber`, `ChamberForm`) but no separate subscription pricing.
- **Decision:** —  · [ ] reviewed

## C02 — Tiered pricing (silver / premium)
- **Requested:** Tiers where premium gates "the important" features.
- **Transcript:** [00:02:34]–[00:02:41]
- **Status:** 💬 Current plans are Free / Premium (Single) / Premium (Package) — no silver tier.
- **Decision:** —  · [ ] reviewed

## C03 — Featured/prioritised profile placement
- **Requested:** Paid profiles get priority; they show up on the site (ranked/first).
- **Transcript:** [00:03:52]–[00:04:01]
- **Status:** 🟡 `is_featured` / `featured` exists on lawyers + chambers; confirm ranking behaviour end-to-end.
- **Decision:** —  · [ ] reviewed

## C04 — Enterprise price ₦3–5M/annum
- **Requested:** Enterprise (law firm) price bigger than ₦155k individual — around ₦3–5M per annum.
- **Transcript:** [00:18:06]
- **Status:** 💬 (needs Tobi's firm figure — see open questions).
- **Decision:** —  · [ ] reviewed

## C05 — Post caps ~3/month + paid extras
- **Requested:** Cap publishing at ~3 posts/month; publishing extra posts costs a set amount (added revenue).
- **Transcript:** [00:19:21]–[00:19:43]
- **Status:** 💬 Not built. Currently coupon-gated publishing only.
- **Decision:** —  · [ ] reviewed

## C06 — One free article → premium to continue
- **Requested:** Give one free article; the next time they want to publish, require a premium subscription.
- **Transcript:** [00:05:37]–[00:05:49]
- **Status:** 💬 Not built.
- **Decision:** —  · [ ] reviewed

## C07 — Back-end article publishing, editorial-gated
- **Requested:** Lawyers publish articles from their backend onto the Lawyard site, subject to editorial review.
- **Transcript:** [00:04:06]
- **Status:** 🟡 Content Studio + Slack editorial workflow shipped; confirm this matches the "from backend to main site" flow.
- **Decision:** —  · [ ] reviewed

## C08 — 1-min intro video (premium-only, self-hosted)
- **Requested:** Premium subscribers can offer a 1-minute intro video hosted on our own backend (not free tier); factor cloud-storage cost into pricing.
- **Transcript:** [00:07:46]–[00:08:35]
- **Status:** 🟡 `intro_video_url` + YouTube-embed display exist; no upload/hosting UI, no tier gating.
- **Decision:** —  · [ ] reviewed

## C09 — Lawyard Lens courses + subscriber discount
- **Requested:** Host courses (e.g. AI governance ₦200k), discounted to ₦150k for directory subscribers — cross-sell.
- **Transcript:** [00:25:00]–[00:25:23]
- **Status:** 💬 Not built (no courses/Lens code).
- **Decision:** —  · [ ] reviewed

## C10 — Profile picture only (restrict uploads)
- **Requested:** Individuals upload only their profile picture (no free image galleries); note law firms may want more images/branding.
- **Transcript:** [00:13:36]–[00:14:47]
- **Status:** 🟡 Gallery upload exists (`GalleryUpload.tsx`) — would need restriction/tiering.
- **Decision:** —  · [ ] reviewed

## C11 — Chamber page: hours, FAQs, website, video, images
- **Requested:** Chamber page should have working-hours control, FAQs, website link, presentation video, and images.
- **Transcript:** [00:38:19]–[00:38:34]
- **Status:** 🟡 Some fields exist on lawyers; confirm chamber-specific coverage.
- **Decision:** —  · [ ] reviewed

## C12 — Private pricing option
- **Requested:** Allow a "private" pricing option (hide price on the profile).
- **Transcript:** [00:38:49]–[00:38:59]
- **Status:** 🔴 Not built (`price_range` exists but no private/hide toggle).
- **Decision:** —  · [ ] reviewed

## C13 — Remove "link to directory" attribution
- **Requested:** Remove the "link to directory" attribution/badge.
- **Transcript:** [00:23:50]–[00:24:21]
- **Status:** 🔴 Confirm current attribution UI, then remove.
- **Decision:** —  · [ ] reviewed

## C14 — Rename booking → "Service Request"
- **Requested:** Rename the feature to "Service Request" — clients ask for services.
- **Transcript:** [00:26:07]–[00:27:09]
- **Status:** 🔴 No service-request feature; pricing page currently says "Booking Included".
- **Decision:** —  · [ ] reviewed

## C15 — Bookings must be paid (no off-platform)
- **Requested:** Prevent free bookings that let the conversation move off-platform ("I don't want this to be a tracing cabinet").
- **Transcript:** [00:28:10]–[00:28:33]
- **Status:** 🔴 No booking system (`dashboard/bookings` is an empty stub).
- **Decision:** —  · [ ] reviewed

## C16 — No Calendly / external calendar
- **Requested:** Do **not** integrate Calendly or an external calendar.
- **Transcript:** [00:27:14]–[00:29:41]
- **Status:** 🗑 **Built but decided-against** — `calendly_url` migration + field + display on lawyer page. Remove.
- **Decision:** —  · [ ] reviewed

## C17 — Chamber site-admin role + PR publishing
- **Requested:** A chamber subscribes and gets a site administrator who manages the chamber page and publishes PR/announcements (e.g. IPO work) to the directory.
- **Transcript:** [00:15:43]–[00:16:32]
- **Status:** 🟡 Chamber management exists; no multi-admin/PR-publishing role.
- **Decision:** —  · [ ] reviewed

## C18 — Dashboard cleanup (bookmarks, history)
- **Requested:** Change the dashboard — remove bookmarks (not for client receipts); revisit the subscription/history section.
- **Transcript:** [00:42:37]–[00:43:45]
- **Status:** 🟡 Bookmarks shipped (`dashboard/favorites`); history/subscription section to review.
- **Decision:** —  · [ ] reviewed

## C19 — Move to AWS
- **Requested:** Move infrastructure to AWS (a feature is getting heavy usage).
- **Transcript:** [00:11:23]–[00:11:31]
- **Status:** 🔴 Currently on Vercel + Supabase.
- **Decision:** —  · [ ] reviewed

## C20 — Currency — Naira for Nigeria
- **Requested:** Naira for Nigeria; foreign listings need handling.
- **Transcript:** [00:42:11]–[00:42:24]
- **Status:** 🟡 Transactions record NGN; plans seed still USD ($20/$2). Blocked on Tobi's prices.
- **Decision:** —  · [ ] reviewed

## C21 — Silver category (which items stay/add)
- **Requested:** Tobi to send a note on which items to retain in the **silver** category and which to add.
- **Transcript:** [00:41:34]–[00:41:54]
- **Status:** 💬 Awaiting Tobi's note.
- **Decision:** —  · [ ] reviewed

## C22 — Generate a reviewable design pass
- **Requested:** *"Can you generate something for me to review — I'll review and send you notes next week."*
- **Transcript:** [00:41:05]–[00:41:24]
- **Status:** 💬 This whole checklist is the input; the design pass is the output.
- **Decision:** —  · [ ] reviewed

---

## Out of scope (mentioned, not a Tobi request)
- Competitor metered-pricing signal ("$20 / quota reducing") — [00:04:53]–[00:05:24]. ASR-garbled; reads as a market signal, not a Lawyard change.
- Competitor "case study" (heard "Metsu", likely Martindale) forced to focus on law firms — [00:15:24]. Strategic evidence, not a request.
