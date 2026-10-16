# Lawyard v2 — Feature Status Board

> **The single glance.** One row per feature, status at a glance.
> Reconciled from README §Status, `CHANGELOG.md`, `docs/features.md`, `HANDOFF.md` §6 (12 Sep decisions), and **verified against the codebase on 2026-10-16**.
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
| Branded auth emails (Brevo auth hook) | `app/api/auth/hook/route.ts` *(new, uncommitted)* |
| Turnstile CAPTCHA | `components/directory/auth/TurnstileWidget.tsx` |
| Lawyer multi-step profile wizard | `components/directory/forms/LawyerForm.tsx` + `FormStep` |
| Working-hours editor | `WorkingHoursEditor.tsx` → wired `LawyerForm.tsx:374` |
| Gallery upload | `GalleryUpload.tsx` → wired `LawyerForm.tsx:365` |
| FAQs / social links / awards / publications / memberships | schema (`20260617000001_extend_lawyers_table.sql`) + form editors |
| Chamber management + public chamber page | `app/directory/chamber/[id]`, `dashboard/chamber`, `ChamberForm` |
| Search (specialty, location, rating, price, experience + keyword) | `app/directory/search`, `SearchFilters.tsx` |
| Lawyer public profile page | `app/directory/lawyer/[id]` |
| Reviews (submit, display, auto-rating) | `components/directory/ReviewsSection.tsx`, reviews table |
| Client inquiries inbox | `dashboard/inquiries`, `lawyer_inquiries` table |
| Content Studio (articles + podcasts) | `forms/PublishArticleForm.tsx`, `PublishPodcastForm.tsx` |
| Slack editorial workflow (articles, podcasts, corporate posts) | `lib/slack.ts`, `app/api/slack/interactions` |
| WordPress publishing + media/tags/categories sync | `lib/wordpress.ts` |
| Coupon-gated article publishing | `actions/content.ts` + `components/ui/coupon-input.tsx` |
| Corporate posts (3 tiers, Paystack, admin review, scheduling) | `app/directory/corporate-posts/*` |
| Shop + cart + checkout + orders | `app/(main)/shop`, `app/dashboard/orders` |
| Paystack payments + webhook (HMAC-SHA512) | `lib/api/paystack.ts`, `app/api/webhooks/paystack` |
| Plans table (DB-managed pricing) | `actions/plans.ts`, `getPlans()` — *but see 🟡 currency* |
| Coupons (server-side enforced) + admin coupons UI | `app/admin/coupons`, coupons table |
| Subscription expiry cron | `app/directory/api/cron` (Vercel Cron, daily) |
| Verification flow (admin review) + Verified badge on cards | `app/admin/verifications`, `LawyerCard.tsx` ✓ Verified |
| Per-lawyer analytics — profile views + 14-day sparkline, inquiry trends | `AnalyticsSparkline.tsx`, `actions/analytics.ts` |
| Admin — lawyers CRUD, content manager, subscribers, settings, transactions, pipeline | `app/admin/*` |
| Route restructure (clean URLs, no `/directory` prefix) + middleware subdomain routing | `middleware.ts` |
| Error boundary (root) | `app/error.tsx` |
| Password visibility toggles, forgot-password modal, social icons in email footer | — |

---

## 2. Partial 🟡

| Feature | Gap |
|---|---|
| **Intro video** | `intro_video_url` field + YouTube-embed display exist (`LawyerForm.tsx:73`, `lawyer/[id]:332`). No **upload/hosted** UI — Tier 1 ask is a real upload flow with cloud-storage cost modelling (12 Sep). |
| **Pricing currency** | Plans seed still in **USD** (`$20 / $2`, `20260629000002_update_plans_data_exact.sql`). NGN direction is set; blocked on Tobi's 5 prices. |
| **Gallery** | Upload + display done; per-tier image caps ("max 6 / max 3") are display-only, not enforced. |
| **Verified badge** | Card-level done; confirm profile-level + "Claim Badge" flow. |
| **Error boundaries** | Root done; "on all routes" is a launch-checklist item. |

---

## 3. Scaffolded but empty 🟦

Route directories exist but contain **no `page.tsx`** — dead links if nav points at them.

| Feature | Path |
|---|---|
| Bookings dashboard | `app/directory/dashboard/bookings/` (empty) |
| Live chat dashboard | `app/directory/dashboard/chat/` (empty) |
| Wallet | `app/directory/dashboard/wallet/` (empty) |
| Packages | `app/directory/dashboard/packages/` (empty) |
| Insights (directory) | `app/directory/insights` → `ComingSoon` |
| Legislations (directory) | `app/directory/legislations` → `ComingSoon` |

