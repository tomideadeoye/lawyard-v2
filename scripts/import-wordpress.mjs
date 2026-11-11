#!/usr/bin/env node
/**
 * import-wordpress.mjs — pull WordPress posts into Supabase `articles`.
 *
 * The original migration was a snapshot (newest editorial dated 2026-06-12),
 * so the new site went live ~1,500 posts behind WordPress. This fills the gap.
 *
 * Idempotent: matches on `slug` and only inserts what is missing, so it is safe
 * to re-run. Never overwrites an article that already exists — edits made in the
 * new system win.
 *
 *   node scripts/import-wordpress.mjs --dry     report what would be inserted
 *   node scripts/import-wordpress.mjs           insert
 *   node scripts/import-wordpress.mjs --after 2026-06-12
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const afterArg = args.indexOf("--after");
const AFTER = afterArg !== -1 ? args[afterArg + 1] : "2026-06-12T00:00:00";

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(process.cwd(), ".env.local"), "utf8")
    .split("\n")
    .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")])
);

const WP = (env.WP_API_URL || "https://www.lawyard.org/wp-json/wp/v2").replace(/\/$/, "");
const WP_AUTH = `Basic ${Buffer.from(`${env.WP_USERNAME}:${env.WP_APP_PASSWORD}`).toString("base64")}`;
const SUPA = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPA || !KEY) throw new Error("missing Supabase credentials in .env.local");

const supaHeaders = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const stripHtml = (html = "") =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#8217;|&#8216;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/\s+/g, " ")
    .trim();

async function wp(pathname) {
  const response = await fetch(`${WP}${pathname}`, {
    headers: { Authorization: WP_AUTH, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`WP ${pathname}: ${response.status}`);
  return { json: await response.json(), headers: response.headers };
}

async function categoryMap() {
  const map = new Map();
  for (let page = 1; page <= 10; page += 1) {
    const { json } = await wp(`/categories?per_page=100&page=${page}&_fields=id,name`);
    if (!json.length) break;
    for (const c of json) map.set(c.id, c.name);
    if (json.length < 100) break;
  }
  return map;
}

const mediaCache = new Map();

/** One request per 100 ids instead of one per post — the per-post lookup is
 *  what made the first run take 25 minutes for 978 rows. */
async function prefetchMedia(ids) {
  const unique = [...new Set(ids.filter(Boolean))].filter((id) => !mediaCache.has(id));
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    const { json } = await wp(
      `/media?include=${chunk.join(",")}&per_page=100&_fields=id,source_url`
    );
    const found = new Map(json.map((m) => [m.id, m.source_url ?? null]));
    for (const id of chunk) mediaCache.set(id, found.get(id) ?? null);
    process.stdout.write(`\r  media ${Math.min(i + 100, unique.length)}/${unique.length}`);
  }
}

async function mediaUrl(id) {
  if (!id) return null;
  return mediaCache.get(id) ?? null;
}

async function existingSlugs(candidates) {
  const found = new Set();
  for (let i = 0; i < candidates.length; i += 80) {
    const chunk = candidates.slice(i, i + 80);
    const query = `articles?select=slug&slug=in.(${chunk.map((s) => `"${s}"`).join(",")})`;
    const response = await fetch(`${SUPA}/rest/v1/${query}`, { headers: supaHeaders });
    if (!response.ok) throw new Error(`slug lookup: ${response.status} ${await response.text()}`);
    for (const row of await response.json()) found.add(row.slug);
  }
  return found;
}

async function staffAuthorId() {
  const response = await fetch(
    `${SUPA}/rest/v1/articles?select=author_id&author_id=not.is.null&limit=1&order=created_at.asc`,
    { headers: supaHeaders }
  );
  const rows = await response.json();
  return rows?.[0]?.author_id ?? null;
}

async function main() {
  console.log(`WP → Supabase ${DRY ? "(dry run)" : ""}  after=${AFTER}`);
  const categories = await categoryMap();
  const authorId = await staffAuthorId();
  console.log(`  categories: ${categories.size} · staff author: ${authorId ?? "none"}`);

  const collected = [];
  for (let page = 1; ; page += 1) {
    const { json } = await wp(
      `/posts?per_page=100&page=${page}&status=publish&after=${AFTER}&orderby=date&order=asc&_fields=id,slug,date,title,excerpt,content,categories,featured_media,author`
    );
    if (!json.length) break;
    collected.push(...json);
    process.stdout.write(`\r  fetched ${collected.length} posts`);
    if (json.length < 100) break;
  }
  console.log("");

  await prefetchMedia(collected.map((p) => p.featured_media));
  console.log("");

  const existing = await existingSlugs(collected.map((p) => p.slug));
  const missing = collected.filter((p) => !existing.has(p.slug));
  console.log(`  existing: ${existing.size} · to insert: ${missing.length}`);

  if (DRY) {
    for (const post of missing.slice(0, 5)) {
      console.log(`   would insert ${post.date.slice(0, 10)} · ${stripHtml(post.title.rendered)}`);
    }
    console.log(`  (${missing.length} total)`);
    return;
  }

  let inserted = 0;
  let skipped = 0;
  for (const post of missing) {
    const row = {
      title: stripHtml(post.title.rendered),
      slug: post.slug,
      content: post.content?.rendered ?? "",
      excerpt: stripHtml(post.excerpt?.rendered ?? "").slice(0, 400) || null,
      featured_image: mediaUrl(post.featured_media),
      author_id: authorId,
      status: "published",
      article_type: "editorial",
      category: (post.categories ?? []).map((id) => categories.get(id)).filter(Boolean),
      created_at: post.date,
      updated_at: post.date,
    };
    if (!row.category.length) row.category = ["News"];

    const response = await fetch(`${SUPA}/rest/v1/articles`, {
      method: "POST",
      headers: { ...supaHeaders, Prefer: "return=minimal,resolution=merge-duplicates" },
      body: JSON.stringify(row),
    });

    if (response.status === 409) {
      // Same slug already present (WordPress stores some slugs percent-encoded
      // while the migrated row holds the decoded form). Treat as done.
      skipped += 1;
      continue;
    }
    if (!response.ok) {
      console.error(`\n  ✗ ${post.slug}: ${response.status} ${(await response.text()).slice(0, 160)}`);
      continue;
    }
    inserted += 1;
    if (inserted % 50 === 0) process.stdout.write(`\r  inserted ${inserted}/${missing.length}`);
  }
  console.log(`\n  done: ${inserted} inserted, ${skipped} already present, ${missing.length - inserted - skipped} failed`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
