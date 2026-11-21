#!/usr/bin/env node
/**
 * import-wordpress.mjs — manual WordPress → articles sync.
 *
 * The production site does this on a schedule (see app/api/sync/wordpress and
 * the cron entry in vercel.json). This script runs the same code from a laptop:
 * useful for a one-off backfill or to catch up after a window where the cron
 * did not run.
 *
 *   node scripts/import-wordpress.mjs                 # since the newest row
 *   node scripts/import-wordpress.mjs --since 2026-06-12
 */
import fs from "node:fs";
import path from "node:path";

const envFile = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
  }
}

const args = process.argv.slice(2);
const sinceIndex = args.indexOf("--since");
const since = sinceIndex !== -1 ? args[sinceIndex + 1] : undefined;

const { syncWordPress } = await import("../lib/wordpress-sync.ts");

const result = await syncWordPress({ since, limit: 500 });
console.log(
  `fetched ${result.fetched} · inserted ${result.inserted} · already present ${result.skipped} · failed ${result.failed}` +
    (result.newest ? ` · newest ${result.newest}` : "")
);
