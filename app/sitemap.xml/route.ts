import { createClient } from '@/lib/supabase/server'
import { getPublishedArticles, getPublishedPodcasts } from '@/lib/api/articles'
import { LEGISLATIONS } from '@/lib/legislations'

export const dynamic = 'force-dynamic'

const STATIC_ROUTES = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/about', priority: '0.8', changefreq: 'monthly' },
  { url: '/insights', priority: '0.9', changefreq: 'daily' },
  { url: '/podcasts', priority: '0.8', changefreq: 'daily' },
  { url: '/tv', priority: '0.7', changefreq: 'daily' },
  { url: '/corporate-posts', priority: '0.6', changefreq: 'weekly' },
  { url: '/corporate-posts/submit', priority: '0.5', changefreq: 'monthly' },
  { url: '/legislations', priority: '0.9', changefreq: 'weekly' },
  { url: '/shop', priority: '0.6', changefreq: 'weekly' },
  { url: '/cart', priority: '0.3', changefreq: 'monthly' },
  { url: '/checkout', priority: '0.3', changefreq: 'monthly' },
  { url: '/contact', priority: '0.5', changefreq: 'monthly' },
]

export async function GET() {
  const supabase = await createClient()

  const articles = await getPublishedArticles(supabase, { limit: 1000 })
  const podcasts = await getPublishedPodcasts(supabase, { limit: 1000 })

  const urls = [
    ...STATIC_ROUTES.map(
      (r) => `<url>
    <loc>https://lawyard.org${r.url}</loc>
    <priority>${r.priority}</priority>
    <changefreq>${r.changefreq}</changefreq>
  </url>`,
    ),
    ...articles.map(
      (a) => `<url>
    <loc>https://lawyard.org/insights/${a.slug}</loc>
    <lastmod>${new Date(a.created_at).toISOString()}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>`,
    ),
    ...podcasts.map(
      (p) => `<url>
    <loc>https://lawyard.org/podcasts/${p.slug}</loc>
    <lastmod>${new Date(p.created_at).toISOString()}</lastmod>
    <priority>0.6</priority>
    <changefreq>monthly</changefreq>
  </url>`,
    ),
    ...LEGISLATIONS.map(
      (l) => `<url>
    <loc>https://lawyard.org/legislations/${l.slug}</loc>
    <priority>0.5</priority>
    <changefreq>monthly</changefreq>
  </url>`,
    ),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
