# Migrating off WordPress, gradually

**Decision (PD-010):** the target state is off WordPress. The news site moves
section by section, and WordPress keeps serving whatever has not been replaced
yet. Nothing is turned off until its replacement has proven itself in public.

This is the plan; the domain flip itself is described in [`CUTOVER.md`](CUTOVER.md),
and the media track in [`plans/media-storage.jsonl`](plans/media-storage.jsonl).

---

## The shape of a gradual migration

Two rules make it safe:

1. **One section at a time, with its own 301s.** Old URL → new URL, live, before
   the old page is retired.
2. **WordPress stays the editor until an editorial surface exists here.** Moving
   readers without moving writers just creates two publishing dead-ends.

---

## Phase 0 — restore the capability, keep it dark

The news front end and the WordPress→database sync were removed when the site was
split (`a2869b9`). They are in git history, not lost.

**Work**

- Restore from the parent of the split commit:
  `git checkout a2869b9^ -- "app/(main)" lib/wordpress-sync.ts scripts/import-wordpress.mjs app/api/sync .github/workflows/wordpress-sync.yml`
- Put the routes behind an environment flag (`NEWS_SITE=enabled`) so nothing is
  public until a phase says so.
- Re-run the sync once and confirm the article count matches
  `wp-json/wp/v2/posts` totals.

**Exit criteria:** builds and passes tests with the flag off; with the flag on,
locally, the front page renders database content and no mock arrays remain.

**Rollback:** do nothing — the flag stays off.

---

## Phase 1 — dual run, private

**Goal:** prove parity without exposing a second indexable copy of the news.

**Work**

- Deploy the news site on a **noindex** subdomain or preview host (`beta.` or a
  Vercel preview with protection on).
- Compare against WordPress: article count, categories, missing images, broken
  links, redirect behaviour.
- Run the sync on a schedule again so the two stay close.

**Exit criteria:** a side-by-side review list with zero unexplained gaps; the
media inventory reports the true number of hotlinked assets.

**Rollback:** delete the alias. Public site untouched.

---

## Phase 2 — first public section

**Suggested order:** `insights` + `category`, because they carry the most URLs
and the clearest redirect rule.

**Work**

- 301 map: `/news/<slug>` → `/insights/<slug>`, `<slug>` → `/insights/<slug>`,
  `/?p=<id>` resolved, `/category/<taxonomy>` kept.
- Serve the section from this application under the **same** hostname the reader
  already uses (`/insights/...` on the news domain), while WordPress keeps the
  homepage, podcasts and TV.
- Submit the new sitemap in Search Console; watch 404s for two weeks.

**Exit criteria:** zero 404s introduced, indexed URLs preserved, AdSense still
serving on the pages it served before.

**Rollback:** point the `/insights` path back at WordPress; the 301s revert with it.

**Risk:** mixed-host routing. If the application and WordPress cannot share a
hostname cleanly, this phase becomes "move the whole domain" (see `CUTOVER.md`)
and the gradual plan collapses into Phase 5. Decide this before starting.

---

## Phase 3 — editorial surface (the real work)

Readers can move in a day. Writers cannot move until they have somewhere to
write. Choose one:

| Option | Cost | Consequence |
|---|---|---|
| **Payload CMS** inside this app | ~1–2 weeks | Postgres-native, drafts, preview, roles, media library; one deployment |
| **Build the admin screens** | ~2 weeks | Bespoke, smaller surface, no vendor; you own the edge cases |
| **Ghost for editorial only** | ~1 week | Fast, but a second system and a second auth |

**Exit criteria:** a real article is drafted, reviewed and published here without
touching WordPress, including images.

**Rollback:** keep the WordPress editor active until two full publishing cycles
have run on the new surface.

---

## Phase 4 — media

Run [`plans/media-storage.jsonl`](plans/media-storage.jsonl). It exists because
**9,553 covers are hotlinked from `www.lawyard.org/wp-content/uploads`** — the
site breaks the hour WordPress stops answering. This phase is a hard prerequisite
for Phase 5, not an optimisation.

**Exit criteria:** `select count(*) from articles where featured_image like 'https://www.lawyard.org%'`
returns 0, and the uploads directory is a redirect tail rather than the origin.

---

## Phase 5 — finish

Follow [`CUTOVER.md`](CUTOVER.md): DNS, mail records, Paystack webhook, auth email
host, final sync, WordPress read-only for 90 days, then decommission.

---

## What stays true while this runs

- **The directory is unaffected.** It lives on its own host and has no dependency
  on where the news is served.
- **Corporate posts keep publishing to WordPress** until Phase 3 lands; they are
  sold and reviewed in the directory app.
- **Do not run two indexable news sites.** A beta host stays `noindex` until its
  section is the canonical one.
