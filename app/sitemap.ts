import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPublishedArticles, getPublishedPodcasts } from "@/lib/api/articles";

export const revalidate = 900;

const SITE = "https://www.lawyard.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [articles, podcasts] = await Promise.all([
    getPublishedArticles(supabase, { limit: 5000 }),
    getPublishedPodcasts(supabase, { limit: 500 }),
  ]);

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