---

## 4. Not started 🔴

| Feature | Tier | Notes |
|---|---|---|
| Appointment / booking system | 3 | No table/actions. Only the Calendly field exists (see 🗑). |
| Live chat | 4 | Empty dashboard dir; pricing page advertises it. |
| Admin product analytics (signups · subscribers · revenue · funnel) | 5 | No `app/admin/analytics`. **Scope confirmed 2026-10-16** (distinct from per-lawyer widgets). |
| Admin enhancements — CSV export, growth charts, multi-admin roles, audit log, corporate-post analytics, WYSIWYG | 6 | — |
| Infrastructure hardening | 7 | — |
| Unit + E2E tests, CI/CD, monitoring, backup strategy | — | README "Testing & Infra" |

---

## 5. Spec'd only — 12 Sep call 💬

Agreed with Tobi 2026-09-12; **none built**. Full context: `HANDOFF.md` §6. **Item-by-item walkthrough checklist: [`docs/TOBI-12SEP-CHANGES.md`](TOBI-12SEP-CHANGES.md).**

| Feature | Detail |
|---|---|
| **Chambers tier (separate pricing)** | Chamber subscribes at its own price point; enterprise ₦3–5M/annum discussed vs ₦155k individual. |
| **Chamber site-admin role** | A chamber administrator manages the chamber page + publishes PR/announcements to the directory. |
| **Silver tier** | New tier between free and premium; Tobi owes a note on what stays in silver vs premium. |
| **Post caps** | ~3 posts/month; extra posts = paid add-on. Funnel: 1 free post → subscribe. |
| **Back-end article publishing** | Lawyer publishes from backend to Lawyard site, editorial-gated. |
| **Service requests** | Renamed from "booking" — clients request services. |
| **Paid-only bookings** | No free booking that lets the conversation move off-platform. |
| **No Calendly / external calendar** | Explicit decision. *Conflicts with what's built — see §6.* |
| **Remove "link to directory" attribution** | For paying users. |
| **Private pricing option** | Hide price on the profile. |
| **Courses / Lawyard Lens** | AI-governance course ₦200k, ₦150k for directory subscribers (cross-sell). |
| **Move to AWS** | Infra migration (a feature is getting heavy usage). |
| **Foreign-currency listings** | NGN for Nigeria; handling for foreign listings TBD. |

---

## 6. Conflicts & cleanup 🗑❓

| Item | Situation |
|---|---|
| 🗑 **Calendly** | **Built** (`calendly_url` migration `20260711000001`, `LawyerForm.tsx:420`, display `lawyer/[id]:392`) but the 12 Sep call decided to **remove** it. Remove field + UI + migration or confirm reversal. |
| 🗑 **Bookmarks** | Shipped (`dashboard/favorites`, `BookmarkButton`), but 12 Sep questioned/removed it. Confirm final call. |
| ❓ **Pricing currency** | Public pricing reads DB plans seeded in **USD**; NGN is the direction. Blocked on Tobi's 5 prices. |
| ❓ **Dead nav links** | Confirm the sidebar does not link to the empty `bookings/chat/wallet/packages` dirs. |
| ❓ **"Email-based signing" bug** | Tobi-reported; interpretation (email auth vs e-signature) unconfirmed. `HANDOFF.md` §3. |

---

## 7. Must-do before public launch

| Item | Status |
|---|---|
| Rate limiting (Upstash Redis) on forms | 🔴 |
| pg_cron: auto-archive `pending_payment` > 24h | 🔴 |
| PDF download infrastructure | 🔴 |
| Error boundaries on all routes | 🟡 |
| 301 redirects from old WordPress URLs | 🔴 |
| Email notification system | 🔴 |
| Subscription expiry cron | ✅ |
| Paystack webhook fix (service role, chamber subs, featured) | ✅ |

---

## 8. Open questions (blocking)

**Pricing — 5 NGN prices unset:** Premium Single (Lawyer, 365d) · Premium Package (Lawyer, 365d) · Premium Single (Client, 90d) · Premium Package (Client, 90d) · Premium (Chamber, 365d).
**Plus:** scrap the 60-min corporate-post clash detection? (blocks back-to-back posts from different brands)

---

## Maintenance

- **Update this board** whenever a feature ships or a decision lands — same pass as `CHANGELOG.md` / `TIMELINE.md`.
- **Never trust the docs alone:** re-verify 🟡/🟦 rows against code before marking ✅.
- Superseded by this file: the `README.md` §Status table and `docs/features.md` (task archive; references a missing `AGENT_TASKS.md`).
