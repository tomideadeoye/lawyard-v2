import { createClient } from "@supabase/supabase-js";

/**
 * One-way sync: WordPress → `articles`.
 *
 * WordPress remains the editorial source until the domain cutover, so the site
 * runs this on a schedule instead of waiting for someone to re-run a script.
 * It is additive and idempotent — only slugs that are missing are inserted, so a
 * post edited in WordPress after import is not silently overwritten.
 */

const WP = (process.env.WP_API_URL || "https://www.lawyard.org/wp-json/wp/v2").replace(/\/$/, "");
const WP_AUTH = `Basic ${Buffer.from(`${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString("base64")}`;

export interface SyncResult {
  fetched: number;
  inserted: number;
  skipped: number;
  failed: number;
  newest: string | null;
}

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

const isUrl = (value: unknown): value is string =>
  typeof value === "string" && /^https?:\/\//i.test(value);

async function wpJson<T>(pathname: string): Promise<T> {
  const response = await fetch(`${WP}${pathname}`, {
    headers: { Authorization: WP_AUTH, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`WordPress ${pathname}: ${response.status}`);
  return (await response.json()) as T;
}

export async function syncWordPress(options: { since?: string; limit?: number } = {}): Promise<SyncResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase credentials are not configured");

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const limit = options.limit ?? 200;

  // Default window: everything newer than the newest row we already hold.
  let since = options.since;
  if (!since) {
    const { data } = await supabase
      .from("articles")
      .select("created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1);
    const newest = data?.[0]?.created_at as string | undefined;
    since = newest ? new Date(new Date(newest).getTime() - 60 * 60 * 1000).toISOString() : "2026-06-12T00:00:00";
  }

  const posts = await wpJson<
    Array<{
      id: number;
      slug: string;
      date: string;
      title: { rendered: string };
      excerpt: { rendered: string };
      content: { rendered: string };
      categories: number[];
      featured_media: number;
    }>
  >(
    `/posts?per_page=${Math.min(limit, 100)}&page=1&status=publish&after=${since}&orderby=date&order=asc` +
      `&_fields=id,slug,date,title,excerpt,content,categories,featured_media`
  );

  if (!posts.length) {
    return { fetched: 0, inserted: 0, skipped: 0, failed: 0, newest: null };
  }

  const categories = new Map<number, string>();
  const categoryRows = await wpJson<Array<{ id: number; name: string }>>(`/categories?per_page=100&_fields=id,name`);
  for (const row of categoryRows) categories.set(row.id, row.name);

  const media = new Map<number, string | null>();
  const mediaIds = [...new Set(posts.map((p) => p.featured_media).filter(Boolean))];
  for (let i = 0; i < mediaIds.length; i += 100) {
    const chunk = mediaIds.slice(i, i + 100);
    const rows = await wpJson<Array<{ id: number; source_url?: string }>>(
      `/media?include=${chunk.join(",")}&per_page=100&_fields=id,source_url`
    );
    for (const row of rows) media.set(row.id, isUrl(row.source_url) ? row.source_url : null);
  }

  const { data: authorRow } = await supabase
    .from("articles")
    .select("author_id")
    .not("author_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(1);
  const authorId = authorRow?.[0]?.author_id ?? null;

  const slugs = posts.map((p) => p.slug);
  const { data: existingRows } = await supabase.from("articles").select("slug").in("slug", slugs);
  const existing = new Set((existingRows ?? []).map((r) => r.slug));

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const post of posts) {
    if (existing.has(post.slug)) {
      skipped += 1;
      continue;
    }

    const labels = (post.categories ?? []).map((id) => categories.get(id)).filter(Boolean) as string[];
    const cover = media.get(post.featured_media) ?? null;

    const { error } = await supabase.from("articles").insert({
      title: stripHtml(post.title?.rendered),
      slug: post.slug,
      content: post.content?.rendered ?? "",
      excerpt: stripHtml(post.excerpt?.rendered ?? "").slice(0, 400) || null,
      featured_image: cover,
      author_id: authorId,
      status: "published",
      article_type: "editorial",
      category: labels.length ? labels : ["News"],
      created_at: post.date,
      updated_at: post.date,
    });

    if (error) {
      // 23505 = the slug already exists under a percent-encoded variant.
      if (error.code === "23505") skipped += 1;
      else failed += 1;
      continue;
    }
    inserted += 1;
  }

  return {
    fetched: posts.length,
    inserted,
    skipped,
    failed,
    newest: posts[posts.length - 1]?.date ?? null,
  };
}
