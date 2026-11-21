#!/usr/bin/env node
/**
 * fix-broken-images.mjs — repair article cover images.
 *
 * 531 imported posts landed with `featured_image = "{}"` instead of a URL,
 * which renders as <img src="{}"> and a broken-image icon on the front page.
 * This re-reads each affected post from WordPress by slug, resolves its featured
 * media and writes the real URL; posts with no media get NULL so the UI shows
 * its placeholder instead of a broken image.
 *
 *   node scripts/fix-broken-images.mjs --dry
 *   node scripts/fix-broken-images.mjs
 */
import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry");

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
const supaHeaders = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const isUrl = (value) => typeof value === "string" && /^https?:\/\//.test(value);

async function wpJson(pathname) {
  const response = await fetch(`${WP}${pathname}`, {
    headers: { Authorization: WP_AUTH, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`WP ${pathname}: ${response.status}`);
  return response.json();
}

async function main() {
  // Anything that is neither NULL nor a real URL is broken.
  const listResponse = await fetch(
    `${SUPA}/rest/v1/articles?select=id,slug,featured_image&or=(featured_image.eq.%7B%7D,featured_image.not.like.http*)&status=eq.published&limit=2000`,
    { headers: supaHeaders }
  );
  const rows = (await listResponse.json()).filter(
    (r) => r.featured_image !== null && !isUrl(r.featured_image)
  );
  console.log(`broken covers: ${rows.length}${DRY ? " (dry run)" : ""}`);

  let fixed = 0;
  let cleared = 0;
  const media = new Map();

  for (const row of rows) {
    let url = null;
    try {
      const posts = await wpJson(`/posts?slug=${encodeURIComponent(row.slug)}&_fields=featured_media`);
      const mediaId = posts?.[0]?.featured_media;
      if (mediaId) {
        if (!media.has(mediaId)) {
          const m = await wpJson(`/media/${mediaId}?_fields=source_url`);
          media.set(mediaId, m?.source_url ?? null);
        }
        url = media.get(mediaId);
      }
    } catch {
      url = null;
    }

    if (!isUrl(url)) {
      if (!DRY) {
        await fetch(`${SUPA}/rest/v1/articles?id=eq.${row.id}`, {
          method: "PATCH",
          headers: { ...supaHeaders, Prefer: "return=minimal" },
          body: JSON.stringify({ featured_image: null }),
        });
      }
      cleared += 1;
      continue;
    }

    if (!DRY) {
      const response = await fetch(`${SUPA}/rest/v1/articles?id=eq.${row.id}`, {
        method: "PATCH",
        headers: { ...supaHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ featured_image: url }),
      });
      if (!response.ok) {
        console.error(`  ✗ ${row.slug}: ${response.status}`);
        continue;
      }
    }
    fixed += 1;
    if (fixed % 25 === 0) process.stdout.write(`\r  fixed ${fixed}/${rows.length}`);
  }

  console.log(`\n  done: ${fixed} images restored, ${cleared} cleared to NULL`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
