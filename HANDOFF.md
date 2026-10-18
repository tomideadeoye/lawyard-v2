# Lawyard — Session Handoff

> Purpose: everything a fresh session needs to start Lawyard work without re-discovery.
> Last updated: 2026-10-18 (Orion). Next milestone: **Sun 18 Oct, 7pm call — Tobi + Shefiu (close out website)**.

## 0. Where everything is

| Thing | Location |
|---|---|
| Codebase | `/Users/mac/Documents/GitHub/lawyard-v2` (Next.js 16 · Supabase · Brevo · Paystack · WordPress) |
| Live | https://directory.lawyard.org |
| Staging/preview | https://lawyard-v2.vercel.app |
| GitHub | https://github.com/tomideadeoye/lawyard-v2 |
| Ops skill | `~/.hermes/skills/general/lawyard-ops/SKILL.md` (build pitfalls, auth-surface rules, admin UI, not-found conventions) |
| Project record | `projects` table id `bf2d6129-9fab-4771-a0dd-9bf6382079b7` (currently marked *completed* — actually active) |
| Context docs | `README.md` (active contract), `CHANGELOG.md`, `TIMELINE.md`, `docs/ARCHITECTURE.md`, `docs/CONTENT_WORKFLOW.md`, `docs/features.md` |
| Ingested transcript | `documents` table id `02f7f537-124c-40ea-9f42-116b729ab366` (12 Sep feature/design call) |

**People**
- **Tobi Adebowale** — client / product owner · +234 706 100 3969 · tobi@lawyard.org · entity `94e9ebd8-8f16-4549-945a-02941231b2c5`
- **Shefiu Adeyemi** — integrator on the main site · +234 905 879 7631
- WhatsApp group: **"Lawyard Feature Updates"** (room `!oLbTjDbxqMZvU0Mokr9K:beeper.local`)

## 1. ⚠️ START HERE — uncommitted work

`git log` last commit = **2026-08-12** (`docs-sync: Slack review for podcasts/corporate posts…`).
The working tree now holds the **full 12 Sep changeset build** — **96 changed paths** (~70 modified/deleted + ~26 untracked), ~1,750 insertions across 70 tracked files.

**Built 2026-10-16/18 (18 of 23 items)** — see the build-outcome table in `docs/TOBI-12SEP-CHANGES.md`. Highlights: three-tier Free→Silver→Premium, NGN end-to-end (`lib/currency.ts`), post quotas + credits, paid service requests, Lawyard Lens courses (`/lens`), law-firm admin role + PR publishing, chamber page parity, "Chamber"→"Law Firm" labels (`TERMS`), featured-first ranking, private pricing, intro-video upload, Calendly UI removed.

**Seven migrations are APPLIED to production** (`supabase db push`, 2026-10-18 — `20261016000001..07`): hide_price · post caps/credits · service_requests · intro-videos bucket · chambers parity · lens courses (AI Governance seeded ₦200k/₦150k) · chamber_admins. Verified via REST read-back.

**`pnpm run build` green + TypeScript clean. Nothing committed and nothing deployed** — Vercel ships on push, so prod code still predates these features until the commit lands.

**First action next session:** commit this changeset (stage only session files, not stray drift) after Tomide's go, then deploy.

## 2. The 18 Oct call — what Tobi actually wants

Tobi has asked three times (6, 7, 13 Oct) for the **design update** — *"There are some things I want Shefiu to integrate to the main page."* The call is to close out the website. Bring: (a) where the build actually is, (b) the pricing answers (below), (c) the feature decisions from the 12 Sep transcript.

## 3. 🐞 Tobi-reported bug (new, 2026-10-16)

**"Email-based signing doesn't work yet."** — reported by Tobi via Tomide. *Interpretation to confirm:* most likely **email auth (sign-up / sign-in / magic link)**, given the auth-heavy CHANGELOG history (Brevo auth hook, `mapAuthError`, callback double-prefix fixes). Could alternatively mean e-signature — **confirm with Tobi before building.** Not yet reproduced or logged.

## 4. Open work (from README)

**Next Build Priorities**
1. **Tier 0** — Rename "Edit Listing" → "Manage Profile" across all UI
2. **Tier 1** — WorkingHoursEditor, GalleryUpload, IntroVideo UI
3. **Tier 2** — Verification badges, gallery + working-hours display
4. **Tier 3** — Appointment/booking system
5. **Tier 4** — Live chat
6. **Tier 5** — Analytics dashboard — **telemetry scope confirmed by Tomide 2026-10-16: platform/product analytics (admin-facing) = signups, subscribers, revenue, funnel.** This is *distinct* from the already-shipped lawyer-facing widgets (Profile Views count + 14-day sparkline, Inquiry trends) — those are per-lawyer; the ask is site-wide product telemetry.
7. **Tier 6** — Admin enhancements
8. **Tier 7** — Infrastructure hardening

