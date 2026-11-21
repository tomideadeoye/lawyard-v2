# Moving Lawyard off WordPress (parked)

**Status: parked — not the current plan.** The decision taken in November 2026 is
to keep the news site on WordPress and run this application as the directory
only. Keep this document as the costed plan if that decision is ever revisited;
do not treat it as a to-do list.

Everything needed to point `www.lawyard.org` at this application and retire the
WordPress install. Written to be followed in order; each section says what
breaks if it is skipped.

**Current state:** this application serves `directory.lawyard.org` only.
`www.lawyard.org` is WordPress on Bluehost and remains the editorial source and
the news site. The news front end that was built here has been removed; corporate
posts are still sold and reviewed in this app and published to WordPress.

---

## 0. Run it locally first

```bash
pnpm install
pnpm dev
```

| What you want | URL |
|---|---|
| The directory | http://localhost:3000 |
| A directory route directly | http://127.0.0.1:3000/search |

The middleware rewrites any request whose host starts with `localhost` to
`/directory`, so plain `localhost` shows the marketplace. `127.0.0.1` bypasses
that rewrite and serves the same routes at their unprefixed paths.

`pnpm dev` reads `.env.local`, which points at the **production** Supabase
project and the live Paystack keys. Anything you submit locally writes to real
data. For a safe sandbox, create a second Supabase project and swap the three
`NEXT_PUBLIC_SUPABASE_*` / `SUPABASE_SERVICE_ROLE_KEY` values.

---

## 1. Media: the blocker nobody notices until flip day

**9,553 of 9,554 published covers are hotlinked from
`https://www.lawyard.org/wp-content/uploads/...`.** They work today because
WordPress is still serving them. The moment the domain moves, every one of those
images 404s.

Do this before anything else:

1. Mirror the uploads directory to durable storage — Supabase Storage (already
   provisioned) or Vercel Blob.
2. Rewrite every `featured_image` (and any inline `<img src>` inside article
   `content`) to the new host.
3. Keep the old `wp-content/uploads/**` paths answering for at least 12 months
   via a redirect rule, so external backlinks and social embeds do not rot.

A migration script should be idempotent and report counts before/after; treat any
remaining `www.lawyard.org` image reference as a release blocker:

```sql
select count(*) from articles
where status = 'published' and featured_image like 'https://www.lawyard.org%';
-- must be 0 before cutover
```

---

## 2. SEO

| Item | Where | Notes |
|---|---|---|
| Sitemap | `/sitemap.xml` (`app/sitemap.ts`) | Articles, podcasts and static routes; regenerated every 15 min |
| Robots | `/robots.txt` (`app/robots.ts`) | Allows public routes, disallows `/admin`, `/dashboard`, `/api/`, `/checkout`, `/cart`, auth pages |
| Canonicals | `app/(main)/insights/[slug]` metadata | Must emit `https://www.lawyard.org/insights/<slug>` |
| Structured data | Article JSON-LD | `NewsArticle` with headline, datePublished, author, image, publisher |
| Feed | `/feed.xml` | Already implemented |
| OG/Twitter cards | root layout metadata | Currently points at `lawyard.org` — confirm it matches the final host |

**Redirect map — do not skip.** WordPress URLs do not all match this app's
routes:

| WordPress | New |
|---|---|
| `/news/<slug>` | `/insights/<slug>` |
| `/<slug>` (post) | `/insights/<slug>` |
| `/category/<taxonomy>` | `/category/<taxonomy>` (kept) |
| `/corporate-posts/<slug>` | `/corporate-posts/<slug>` (kept) |
| `/feed` | `/feed.xml` |
| `/?p=<id>` | resolve to the new slug |

Implement these as 301s in `next.config.js` (or middleware). A missing 301 turns
11k indexed URLs into 404s overnight, which is the fastest way to lose search
traffic.

**Search Console, day of cutover:**

1. Add `www.lawyard.org` as a property in the new Google Search Console (verify
   by DNS TXT, not the old WordPress file).
2. Submit the new sitemap.
3. Use **Change of Address** only if you also move to a different hostname; for a
   same-domain replatform, keep the URLs and rely on the 301s.
4. Watch Coverage → "Not found (404)" for two weeks.

---

## 3. Payments (Paystack)

- **Webhook URL must move**: the dashboard currently posts to the WordPress-era
  endpoint. Set it to `https://www.lawyard.org/api/webhooks/paystack` before the
  cutover, and keep the old one configured until the DNS flip is verified.
