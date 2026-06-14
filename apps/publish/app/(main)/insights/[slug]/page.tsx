import { createClient } from '@/lib/supabase/server'
import { getArticleBySlug, formatDate } from '@/lib/api/articles'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MOCK_ARTICLES_DATA } from '../mockArticles'
import LegislationCarousel from '@/components/LegislationCarousel'
import ShareBar from '@/components/ShareBar'
import ArticleComments from '@/components/ArticleComments'
import SidebarLegislations from '@/components/SidebarLegislations'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const article = await getArticleBySlug(supabase, slug)
  
  const title = article?.title ?? MOCK_ARTICLES_DATA[slug]?.title ?? "Article"
  const description = article?.excerpt ?? MOCK_ARTICLES_DATA[slug]?.excerpt ?? "Lawyard article"
  
  return {
    title: `${title} | Lawyard`,
    description,
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // 1. Fetch from database or fall back to mock data
  const article = await getArticleBySlug(supabase, slug)
  
  let articleData = null
  if (article) {
    articleData = {
      id: article.id,
      title: article.title,
      slug: article.slug,
      category: article.category ?? 'NEWS',
      created_at: article.created_at,
      featured_image: article.featured_image,
      content: article.content ?? "",
      authorName: article.author?.[0]?.full_name ?? 'Lawyard Staff',
      authorAvatar: article.author?.[0]?.avatar_url ?? 'https://secure.gravatar.com/avatar/a50d8af14e795e21996e5741d6fb78233d844f94dd598c55e69803a56c3f1d60?s=80',
      readTime: '3 MINS READ',
      sharesCount: '0 SHARES',
    }
  } else {
    const mock = MOCK_ARTICLES_DATA[slug]
    if (!mock) notFound()
    articleData = {
      id: mock.id,
      title: mock.title,
      slug: mock.slug,
      category: mock.category,
      created_at: mock.created_at,
      featured_image: mock.featured_image,
      content: mock.content,
      authorName: mock.authorName,
      authorAvatar: mock.authorAvatar,
      readTime: mock.readTime,
      sharesCount: mock.sharesCount,
    }
  }

  // 2. Navigation logic for next / prev articles
  const mockKeys = Object.keys(MOCK_ARTICLES_DATA)
  const currentIndex = mockKeys.indexOf(slug)
  let prevSlug = ""
  let nextSlug = ""
  if (currentIndex !== -1) {
    prevSlug = mockKeys[(currentIndex - 1 + mockKeys.length) % mockKeys.length] || ""
    nextSlug = mockKeys[(currentIndex + 1) % mockKeys.length] || ""
  } else {
    prevSlug = mockKeys[mockKeys.length - 1] || ""
    nextSlug = mockKeys[0] || ""
  }

  const prevArticle = MOCK_ARTICLES_DATA[prevSlug]
  const nextArticle = MOCK_ARTICLES_DATA[nextSlug]

  // 3. Sidebar data
  const recentArticles = Object.values(MOCK_ARTICLES_DATA)
    .filter(a => a.slug !== slug)
    .slice(0, 5)

  return (
    <div className="w-full min-h-screen bg-background text-foreground pb-24 relative">
      {/* Edge navigation floating bars */}
      <Link 
        href={`/insights/${prevSlug}`}
        className="fixed left-0 top-[45%] z-40 hidden xl:flex items-center gap-2.5 px-2 py-6 bg-background/90 backdrop-blur-sm border-y border-r border-border hover:bg-muted text-muted-foreground hover:text-foreground shadow-sm transition-all group no-underline [writing-mode:vertical-lr] rotate-180 select-none"
      >
        <span className="text-[9px] font-extrabold uppercase tracking-widest">Previous Article</span>
        <span className="text-xs transition-transform group-hover:translate-y-1 -rotate-90">→</span>
      </Link>

      <Link 
        href={`/insights/${nextSlug}`}
        className="fixed right-0 top-[45%] z-40 hidden xl:flex items-center gap-2.5 px-2 py-6 bg-background/90 backdrop-blur-sm border-y border-l border-border hover:bg-muted text-muted-foreground hover:text-foreground shadow-sm transition-all group no-underline [writing-mode:vertical-lr] select-none"
      >
        <span className="text-[9px] font-extrabold uppercase tracking-widest">Next Article</span>
        <span className="text-xs transition-transform group-hover:translate-y-1 rotate-90">→</span>
      </Link>

      {/* Top Shop Legislation Carousel */}
      <LegislationCarousel />

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Article Body (spans 8 tracks) */}
          <article className="lg:col-span-8 space-y-6">
            
            {/* Categories */}
            <div className="text-[10px] font-black uppercase tracking-widest text-[#a77c5c]">
              {articleData.category}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-black font-serif leading-tight tracking-tight text-foreground">
              {articleData.title}
            </h1>

            {/* Meta details */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border/10 py-4 my-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-3">
                <img 
                  src={articleData.authorAvatar} 
                  alt={articleData.authorName} 
                  className="w-8 h-8 rounded-full object-cover border border-border select-none" 
                />
                <div>
                  <span className="text-foreground block">{articleData.authorName}</span>
                  <span className="text-muted-foreground/60 text-[9px] font-semibold leading-none">Author</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <time>{new Date(articleData.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</time>
                <span>{articleData.readTime}</span>
              </div>
            </div>

            {/* Social Share Bar */}
            <ShareBar count={articleData.sharesCount} />

            {/* Featured Image */}
            {articleData.featured_image && (
              <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-muted border border-border/20 shadow-sm relative select-none">
                <img
                  src={articleData.featured_image}
                  alt={articleData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Main Rich Text Content */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none font-serif leading-relaxed text-foreground/90 py-6 border-b border-border/10"
              dangerouslySetInnerHTML={{ __html: articleData.content }}
            />

            {/* Read Next Navigation boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
              {prevArticle && (
                <Link 
                  href={`/insights/${prevArticle.slug}`} 
                  className="group p-4 rounded-lg border border-border/40 hover:border-foreground/30 bg-muted/5 flex items-start gap-4 no-underline transition-all duration-300"
                >
                  <img 
                    src={prevArticle.featured_image} 
                    alt={prevArticle.title} 
                    className="w-16 h-16 object-cover rounded bg-muted group-hover:scale-102 transition-transform shrink-0 border border-border/40" 
                  />
                  <div className="space-y-1 min-w-0">
                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">« Previous Post</span>
                    <h4 className="font-serif font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {prevArticle.title}
                    </h4>
                  </div>
                </Link>
              )}
              {nextArticle && (
                <Link 
                  href={`/insights/${nextArticle.slug}`} 
                  className="group p-4 rounded-lg border border-border/40 hover:border-foreground/30 bg-muted/5 flex items-start gap-4 no-underline transition-all duration-300"
                >
                  <img 
                    src={nextArticle.featured_image} 
                    alt={nextArticle.title} 
                    className="w-16 h-16 object-cover rounded bg-muted group-hover:scale-102 transition-transform shrink-0 border border-border/40" 
                  />
                  <div className="space-y-1 min-w-0">
                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">Next Post »</span>
                    <h4 className="font-serif font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {nextArticle.title}
                    </h4>
                  </div>
                </Link>
              )}
            </div>

            {/* Article Comments */}
            <ArticleComments articleSlug={articleData.slug} />

          </article>

          {/* Right Column: Sidebar (spans 4 tracks) */}
          <aside className="lg:col-span-4 space-y-10 lg:pl-4 lg:sticky lg:top-24">
            
            {/* Search Input Widget */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/20 pb-2">
                Search
              </h3>
              <form action="/search" method="GET" className="relative border-b border-foreground py-2 focus-within:border-primary transition-colors">
                <input 
                  type="text" 
                  name="q" 
                  placeholder="TYPE HERE TO SEARCH" 
                  className="w-full bg-transparent text-xs font-bold uppercase tracking-wider placeholder-muted-foreground/50 border-none outline-none focus:ring-0 text-foreground"
                />
              </form>
            </div>

            {/* Recent Articles List */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/80 border-b-2 border-foreground/30 pb-2.5">
                Recent Articles
              </h3>
              <div className="divide-y divide-border/10">
                {recentArticles.map((art) => (
                  <Link key={art.slug} href={`/insights/${art.slug}`} className="block py-4 group no-underline">
                    <h4 className="font-serif font-bold text-xs text-foreground group-hover:text-[#a77c5c] leading-snug transition-colors">
                      {art.title}
                    </h4>
                    <span className="text-[8.5px] text-muted-foreground/60 font-bold uppercase tracking-wider block mt-2">
                      {new Date(art.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Shop Legislations Widget */}
            <SidebarLegislations />

          </aside>

        </div>
      </div>
    </div>
  )
}
