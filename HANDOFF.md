# Lawyard — Session Handoff

> Purpose: everything a fresh session needs to start Lawyard work without re-discovery.
> Last updated: 2026-11-04 (Orion). Next milestone: Tobi's pricing answers (Q1–Q11) → C01/C04/C13/C21 closure → audit fix pass (`docs/AUDIT-2026-10-20.md`).

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
| Living registries | `docs/data/{features,changeset,defects,questions}.json` — source of truth; `docs/FEATURE-STATUS.md` + `docs/TOBI-12SEP-CHANGES.md` are **generated** (`pnpm run docs:render`), never hand-edited |
| Ingested transcript | `documents` table id `02f7f537-124c-40ea-9f42-116b729ab366` (12 Sep feature/design call) |

**People**
- **Tobi Adebowale** — client / product owner · +234 706 100 3969 · tobi@lawyard.org · entity `94e9ebd8-8f16-4549-945a-02941231b2c5`
- **Shefiu Adeyemi** — integrator on the main site · +234 905 879 7631
- WhatsApp group: **"Lawyard Feature Updates"** (room `!oLbTjDbxqMZvU0Mokr9K:beeper.local`)

## 1. Where the 12 Sep changeset stands (updated 2026-11-04)

**Everything is committed, pushed, and deployed.** `main` = production (Vercel ships on push).

- `164510d` — the 18-of-23 changeset (build green, lint 0 errors / 181 warnings)
- `05caa76` — auth fixes (OAuth-only login messaging + email-hook verify URL; 2026-10-18)
- `153014d`/`7454fc2`/`518a5e3` — product-owner board → MerisLabs PM embed (2026-10-28)

**Seven migrations APPLIED to production** (`20261016000001..07`): hide_price · post caps/credits · service_requests · intro-videos bucket · chambers parity · lens courses (AI Governance seeded ₦200k/₦150k) · chamber_admins — verified via REST read-back. Schema and code match; `pnpm run check:migrations` is the gate (40, in sync).

**Still open from the changeset:** C01/C04/C21 (need Tobi's figures), C13 (intent unclear), C19 (decided "no build" — stay on Supabase). ⚠ **Corporate-posts Basic tier still on test price ₦100** — revert once real prices land.

## 2. The 18 Oct call — what Tobi actually wants

Tobi has asked three times (6, 7, 13 Oct) for the **design update** — *"There are some things I want Shefiu to integrate to the main page."* The call is to close out the website. Bring: (a) where the build actually is, (b) the pricing answers (below), (c) the feature decisions from the 12 Sep transcript.

## 3. 🐞 Tobi-reported bug — RESOLVED (2026-10-18, `05caa76`)

**"Email login doesn't work, only Google works."** — two stacked causes, both fixed:
1. **Tobi's account is Google-identity-only, no password** — `signInWithPassword` always fails; the error was a dead-end "Incorrect email or password". Now: `lib/auth/oauth-account.ts` detects this after a failed attempt and says *"This account signs in with Google. Continue with Google, or use 'Forgot your password?' to set a password."* Same fix on signup's "already registered" dead-end.
2. **Auth-email hook built 404 verify links** — `buildConfirmationUrl()` used the app domain as base; GoTrue hosts `/auth/v1/verify` on the Supabase project domain (ground truth via `admin/generate_link`). Now always `NEXT_PUBLIC_SUPABASE_URL`.

**Path for Tobi:** sign in with Google → Settings → Password & Security → set password → both methods work on the same account. Magic-link/reset emails depend on the hook being *enabled* in the Supabase dashboard — no management token to verify that; **confirm in dashboard → Auth → Hooks**.

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
pnpm run docs:render   # regenerate the two status docs from docs/data/*.json
pnpm run docs:check    # FAILS if those docs drifted, an id dangles, or an evidence path is gone
pnpm run docs:ask      # print the open questions for Tobi
```

**Docs rule:** `docs/FEATURE-STATUS.md` and `docs/TOBI-12SEP-CHANGES.md` are build artifacts. Change the JSON, run `docs:render`. `docs:check` validates ids, statuses, cross-references (feature ↔ change ↔ defect ↔ question) and checks every evidence path still exists on disk — a claim pointing at deleted code fails the gate.

**After writing any new migration:** `pnpm run migrations:push` then `pnpm run check:migrations` to confirm — seven migrations sat unapplied for days in Oct 2026 because nothing checked.

## 8. Live items to close

- [ ] Check whether the **design update** to Tobi/Shefiu (asked 3× — 6/7/13 Oct) was ever sent, and what came of the 18 Oct call — no record in this repo after 2026-10-18
- [ ] **Security fix pass** — `docs/AUDIT-2026-10-20.md` suggested order: rotate leaked keys (C2) → lock `profiles.role` (C1) → secure `/api/auth/hook` (C3) → cron path (H1) → `verifyPayment` ownership/idempotency (H2) → RLS + uploads (H4/H5) → CI (tsc/eslint/check:migrations/gitleaks)
- [ ] Answer the 5 pricing questions + clash-detection question (Q1, Q2–Q6, Q7 in `docs/TOBI-12SEP-CHANGES.md`)
- [ ] Get Tobi's verdict on C13 (remove directory attribution?) and C21 (silver contents) — the two undecided items
- [ ] Confirm the Brevo email hook is **enabled** in Supabase dashboard (Auth → Hooks) — magic-link/reset emails depend on it; no management token to read it programmatically
- [ ] Revert corporate-posts Basic tier from test price ₦100 once real prices land
- [ ] End-to-end smoke test: course checkout, PR publish → Slack review, service-request payment
- [ ] **Fix D1 — plans priced in NGN**: `plans` is still seeded with dollar-era values but formatted as NGN, so every plan page shows ₦20/₦2 (`20260629000002`; no currency column). Needs Tobi's Q2–Q6 figures; add a currency column while doing it
- [ ] **Fix D2 — gallery caps**: pass `isFirm` at `submit-listing.ts:65,74` and validate the chamber form server-side (it currently writes straight from the browser client)
- [ ] Fill the silver tier (D3) once Tobi answers Q8 — the rows are ₦0 placeholders
- [ ] Quick cleanup: bookmark button on cards (D5) · delete dead Calendly state fields (D6) · remove empty `chat/wallet/packages` dirs (D7) · error boundaries on admin + dashboard (D9)
- [ ] Build admin product analytics (D8) — same item as Tier 5 below
- [ ] Product analytics / telemetry (Tier 5) — signups · subscribers · revenue · funnel (admin-facing; not the per-lawyer widgets)

**Closed since 2026-10-18:** email-auth bug fixed (`05caa76`, deployed) · 12 Sep changeset committed + deployed · `pnpm run lint` fixed (eslint flat config, 0 errors).
