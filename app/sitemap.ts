import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

/**
 * Sitemap for the directory.
 *
 * The public news site lives on WordPress; this application is the marketplace,
 * so the sitemap lists what is actually served here: the static directory pages,
 * published lawyer profiles, law-firm pages and corporate posts.
 *
 * Rebuilt hourly. The anon client is used deliberately — the cookie-based server
 * client cannot run during static generation.
 */
export const revalidate = 3600;

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://directory.lawyard.org").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    { auth: { persistSession: false } }
  );

  // PostgREST returns at most 1,000 rows per request, so page through.
  const lawyers: { id: string; updated_at: string | null }[] = [];
  for (let from = 0; from < 20_000; from += 1000) {
    const { data } = await supabase
      .from("lawyers")
      .select("id, updated_at")
      .eq("verification_status", "verified")
      .range(from, from + 999);
    if (!data?.length) break;
    lawyers.push(...data);
    if (data.length < 1000) break;
  }

  const chambers: { id: string; created_at: string | null }[] = [];
  for (let from = 0; from < 5_000; from += 1000) {
    const { data } = await supabase
      .from("chambers")
      .select("id, created_at")
      .not("published_at", "is", null)
      .range(from, from + 999);
    if (!data?.length) break;
    chambers.push(...data);
    if (data.length < 1000) break;
  }

  const corporatePosts: { slug: string; created_at: string | null }[] = [];
  for (let from = 0; from < 5_000; from += 1000) {
    const { data } = await supabase
      .from("articles")
      .select("slug, created_at")
      .eq("status", "published")
      .eq("article_type", "corporate_post")
      .range(from, from + 999);
    if (!data?.length) break;
    corporatePosts.push(...data);
    if (data.length < 1000) break;
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/search`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/pricing`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/corporate-posts`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE}/help`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const lawyerRoutes: MetadataRoute.Sitemap = lawyers.map((row) => ({
    url: `${SITE}/lawyer/${row.id}`,
    lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const chamberRoutes: MetadataRoute.Sitemap = chambers.map((row) => ({
    url: `${SITE}/chamber/${row.id}`,
    lastModified: row.created_at ? new Date(row.created_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const postRoutes: MetadataRoute.Sitemap = corporatePosts.map((row) => ({
    url: `${SITE}/corporate-posts/${row.slug}`,
    lastModified: row.created_at ? new Date(row.created_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...lawyerRoutes, ...chamberRoutes, ...postRoutes];
}
