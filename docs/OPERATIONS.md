# Running Lawyard in production

The things that keep the platform alive: the directory application on
`directory.lawyard.org` and the WordPress news site on `www.lawyard.org`. They
are converging: the article templates in this application now carry the news
site's advertising inventory, and the marketplace operations (database, payments,
editorial pipeline) already live here.

---

## 1. Advertising

**Decision (21 Nov 2026): direct-sold house inventory, held in the database.**
Google AdSense stays authorised on both hosts — `public/ads.txt` carries
publisher `pub-4277067372936546` — but **no AdSense unit is wired into a page**.
The previous site's three banner slots were hand-edited WordPress theme regions
(`ad_before_content`, `ad_after_content`, `ad_container_bottom`); inventory is
now data in `ad_slots`, edited at `/admin/ads`.

**How it works**

- One row per creative: placement, image, destination, alt text, intrinsic
  width/height, weight, active flag, start/end flight.
- `<AdSlot placement="…" />` (`components/ads/ad-slot.tsx`) resolves the live
  creative on the server and renders image → link → its label (default
  "Advertisement"). An empty, paused or expired slot renders **nothing** — no
  placeholder, no gap.
- Four placements: `article-before`, `article-after`, `footer-banner`,
  `sidebar`, wired into the Corporate Post and Insight article templates.
- Several live creatives in one placement: highest weight wins, ties go to the
  newest booking.
- Destinations are restricted to absolute `http(s)` or site-relative paths;
  external links carry `rel="sponsored nofollow noopener noreferrer"` and are
  reached through `/ads/click/[id]`, which counts the click server-side before
  redirecting. An unvalidated destination falls back to the home page rather
  than acting as an open redirect.

**Delivery reporting**

- An impression is counted when the creative is actually in view
  (`IntersectionObserver`, once per creative per session), not when the page
  renders — so a banner nobody scrolls to does not pad the report.
- Clicks are counted in the redirect route, so they survive ad blockers and
  browsers with JavaScript off.
- Both land in `ad_events` as a daily rollup per creative per kind, written
  through one `SECURITY DEFINER` function (`record_ad_event`); the table itself
  has no policies and is readable only by the service role.
- `/admin/ads` shows 7-day views and clicks with a 28-day CTR per creative.
- **Read the numbers as directional, not audited.** The counters are
  first-party and anonymous, with no bot filtering — fine for a house
  inventory conversation, not for billing a third party by impression. If a
  buyer demands audited numbers, that is what a third-party ad server is for.

**Models considered**

| Model | What it needs | Verdict |
|---|---|---|
| AdSense | Script in the layout, fixed slots, consent banner | Kept as an authorisation, not as in-article inventory |
| **Direct-sold** | Inventory rows, flight dates, creative + target URL | **Chosen** — the banners already on the site are sold, not filled |
| Both | AdSense as fill behind direct-sold | Revisit for the sidebar only, once there is traffic data |

**Why not AdSense in the article**: direct-sold placement is the higher-value
product and it is what proves the page can carry paid inventory. A Google unit
above and below a *paid* Corporate Post devalues the page a client forwards to
their own board. If Google revenue returns, put it in the sidebar — the one
position with no direct booking — not in the reading column.

**Non-negotiables, and how each is met**

- **Reserve space for every slot.** The row stores the creative's width and
  height, and the component renders them as `width`/`height`, so the box is
  reserved before the image arrives. Nothing shifts when an ad loads.
- **Label sponsored content.** Every slot renders its own label, and Corporate
  Posts carry brand name and tier above the fold — a regulatory expectation in
  a legal market, and an AdSense policy one.
