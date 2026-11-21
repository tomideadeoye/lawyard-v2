import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

// Rebuilt hourly. The anon client (no cookies) is safe during static generation,
// unlike the cookie-based server client, and 11k URLs is too expensive to
// regenerate on every crawler hit.
export const revalidate = 3600;

const SITE = "https://www.lawyard.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    { auth: { persistSession: false } }
  );

  // PostgREST caps a single response at 1,000 rows, so page through — a sitemap
  // that stops at the first 1,000 articles hides 90% of the archive.
  async function page(table: "articles" | "podcasts", total: number) {
    const rows: { slug: string; created_at: string }[] = [];
    for (let from = 0; from < total; from += 1000) {
      const { data } = await supabase
        .from(table)
        .select("slug, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .range(from, from + 999);
      if (!data?.length) break;
      rows.push(...data);
      if (data.length < 1000) break;
    }
    return rows;
  }

  const [articles, podcasts] = await Promise.all([page("articles", 50_000), page("podcasts", 2_000)]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE}/insights`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/podcasts`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE}/tv`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE}/legislations`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/contact`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE}/insights/${article.slug}`,
    lastModified: article.created_at ? new Date(article.created_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const podcastRoutes: MetadataRoute.Sitemap = podcasts.map((podcast) => ({
    url: `${SITE}/podcasts/${podcast.slug}`,
    lastModified: podcast.created_at ? new Date(podcast.created_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...articleRoutes, ...podcastRoutes];
}
