# Product decisions

> **GENERATED FILE — do not edit by hand.** Source of truth: `docs/data/decisions.json`.
> Regenerate: `pnpm run docs:render` · Gate: `pnpm run docs:check`.

A rule that lives only in a chat message gets re-litigated. Each row records what
was decided, who decided it, and why — so the next person can tell a deliberate
constraint from an accident.

## Active (9)

| # | Decision | Decided by | Date |
|---|---|---|---|
| `PD-001` | Until the WordPress migration completes, this application is the directory only and the news site stays on WordPress. | Tomide | 2026-11-21 |
| `PD-002` | A lawyer appears in search only when verification_status = 'verified'. | Tomide | 2026-11-21 |
| `PD-003` | A law-firm page publishes only when it is complete: name, 120+ character description, location, practice area, email or phone, and one image. | Tomide | 2026-11-21 |
| `PD-004` | A law firm may be registered by an administrator who is not a lawyer, and a member lawyer is not required to publish. | Tomide | 2026-11-21 |
| `PD-005` | The law-firm plan is ₦1,000,000 per year, flat, including up to 15 lawyer profiles. Lawyers under the plan pay no individual fee. | Tobi | 2026-11-24 |
| `PD-006` | A plan priced above zero but below ₦1,000 is treated as an unset placeholder: shown as "Pricing under review" and not purchasable. | Tomide | 2026-11-09 |
| `PD-007` | Advertising stays on the WordPress news site; the directory carries no ad slots. | Tomide | 2026-11-21 |
| `PD-010` | The target state is off WordPress. The news site migrates gradually, section by section, with WordPress serving anything not yet replaced. | Tobi (relayed by Tomide) | 2026-11-24 |
| `PD-011` | The news front end is restored and served on non-directory hosts (the *.vercel.app review host), while directory.lawyard.org keeps serving the marketplace. WordPress remains the public news site until its phase completes. | Tomide | 2026-11-24 |

## Proposed — awaiting a decision (2)

| # | Decision | Decided by | Date |
|---|---|---|---|
| `PD-008` | The directory opens as a founding-listings marketplace, not as a finished one: below 25 verified lawyers the homepage invites listings instead of publishing counts. | Engineering recommendation | 2026-11-24 |
| `PD-009` | An owner may preview their own draft firm page; the public sees a 404. | Engineering recommendation | 2026-11-21 |


## Detail

### PD-001 — Until the WordPress migration completes, this application is the directory only and the news site stays on WordPress.

- **Status:** active
- **Decided by:** Tomide
- **Why:** The split was taken to protect the marketplace from a premature cutover. It remains the current state; the target state is set by PD-010.
- **Applies to:** `app/(main) removed` · `app/page.tsx redirects to /directory` · `www.lawyard.org not attached to Vercel`

### PD-002 — A lawyer appears in search only when verification_status = 'verified'.

- **Status:** active
- **Decided by:** Tomide
- **Why:** The Verified badge has to mean something. A pending profile is a draft; the dashboard tells the lawyer why they are not visible instead of leaving them to guess.
- **Applies to:** `lib/directory/api.ts getLawyers` · `app/directory/dashboard/page.tsx`

### PD-003 — A law-firm page publishes only when it is complete: name, 120+ character description, location, practice area, email or phone, and one image.

- **Status:** active
- **Decided by:** Tomide
- **Why:** A page whose only content is a name cannot rank and cannot convert. Drafts stay editable, invisible in the index, search and sitemap.
- **Applies to:** `lib/directory/publishability.ts` · `chambers.published_at` · `app/directory/chamber` · `app/sitemap.ts`

### PD-004 — A law firm may be registered by an administrator who is not a lawyer, and a member lawyer is not required to publish.

- **Status:** active
- **Decided by:** Tomide
- **Why:** Firm administrators are often practice managers or marketing staff. Requiring a lawyer would exclude legitimate firms; the completeness gate covers the quality risk instead.
- **Applies to:** `lib/directory/publishability.ts`

### PD-005 — The law-firm plan is ₦1,000,000 per year, flat, including up to 15 lawyer profiles. Lawyers under the plan pay no individual fee.

- **Status:** active
- **Decided by:** Tobi · WhatsApp, 24 Nov 2026
- **Why:** Client instruction: "put N1m per year, we will review it later if necessary. No fees for individual lawyers under the law firm plan." The fee is a firm subscription, not a per-seat price.
- **Applies to:** `plans.price (chamber Premium)` · `components/directory/seat-checkout.tsx` · `app/directory/pricing/page.tsx`

### PD-006 — A plan priced above zero but below ₦1,000 is treated as an unset placeholder: shown as "Pricing under review" and not purchasable.

- **Status:** active
- **Decided by:** Tomide
- **Why:** The plans table still carries dollar-era figures. Selling a 365-day premium listing for ₦2 is worse than selling nothing, and the guard releases automatically once real naira prices land.
- **Applies to:** `app/directory/pricing/page.tsx`

### PD-007 — Advertising stays on the WordPress news site; the directory carries no ad slots.

- **Status:** active
- **Decided by:** Tomide
- **Why:** Ad revenue depends on editorial traffic, which remains on WordPress. Ad slot components exist for a future direct-sold offer but are not wired into marketplace pages.
- **Applies to:** `public/ads.txt` · `components/ads`

### PD-010 — The target state is off WordPress. The news site migrates gradually, section by section, with WordPress serving anything not yet replaced.

- **Status:** active
- **Decided by:** Tobi (relayed by Tomide)
- **Why:** A single big-bang cutover carries a media migration, an 11k-URL redirect map, ad re-integration and an untested editorial surface at once. Gradual migration keeps every step reversible and lets one section prove itself before the next moves.
- **Applies to:** `docs/WORDPRESS-MIGRATION.md` · `docs/CUTOVER.md` · `docs/plans/media-storage.jsonl`

### PD-011 — The news front end is restored and served on non-directory hosts (the *.vercel.app review host), while directory.lawyard.org keeps serving the marketplace. WordPress remains the public news site until its phase completes.

- **Status:** active
- **Decided by:** Tomide
- **Why:** The client asked to see the new news website. Serving it by host keeps the directory untouched and avoids a second public, indexable news site.
- **Applies to:** `app/(main) restored` · `app/page.tsx removed` · `docs/WORDPRESS-MIGRATION.md Phase 0`

### PD-008 — The directory opens as a founding-listings marketplace, not as a finished one: below 25 verified lawyers the homepage invites listings instead of publishing counts.

- **Status:** proposed
- **Decided by:** Engineering recommendation
- **Why:** The alternative is advertising an inventory that does not exist. Honest scarcity recruits suppliers; invented numbers destroy trust once checked.
- **Applies to:** `app/directory/page.tsx`

### PD-009 — An owner may preview their own draft firm page; the public sees a 404.

- **Status:** proposed
- **Decided by:** Engineering recommendation
- **Why:** Owners need to see what they are publishing. Leaving drafts publicly addressable would expose thin pages to crawlers and reviewers.
- **Applies to:** `app/directory/chamber/[id]/page.tsx` · `lib/directory/api.ts`