- **Consent before personalised ads.** House ads are first-party images with no
  cookies and no third-party script, so they need no consent. **Any AdSense
  unit reopens this** and must not ship before the consent banner covers it
  (NDPA, plus AdSense's EU/UK rules).
- **Keep `ads.txt` authoritative.** `public/ads.txt` mirrors the WordPress
  line. Append a second network's line; never replace AdSense's while it is
  still serving.

**Open**

- **No bot filtering on the ad counters.** Impressions are counted by the
  beacon and clicks by the redirect; neither tries to separate a person from a
  crawler or a scripted request. Add filtering only when a number is used for
  billing.
- **The seeded creatives hotlink `www.lawyard.org/wp-content/…`.** They work
  only while WordPress runs; copy them into Supabase Storage and repoint the
  rows before cutover.
- **Direct-sold and the paid tiers are still two steps.** The Core and Pro
  Corporate Post tiers promise homepage placement; today that placement is
  booked separately in `/admin/ads`.

---

## 2. The database

Supabase (Postgres) holds articles, profiles, listings, transactions, coupons and
auth. It is the single point of failure for everything.

**Capacity and plan**

- The project is on a small/free-tier plan. Free tier pauses on inactivity, caps
  database size and storage, and gives limited backup retention — confirm the
  plan before launch traffic arrives.
- 11k articles with `content` HTML is modest (hundreds of MB at most), but the
  **media is the real weight**: ~9.5k images currently live on the WordPress
  host, not in Supabase. Moving them into Storage changes the cost profile — size
  the plan for egress, not just storage.

**Backups**

- Enable **point-in-time recovery** (paid tier) before cutover. Daily logical
  backups alone lose up to 24 hours of publishing and every transaction in
  between.
- Rehearse a restore into a scratch project once. An untested backup is a
  rumour.

**Migrations**

- Schema lives in `supabase/migrations/`. `pnpm run check:migrations` fails when
  the folder and the applied schema drift, when two files claim the same
  version, and when a file's name is not `<14-digit version>_<name>.sql`; run it
  in CI and before any push. The version prefix is the key in
  `supabase_migrations.schema_migrations` — unique per file, never reused, never
  changed once applied.
- Never patch production through the dashboard SQL editor without a matching
  migration file — that is how drift starts.

**Access and safety**

- Row Level Security is on for user-facing tables. Any new table ships with
  policies in the same migration, or it is readable by anyone with the anon key.
- The service-role key lives only in server code and Vercel env. It must never
  appear in a client component or a `NEXT_PUBLIC_*` variable.
- Give the team named accounts, not a shared login, and require 2FA on the
  Supabase organisation.

**Data lifecycle**

- Deletion requests (NDPA): identity is spread across `auth.users`, `profiles`,
  `lawyers`, `articles`, `transactions`. Deleting the auth user does not remove
  the rest — write down the order, or add a cascade.
- Retain financial records (transactions) for the accounting period required by
  Nigerian law; do not cascade-delete those with a profile.

**Staging**

- Use a second Supabase project for staging, and a Vercel preview environment
  pointed at it. Testing against production data is how a "quick fix" deletes a
  real article.

---

## 3. What else breaks that nobody lists

**Measurement**

- **Web Analytics + Speed Insights are installed** (`@vercel/analytics`,
  `@vercel/speed-insights`, mounted in the root layout). Traffic and Core Web
  Vitals appear under the project's Analytics tab in Vercel.
- **Error tracking is in-house**: `app_errors` table, `/api/errors` sink,
  `ErrorReporter` for uncaught exceptions and rejections, and the error
  boundaries report through the same channel. Review at `/admin/errors`.
  Provision it with `supabase/migrations/20261121000001_app_errors.sql`.
- Still to add: Search Console and Bing/IndexNow (so search visibility is
  measured, not assumed), and uptime monitoring on `/`, `/search` and the
  Paystack webhook.

**Search and discovery**

- Postgres full-text search covers the news archive today; verify it across 11k
  rows before launch, and decide whether category + date archives need pagination
  (they currently cap at the newest 30).
- Google News and Discover want a news sitemap, author pages with real bylines,
  and visible publish dates. The `articles.author_id` currently points at a single
  "Lawyard Staff" profile — that is a Discover ceiling, not a bug.

**Email**

- Brevo sends both the newsletter and auth mail. Verify the sending domain for
  `lawyard.org` and keep SPF/DKIM/DMARC records when DNS moves; auth emails
  landing in spam looks like "login is broken".
- Keep the newsletter consent list separate from transactional recipients — a
  marketing send to auth users is a compliance problem.

**Performance and cost**

- Images are hotlinked from the WordPress host with no optimisation. Once moved,
  serve them through a CDN with size negotiation, or the 9.5k covers will dominate
  bandwidth.
- Cache what can be cached: the front page and article pages are dynamic today.
  ISR with a short revalidate cuts database load without showing stale news.

**Security**

- Rate-limit the auth endpoints and the coupon validator; both are cheap to
  abuse.
- Keep Turnstile enabled on signup and login.
- The admin routes are role-gated in middleware; confirm no new route ships
  outside that check.

**Legal**

- Privacy policy, terms, cookie notice and a data-request contact must match what
  the site actually does (analytics, ads, newsletter).
- Corporate posts are paid content: the page needs a disclosure, and the invoice
  trail must survive in `transactions`.

**People**

- Roles: who can publish, who can approve, who can issue coupons, who can refund.
  The admin currently trusts the `admin` role broadly — split it before more staff
  get access.
- Write the incident runbook: who to call if Paystack stops, if Supabase pauses,
  if the domain fails to resolve.

**Vendors to keep an inventory of**

Vercel (hosting), Supabase (database/auth/storage), Paystack (payments), Brevo
(email), Slack (editorial approvals), Google AdSense, the registrar, and the
WordPress host during the transition. Each needs an owner, a billing contact, and
an export path.