- **Callback/redirect URLs**: any hardcoded `directory.lawyard.org` in Paystack
  settings or in-app return paths must accept both hosts during the transition.
- **Verify the secret**: `PAYSTACK_SECRET_KEY` in Vercel must be the live key, and
  the webhook HMAC check (`x-paystack-signature`, SHA-512) must pass in
  production. Test with a live ₦100 transaction and confirm the `transactions`
  row is written and the receipt email sends.
- **Reconcile after go-live**: compare Paystack dashboard totals against
  `transactions` for the cutover day. Mismatch means webhooks were delivered to
  the old host.
- **Keep the same `reference` scheme** (`generatePaymentReference`) so historical
  references never collide.

---

## 4. Hosting and DNS

The application runs on Vercel; WordPress is on Bluehost.

**Recommended: move DNS to Vercel** (nameservers `ns1.vercel-dns.com`,
`ns2.vercel-dns.com`). If you would rather keep Bluehost DNS, set:

- `www` → CNAME `cname.vercel-dns.com`
- apex `lawyard.org` → A `216.198.79.1` (and `76.76.21.21` as the fallback Vercel
  still lists)

**Email is the trap.** Moving nameservers moves *all* records. Before the switch,
export the existing zone from Bluehost and recreate:

- `MX` records (Google Workspace / Zoho / whatever lawyard.org uses)
- `TXT` SPF, `DKIM` (selector specific), `DMARC`
- Any verification TXT records (Search Console, Brevo, Supabase)

If MX is missed, the team's mail stops the same hour. Verify with
`dig MX lawyard.org` before and after.

**Vercel plan:** Hobby caps cron jobs at once a day. This repo needs sub-daily
work (WordPress sync, subscription expiry); either upgrade to Pro, or keep the
scheduled work in GitHub Actions as it is today.

**Redirects:** `/directory` paths must keep working, and `directory.lawyard.org`
should either stay as an alias or 301 to `www.lawyard.org/directory`. Decide once
and record it here.

---

## 5. Email and auth

- Supabase Auth sends through the Send Email hook at
  `/api/auth/hook` (Brevo). The hook and the templates must reference the **new**
  host, and the Supabase project's Site URL / redirect allow-list must include
  `https://www.lawyard.org/**` **before** the flip, or confirmation links break
  for everyone signing up on day one.
- Brevo: verify the sending domain for the new host (SPF/DKIM), otherwise
  transactional mail lands in spam after DNS moves.
- Re-test the full flow after cutover: signup → confirmation → login → password
  reset, on a phone and a desktop.

---

## 6. Retiring WordPress

1. Freeze editing in WordPress at cutover time (announce it to the editors).
2. Take a final content export: `wp-json/wp/v2/posts` in pages, plus the uploads
   directory. The import script used for the pilot lives in git history —
   restore it before starting, or write a fresh one against the export.
3. Keep the WordPress install **read-only and reachable** for 90 days — it is the
   rollback and the image archive (until section 1 is done).
4. After 90 days: export a final database dump, archive it, then decommission.
   Cancel the Bluehost *hosting* plan only after the DNS and mail records are
   proven stable; keep the domain registration.
5. Once editorial moves into the new system, keep the publish-to-WordPress path
   only as long as articles are still authored there. Corporate posts publish to
   WordPress today (`lib/wordpress.ts`); that integration is the last thing to
   retire.

---

## 7. Before you flip: definition of done

- [ ] `select count(*) from articles where featured_image like 'https://www.lawyard.org%'` = 0
- [ ] `/sitemap.xml` returns XML with >10k URLs; `/robots.txt` points at it
- [ ] 20 sampled WordPress URLs 301 to the right new URL
- [ ] Paystack webhook delivers to the new host (one live test transaction)
- [ ] Confirmation / magic-link / reset emails arrive and sign in
- [ ] `MX`, SPF, DKIM, DMARC verified with `dig` after the nameserver change
- [ ] Directory still reachable at `/directory` and `directory.lawyard.org`
- [ ] Rollback rehearsed: pointing `www` back at Bluehost restores the old site
      within the TTL (set TTL to 300s a day before the change)

## 8. Rollback

Keep the old DNS answers recorded here before the change. A cutover is reversible
in minutes only if the previous A/CNAME values and the Bluehost install are still
intact — do not cancel hosting until the new site has run clean for two weeks.
