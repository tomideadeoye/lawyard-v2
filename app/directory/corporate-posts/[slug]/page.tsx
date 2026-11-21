import { createClient } from '@/lib/supabase/server'
import { getPublishedArticles } from '@/lib/api/articles'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ShareBar from '@/components/ShareBar'
import { ArticleCard } from '@/components/ui/article-card'
import { sanitizeRichHtml, stripHtml } from '@/lib/sanitize'
import { coverUrl } from '@/lib/images'
import config from '@/lib/corporate-posts.json'

type PageProps = { params: Promise<{ slug: string }> }

async function getPost(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('article_type', 'corporate_post')
    .eq('status', 'published')
    .single()
  return data
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Corporate Post – Lawyard' }

  const description = post.excerpt
    ? stripHtml(post.excerpt).slice(0, 300)
    : stripHtml(post.content).slice(0, 300)
  const image = coverUrl(post.featured_image)

  return {
    title: `${post.title} – ${post.brand_name ?? 'Corporate Post'}`,
    description,
    alternates: { canonical: `/corporate-posts/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: post.created_at,
      siteName: 'Lawyard',
      images: image ? [{ url: image, alt: post.title }] : undefined,
    },
  }
}

function readMinutes(html: string) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / 200))} MIN READ`
}

export default async function CorporatePostPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const post = await getPost(slug)
  if (!post) notFound()

  // Content is stored as editor HTML. Sanitising on write is the first line of
  // defence; this is the second, and it keeps rows written before the guard
  // existed from rendering a link or image we never allowed.
  const content = sanitizeRichHtml(post.content)
  const cover = coverUrl(post.featured_image)
  const tier = config.tiers.find((t) => t.id === post.tier)
  const date = new Date(post.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const morePosts = await getPublishedArticles(supabase, {
    articleType: 'corporate_post',
    limit: 4,
  })
  const recent = morePosts.filter((a) => a.slug !== post.slug).slice(0, 3)
  const cheapest = config.tiers.reduce((a, b) => (a.price <= b.price ? a : b))

  return (
    <div className="w-full min-h-screen bg-background text-foreground pb-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Reading column */}
          <article className="lg:col-span-8 space-y-6">

            <Link
              href="/corporate-posts"
              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-[#a77c5c] transition-colors no-underline"
            >
              ← Corporate Posts
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#a77c5c]">
                {post.brand_name ?? 'Corporate Post'}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border border-border rounded px-2 py-0.5">
                {tier ? tier.name : 'Corporate Post'}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black font-serif leading-tight tracking-tight text-foreground">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border/10 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span className="text-foreground">
                {post.brand_name ? `A paid announcement from ${post.brand_name}` : 'Paid announcement'}
              </span>
              <div className="flex items-center gap-6">
                <time dateTime={post.created_at}>{date}</time>
                <span>{readMinutes(content)}</span>
              </div>
            </div>

            <ShareBar />

            {cover && (
              <figure className="space-y-2">
                <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-muted border border-border/20 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">
                  {post.brand_name}
                </figcaption>
              </figure>
            )}

            <div
              className="prose prose-lg dark:prose-invert max-w-none leading-relaxed py-6 border-b border-border/10 dropcap"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            <p className="text-xs text-muted-foreground leading-relaxed">
              This is a paid corporate announcement published by {post.brand_name ?? 'the advertiser'}.
              It is not editorial content and does not reflect the views of Lawyard.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/corporate-posts"
                className="text-[10px] font-black uppercase tracking-widest text-foreground border border-border rounded px-4 py-2.5 hover:bg-muted transition-colors no-underline"
              >
                All Corporate Posts
              </Link>
              <Link
                href="/corporate-posts/submit"
                className="text-[10px] font-black uppercase tracking-widest text-[#fffdfa] bg-[#8a6247] rounded px-4 py-2.5 hover:bg-[#8a6247]/90 transition-colors no-underline"
              >
                Publish your announcement
              </Link>
            </div>

            {recent.length > 0 && (
              <section className="pt-10 space-y-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-foreground/80 border-b-2 border-foreground/30 pb-2.5">
                  More Corporate Posts
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {recent.map((a) => (
                    <ArticleCard
                      key={a.id}
                      title={a.title}
                      slug={a.slug}
                      excerpt={a.excerpt}
                      featured_image={a.featured_image}
                      category={a.category}
                      article_type={a.article_type}
                      brand_name={a.brand_name}
                      tier={a.tier}
                      created_at={a.created_at}
                      href={`/corporate-posts/${a.slug}`}
                    />
                  ))}
                </div>
              </section>
            )}

          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-10 lg:pl-4 lg:sticky lg:top-24">

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/20 pb-2">
                Search
              </h3>
              <form action="/search" method="GET" className="relative border-b border-foreground py-2 focus-within:border-[#8a6247] transition-colors">
                <input
                  type="text"
                  name="q"
                  placeholder="TYPE HERE TO SEARCH"
                  className="w-full bg-transparent text-xs font-bold uppercase tracking-wider placeholder-muted-foreground/50 border-none outline-none focus:ring-0 text-foreground"
                />
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/80 border-b-2 border-foreground/30 pb-2.5">
                Recent Corporate Posts
              </h3>
              {recent.length > 0 ? (
                <div className="divide-y divide-border/10">
                  {recent.map((a) => (
                    <Link key={a.id} href={`/corporate-posts/${a.slug}`} className="block py-4 group no-underline">
                      <h4 className="font-serif font-bold text-xs text-foreground group-hover:text-[#a77c5c] leading-snug transition-colors">
                        {a.title}
                      </h4>
                      <span className="text-[8.5px] text-muted-foreground/60 font-bold uppercase tracking-wider block mt-2">
                        {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This is the only corporate post so far. Yours could be next.
                </p>
              )}
            </div>

            <div className="border border-border/40 rounded-xl p-6 space-y-3 bg-muted/5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                Publish an announcement
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reach Lawyard&apos;s legal audience with a corporate post — from{' '}
                <strong className="text-foreground">{cheapest.formatted_price}</strong>.
              </p>
              <Link
                href="/corporate-posts/submit"
                className="inline-block text-[10px] font-black uppercase tracking-widest text-[#fffdfa] bg-[#8a6247] rounded px-4 py-2.5 hover:bg-[#8a6247]/90 transition-colors no-underline"
              >
                Submit a post
              </Link>
            </div>

          </aside>

        </div>
      </div>
    </div>
  )
}
