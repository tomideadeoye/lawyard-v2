# Running Lawyard in production

The things that keep the platform alive: the directory application on
`directory.lawyard.org` and the WordPress news site on `www.lawyard.org`, which
remain separate. Advertising and news SEO belong to the WordPress side; the
database and marketplace operations belong to this application.

---

## 1. Advertising

**The news site monetises through Google AdSense** — `www.lawyard.org/ads.txt`
carries publisher `pub-4277067372936546`. `public/ads.txt` in this repository
carries the same line for the directory host.

Advertising lives on the WordPress side. This application only needs slots if
the directory is ever monetised directly; `components/ads/ad-slot.tsx` exists for
that but is not wired into marketplace pages.

Decide one of these before cutover:

| Model | What it needs | Trade-off |
|---|---|---|
| **AdSense (status quo)** | Script in `app/layout.tsx`, fixed slots in the article template and sidebar, `ads.txt`, consent banner | Zero sales effort, low CPM, no control over creative |
| **Direct-sold** | Inventory in the DB (slot, flight dates, creative URL, target URL), a small scheduler, impression/click logging | Higher CPM, real work, needs someone selling |
| **Both** | AdSense as fill, direct-sold as priority | Standard for news; needs a simple ad server |

Whatever you choose, the non-negotiables:

- **Reserve space** for every slot (fixed height) — ads that shift layout cost
  Core Web Vitals, which costs search ranking.
- **Label sponsored content.** Corporate posts already carry a tier and brand
  name; the page must say "Sponsored" above the fold — a regulatory expectation
  and an AdSense policy one.
- **Consent before personalised ads.** Nigeria's NDPA and AdSense's EU/UK rules
  both require it; the site already has a cookie-consent component, extend it.
- **Keep `ads.txt` authoritative.** If you add a second network, append its line;
  never replace AdSense's while it is still serving.

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
  the folder and the applied schema drift; run it in CI.
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

- No analytics is installed. Add Vercel Analytics (or GA4) plus Search Console and
  Bing/IndexNow before launch — otherwise you cannot tell whether the cutover
  cost you traffic.
- Add error tracking (Sentry or similar). Right now a failed server render is
  invisible unless a user complains.
- Uptime monitoring on `/`, `/insights` and the Paystack webhook.

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
