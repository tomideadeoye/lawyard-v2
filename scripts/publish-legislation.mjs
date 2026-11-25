#!/usr/bin/env node
/**
 * publish-legislation.mjs — attach a PDF to a catalogue entry.
 *
 * Until a legislation has a file it is listed as "Coming soon" and cannot be
 * bought, so this is the step that opens a product for sale.
 *
 *   node scripts/publish-legislation.mjs --slug companies-and-allied-matters-act --file ./acts/cama.pdf
 *   node scripts/publish-legislation.mjs --list            # what is still missing a file
 *   node scripts/publish-legislation.mjs --slug <slug> --remove
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const envFile = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1] ?? true;
};

async function listMissing() {
  const { data, error } = await supabase
    .from("legislations")
    .select("slug, title, file_path")
    .order("title");
  if (error) throw error;
  const missing = data.filter((row) => !row.file_path);
  console.log(`${data.length} in the catalogue · ${missing.length} without a file`);
  for (const row of missing.slice(0, 20)) console.log(`  ${row.slug}`);
  if (missing.length > 20) console.log(`  … ${missing.length - 20} more`);
}

async function publish(slug, file, pageCount) {
  if (!fs.existsSync(file)) throw new Error(`no such file: ${file}`);
  const remote = `${slug}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("legislations")
    .upload(remote, fs.readFileSync(file), { contentType: "application/pdf", upsert: true });
  if (uploadError) throw uploadError;

  const { error } = await supabase
    .from("legislations")
    .update({ file_path: remote, page_count: pageCount ?? null, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (error) throw error;

  console.log(`published ${slug} → ${remote}`);
}

async function unpublish(slug) {
  const { data } = await supabase.from("legislations").select("file_path").eq("slug", slug).maybeSingle();
  if (data?.file_path) {
    await supabase.storage.from("legislations").remove([data.file_path]);
  }
  const { error } = await supabase
    .from("legislations")
    .update({ file_path: null, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (error) throw error;
  console.log(`unpublished ${slug} — it is no longer purchasable`);
}

const run = async () => {
  if (args.includes("--list")) return listMissing();
  const slug = flag("--slug");
  if (!slug || slug === true) throw new Error("--slug is required");
  if (args.includes("--remove")) return unpublish(String(slug));
  const file = flag("--file");
  if (!file || file === true) throw new Error("--file is required");
  return publish(String(slug), String(file), flag("--pages"));
};

run().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