**Must Do Before Public Launch**
- [ ] Rate limiting (Upstash Redis) on forms
- [ ] pg_cron: auto-archive stuck `pending_payment` > 24h
- [ ] PDF download infrastructure
- [ ] Error boundaries on all routes
- [ ] 301 redirects from old WordPress URLs
- [ ] Email notification system
- [x] Subscription expiry cron (Vercel Cron, daily midnight)
- [x] Paystack webhook fix

**Admin App:** coupon CRUD UI · subscriber CSV export + growth charts · multi-admin roles · audit log · corporate-post analytics · WYSIWYG editor
**Publish App:** article search · real comments · author profile pages · pagination · loading skeletons · sitemap/JSON-LD/dynamic OG images

## 5. ❓ Questions for Tobi (blocking pricing)

Five NGN prices unset: Premium Single (Lawyer, 365d) · Premium Package (Lawyer, 365d) · Premium Single (Client, 90d) · Premium Package (Client, 90d) · Premium (Chamber, 365d).
Plus: scrap the 60-min corporate-post clash detection? (currently blocks back-to-back posts from different brands)

## 6. Decisions from the 12 Sep transcript (decoded — auto-transcript ~40% usable)

> 12 Sep 2026, ~57 min, feature-by-feature walkthrough of the directory + dashboard. Tobi = product owner, driving screen-by-screen. Spine of the meeting = **monetization architecture**: enterprise (law firms/chambers) > individual lawyers on revenue. Tobi cites a competitor directory that tried both and was "ultimately forced to focus on law firms."

**Monetization**
- **Chambers tier** — new subscription, priced separately from individual lawyers. Most competitor directories serve lawyers + clients only; no chamber tier → the gap. Model: chamber subscribes; a **site administrator** manages its Lawyard page and publishes PR/announcements (e.g. IPO work) onto the directory page.
- **Tiering** — silver / premium; premium gates the important features. Tobi owes a note on what stays in **silver** vs what gets added.
- **Enterprise price** ₦3–5M/annum (vs ₦155k individual).
- **Post caps** ~3/month; extra posts = paid add-on (new revenue line). Funnel: 1 free post → subscribe to premium.

**Content**
- **Back-end article publishing** onto the Lawyard site, subject to editorial review.
- **1-minute intro video** — hosted on our own backend (vs Vimeo), **not** free tier; cloud-storage cost to be modelled into pricing; shows on the directory.
- **Courses (Lawyard Lens)** — AI-governance ₦200k, ₦150k for directory subscribers (cross-sell).

**Directory profile**
- Profile picture only (no free image uploads); business info, FAQs, website link, working hours, presentation video; pricing with a **private** option.
- **Service requests** (renamed from "booking") — clients request services.
- **Bookings must be paid** — no free booking that moves the conversation off-platform ("I don't want this to be a tracing cabinet").
- **DECISION: no Calendly / external calendar integration.**
- **Remove the "link to directory" attribution/badge** for paying users.

**Dashboard / infra**
- Remove bookmarks (unless lawyer-to-lawyer; not for client receipts); revisit history/subscription section; keep the overview. Reviewed on iPad.
- **Move to AWS** (a feature is getting heavy usage).
- **Currency:** Naira for Nigeria; foreign listings still need handling.

**Tobi's asks back:** *"Generate something for me to review — I'll send you notes next week"* (a design/prototype pass on the above) + the silver-category note.

**ASR-garbled — confirm, don't trust:** competitor "case study" name (heard "Metsu", likely Martindale); a competitor-pricing remark ("$20 / quota reducing") reads as a metered-competitor signal, not Lawyard's own price; the "$10,000 premium" line is almost certainly a ₦ figure misheard.

## 7. Quick start

```bash
cd /Users/mac/Documents/GitHub/lawyard-v2
pnpm install
pnpm dev          # main :3000 · admin /admin · directory /directory
pnpm run build    # always verify after route/auth changes (stale caches mislead)
pnpm run lint          # eslint . (flat config, added 2026-10-18; `next lint` was dead in Next 16)
pnpm run check:migrations   # FAILS if local migration files are unapplied to the linked project
```

**After writing any new migration:** `pnpm run migrations:push` then `pnpm run check:migrations` to confirm — seven migrations sat unapplied for days in Oct 2026 because nothing checked.

## 8. Live items to close

- [ ] Reply to Tobi/Shefiu with the **design update** before Sun 7pm
- [ ] Confirm the **email-auth bug** interpretation, then reproduce + fix
- [ ] Answer the 5 pricing questions + clash-detection question (Q1, Q2–Q6, Q7 in `docs/TOBI-12SEP-CHANGES.md`)
- [ ] **Commit + deploy the 12 Sep changeset** (built, migrations live, code not yet pushed)
- [ ] Get Tobi's verdict on C13 (remove directory attribution?) and C21 (silver contents) — the two undecided items
- [ ] End-to-end smoke test once deployed: course checkout, PR publish → Slack review, service-request payment
- [ ] Product analytics / telemetry (Tier 5) — signups · subscribers · revenue · funnel (admin-facing; not the per-lawyer widgets)
- [ ] `pnpm run lint` is broken repo-wide (`next lint` → "Invalid project directory") — logged as a tool improvement
