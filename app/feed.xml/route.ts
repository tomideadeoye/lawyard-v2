import { createClient } from '@/lib/supabase/server'
import { getPublishedArticles, getPublishedPodcasts } from '@/lib/api/articles'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const articles = await getPublishedArticles(supabase, { limit: 50 })
  const podcasts = await getPublishedPodcasts(supabase, { limit: 20 })

  const items = [
    ...articles.map(a => ({
      title: a.title,
      slug: a.slug,
      description: a.excerpt || '',
      pubDate: new Date(a.created_at),
      link: `/insights/${a.slug}`,
      category: a.category || 'Article',
    })),
    ...podcasts.map(p => ({
      title: p.title,
      slug: p.slug,
      description: p.description || '',
      pubDate: new Date(p.created_at),
      link: `/podcasts/${p.slug}`,
      category: p.media_type === 'video' ? 'Video' : 'Podcast',
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
   .slice(0, 50)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Lawyard — Nigeria's Legal Media Platform</title>
    <link>https://lawyard.org</link>
    <description>Legal news, opinions, analysis, and podcasts from Nigeria's premier legal media platform.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://lawyard.org/feed.xml" rel="self" type="application/rss+xml"/>
    ${items.map(item => `    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>https://lawyard.org${item.link}</link>
      <guid>https://lawyard.org${item.link}</guid>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      <category>${item.category}</category>
    </item>`).join('\n')}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'max-age=3600',
    },
  })
}
