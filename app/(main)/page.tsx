import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { categoryCandidates, getPublishedArticles } from "@/lib/api/articles"
import NewsletterBanner from "@/components/NewsletterBanner"
import LegislationsCarousel from "@/components/LegislationsCarousel"

export const dynamic = "force-dynamic"

const CATEGORY_CARDS = [
  {
    name: "LAWYARD SPOTLIGHT",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
    href: "/category/lawyard-spotlight"
  },
  {
    name: "OPINIONS",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400",
    href: "/category/opinions"
  },
  {
    name: "NEWS",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400",
    href: "/category/news"
  }
]

export default async function HomePage() {
  const supabase = await createClient()

  // The whole front page is driven by the database. The old mock arrays were a
  // replica of the WordPress site — if a section has no rows, it is hidden
  // rather than filled with an article that does not exist.
  const [published, podcastRows] = await Promise.all([
    // Sponsored posts live in the Corporate Posts section, not in the news
    // hierarchy — same rule the insights feed uses.
    getPublishedArticles(supabase, { limit: 60, excludeType: ["corporate_post", "press_release"] }),
    supabase
      .from("podcasts")
      .select("id, title, slug, media_type, featured_image, duration, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => data ?? []),
  ])

  // articles.category is a label array ("Sports Law", "sports-law"), so match on
  // the same candidate spellings the query layer uses.
  const inCategory = (article: { category?: string | null }, slug: string) => {
    const raw = article.category
    const labels: string[] = Array.isArray(raw) ? raw : raw ? [raw] : []
    const candidates = categoryCandidates(slug)
    return labels.some((label) => candidates.includes(label))
  }

  const featured = published[0]
  const gridItems = published.slice(1, 5)

  const spotlightRows = published.filter((a) => inCategory(a, "lawyard-spotlight"))
  const spotlight = (spotlightRows.length >= 4 ? spotlightRows : published.slice(5, 9)).slice(0, 4)

  const sportsRows = published.filter((a) => inCategory(a, "sports-law"))
  const sportsFeatured = sportsRows[0]
  const sportsList = sportsRows.slice(1, 4)

  const usedIds = new Set(
    [featured, ...gridItems, ...spotlight].filter(Boolean).map((a) => a?.id)
  )
  const trending = published.filter((a) => !usedIds.has(a.id)).slice(0, 3)

  const videos = podcastRows
    .filter((p: { media_type?: string }) => p.media_type === "video")
    .slice(0, 6)

  // Placeholder reading time until the article body is measured.
  const readMeta = (_article: { created_at: string }) => "4 MINS READ"

  const sharesLabel = "0 SHARES"

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    }).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-12 animate-in fade-in duration-500">
        
        {/* SECTION 1: Main 2-Column Newspaper Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 border-b border-border/40 pb-16">
          
          {/* Left Column: Featured Article (spans 7 grid tracks) */}
          {featured && (
            <div className="lg:col-span-7 flex flex-col justify-between h-full lg:border-r lg:border-border/40 lg:pr-10">
              <Link href={`/insights/${featured.slug}`} className="group no-underline block">
                <div className="aspect-[16/10.5] w-full overflow-hidden rounded-md bg-muted mb-6">
                  <img 
                    src={featured.featured_image || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800"} 
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                  />
                </div>
                <div className="space-y-4">
                  <span className="text-xs font-bold text-accent uppercase tracking-widest block">
                    {featured.category || "NEWS"}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-serif leading-tight group-hover:text-primary transition-colors mt-2 block">
                    {featured.title}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mt-4">
                    {featured.excerpt || (featured.content ? featured.content.substring(0, 160) + "..." : "")}
                  </p>
                </div>
              </Link>
              
              <div className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase flex flex-col gap-1 mt-6 pt-4 border-t border-border/30">
                <div className="text-foreground/85">BY {featured.author?.[0]?.full_name || "LAWYARD STAFF"}</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>{formatDate(featured.created_at)}</span>
                  <span>•</span>
                  <span>{(featured as any).readTime || "5 MINS READ"}</span>
                  <span>•</span>
                  <span>{(featured as any).sharesCount || "0 SHARES"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Right Column: 2x2 Grid of Secondary Articles (spans 5 grid tracks) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
              {gridItems.map((item) => (
                <div key={item.id} className="flex flex-col justify-between h-full">
                  <Link href={`/insights/${item.slug}`} className="group no-underline block">
                    <div className="aspect-[16/10] w-full overflow-hidden rounded-md bg-muted mb-4">
                      <img 
                        src={item.featured_image || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800"} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-widest block">
                        {item.category || "NEWS"}
                      </span>
                      <h3 className="text-base font-bold tracking-tight text-foreground font-serif leading-snug group-hover:text-primary transition-colors mt-1 line-clamp-3">
                        {item.title}
                      </h3>
                    </div>
                  </Link>
                  
                  <div className="text-[9px] font-bold tracking-wider text-muted-foreground/50 uppercase flex flex-col gap-0.5 mt-4 pt-3 border-t border-border/20">
                    <div className="text-foreground/75">BY {item.author?.[0]?.full_name || "LAWYARD STAFF"}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{formatDate(item.created_at)}</span>
                      <span>•</span>
                      <span>{(item as any).readTime || "4 MINS READ"}</span>
                      <span>•</span>
                      <span>{(item as any).sharesCount || "0 SHARES"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: Category Navigation Panel (Light-blue background) */}
        <div className="w-full bg-[#f0f9ff] dark:bg-zinc-900/10 border-t border-b border-border/20 py-10 px-6 my-16 max-w-7xl mx-auto rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CATEGORY_CARDS.map((card) => (
              <Link 
                key={card.name} 
                href={card.href} 
                className="group relative aspect-[16/8.5] md:aspect-[16/10] overflow-hidden rounded-lg border border-border/40 shadow-sm flex items-center justify-center text-center no-underline hover:scale-[1.005] hover:shadow-md transition-all duration-300"
              >
                <img 
                  src={card.image} 
                  alt={card.name} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-black/45 z-10" />
                <span className="relative z-20 bg-white text-zinc-900 font-extrabold text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-full shadow-md group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {card.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* SECTION 3: LAWYARD SPOTLIGHT (Brackets header & 4-column overlay card grid) */}
        <div className="flex items-center justify-center gap-6 mt-16 mb-6 w-full">
          <div className="h-px bg-border flex-1 hidden sm:block" />
          <div className="flex items-center gap-3 text-xl sm:text-2xl md:text-3xl font-bold tracking-widest font-serif text-foreground shrink-0">
            <span className="text-muted-foreground/35 text-4xl sm:text-5xl font-light leading-none">{'{'}</span>
            <h2 className="leading-none pt-1">LAWYARD SPOTLIGHT</h2>
            <span className="text-muted-foreground/35 text-4xl sm:text-5xl font-light leading-none">{'}'}</span>
          </div>
          <div className="h-px bg-border flex-1 hidden sm:block" />
        </div>

        {/* Small Spotlight tag badge */}
        <div className="flex justify-center mb-16">
          <span className="border border-border/70 px-4 py-1 text-[9px] uppercase tracking-widest font-extrabold text-muted-foreground/85 rounded-sm">
            LAWYARD SPOTLIGHT
          </span>
        </div>

        {/* Spotlight 4-Column Overlay Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {spotlight.map((article: any) => {
            const hasImage = !!article.featured_image

            return (
              <Link
                key={article.id}
                href={`/insights/${article.slug}`}
                className="group relative flex flex-col justify-end aspect-[3/4.2] overflow-hidden rounded-lg bg-card border border-border/40 shadow-sm no-underline hover:scale-[1.005] hover:shadow-md transition-all duration-300"
              >
                {hasImage ? (
                  <>
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-zinc-950 z-10" />
                )}

                <div className="relative z-20 p-5 space-y-3">
                  <span className="text-[9px] font-bold text-accent-foreground/75 uppercase tracking-widest block line-clamp-1">
                    {Array.isArray(article.category) ? article.category[0] : article.category ?? "LAWYARD"}
                  </span>
                  <h3 className="text-base font-bold tracking-tight text-white font-serif leading-snug group-hover:text-accent transition-colors line-clamp-4">
                    {article.title}
                  </h3>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Spotlight Pagination bar */}
        <div className="flex items-center justify-center gap-2 mt-12 mb-20 text-xs font-bold">
          <button className="w-8 h-8 rounded-full flex items-center justify-center bg-[#a77c5c] text-white transition-colors">
            1
          </button>
          <button className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/40 hover:bg-muted text-foreground transition-colors border border-border/30">
            2
          </button>
          <button className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/40 hover:bg-muted text-foreground transition-colors border border-border/30">
            3
          </button>
          <span className="text-muted-foreground px-1">..</span>
          <button className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/40 hover:bg-muted text-foreground transition-colors border border-border/30">
            29
          </button>
          <button className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/40 hover:bg-muted text-foreground transition-colors border border-border/30" aria-label="Next Page">
            &gt;
          </button>
        </div>

        {/* First Ad Banner block */}
        <div className="w-full max-w-4xl mx-auto bg-[#7f7f7f] text-white rounded-md p-8 sm:p-12 relative overflow-hidden flex flex-col justify-center items-center text-center shadow-inner min-h-[220px] mb-16">
          <div className="absolute top-4 left-6 opacity-85">
            <img 
              src="/logo-white.png" 
              alt="Lawyard Logo" 
              className="h-5 w-auto object-contain"
            />
          </div>

          <h4 className="text-2xl sm:text-4xl font-serif font-bold tracking-wide mb-6">
            Place your Ad here!
          </h4>
          
          <Link
            href="/contact"
            className="bg-white hover:bg-white/90 text-zinc-900 font-extrabold text-xs uppercase tracking-widest px-8 py-3 rounded-full shadow-md transition-all no-underline"
          >
            Contact Us!
          </Link>
        </div>

        {/* SECTION 5: Features & Sports Law — only when there are rows */}
        {sportsFeatured && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-16">
          {/* Left Column: Featured Card */}
          <div className="lg:col-span-8">
            <Link 
              href={`/insights/${sportsFeatured.slug}`} 
              className="group relative w-full aspect-[16/10] sm:aspect-[16/9.5] lg:aspect-[16/9.8] rounded-lg overflow-hidden border border-border/40 shadow-sm flex flex-col justify-center items-center text-center p-6 sm:p-10 no-underline hover:shadow-md transition-all duration-300"
            >
              <img 
                src={sportsFeatured.featured_image ?? ""} 
                alt={sportsFeatured.title} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/60 z-10" />
              
              <div className="relative z-20 space-y-4 max-w-xl">
                <span className="text-[10px] font-bold text-white/75 uppercase tracking-widest block">
                  {Array.isArray(sportsFeatured.category) ? sportsFeatured.category[0] : "SPORTS LAW"}
                </span>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-serif tracking-tight leading-tight group-hover:text-accent transition-colors">
                  {sportsFeatured.title}
                </h3>
                <div className="pt-2">
                  <span className="bg-white hover:bg-white/95 text-zinc-900 font-extrabold text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-full shadow-sm transition-colors inline-block">
                    READ MORE
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Right Column: Stacked list of 3 horizontal items */}
          <div className="lg:col-span-4 flex flex-col gap-6 justify-between">
            {sportsList.map((item: any) => (
              <Link 
                key={item.id} 
                href={`/insights/${item.slug}`} 
                className="group flex gap-4 items-center bg-card border border-border/40 rounded-lg p-3 shadow-sm hover:shadow-md hover:scale-[1.003] transition-all duration-300 no-underline h-full"
              >
                <div className="w-24 h-20 sm:w-28 sm:h-24 md:w-32 md:h-24 lg:w-28 lg:h-22 xl:w-32 xl:h-24 overflow-hidden rounded bg-muted shrink-0">
                  <img 
                    src={item.featured_image ?? ""} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
                  <span className="text-[9px] font-extrabold text-accent uppercase tracking-widest block">
                    {Array.isArray(item.category) ? item.category[0] : "SPORTS LAW"}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground font-serif leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <div className="text-[8px] font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1 mt-0.5 flex-wrap">
                    <span>{formatDate(item.created_at)}</span>
                    <span>•</span>
                    <span>{readMeta(item)}</span>
                    <span>•</span>
                    <span>{sharesLabel}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        )}

        {/* SECTION 6: LAWYARD TV (Brackets header & Video player + list) */}
        <div className="flex items-center justify-center gap-6 mt-20 mb-6 w-full pt-8 border-t border-border/20">
          <div className="h-px bg-border flex-1 hidden sm:block" />
          <div className="flex items-center gap-3 text-xl sm:text-2xl md:text-3xl font-bold tracking-widest font-serif text-foreground shrink-0">
            <span className="text-muted-foreground/35 text-4xl sm:text-5xl font-light leading-none">{'{'}</span>
            <h2 className="leading-none pt-1">LAWYARD TV</h2>
            <span className="text-muted-foreground/35 text-4xl sm:text-5xl font-light leading-none">{'}'}</span>
          </div>
          <div className="h-px bg-border flex-1 hidden sm:block" />
        </div>

        {/* Small TV badge label */}
        <div className="flex justify-center mb-12">
          <span className="border border-border/70 px-4 py-1 text-[9px] uppercase tracking-widest font-extrabold text-muted-foreground/85 rounded-sm">
            LAWYARD TV
          </span>
        </div>

        {/* TV Video player + list grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Left Block: Video Player */}
          <div className="lg:col-span-8">
            <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-black border border-border/40 shadow-sm flex flex-col justify-end">
              {/* Play button overlay */}
              <div className="absolute inset-0 bg-zinc-950/95 flex items-center justify-center group cursor-pointer z-10">
                <div className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-all border border-white/30 transform group-hover:scale-105">
                  <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1.5" />
                </div>
              </div>

              {/* Player control bar mock (matching design) */}
              <div className="relative z-20 bg-black/80 px-4 py-2.5 flex items-center justify-between text-white/95 text-[10px] font-semibold">
                <div className="flex items-center gap-3">
                  {/* Mini play icon */}
                  <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[8px] border-l-white border-b-[4px] border-b-transparent cursor-pointer" />
                  {/* Timeline bar */}
                  <div className="w-32 sm:w-48 md:w-64 h-1 bg-white/30 rounded relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-0 h-full bg-accent" />
                  </div>
                  <span>00:00</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Volume Icon */}
                  <div className="cursor-pointer">🔊</div>
                  {/* Settings / Fullscreen */}
                  <span className="cursor-pointer opacity-75 hover:opacity-100">⚙️</span>
                  <span className="cursor-pointer opacity-75 hover:opacity-100">⛶</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Block: Video List */}
          <div className="lg:col-span-4 flex flex-col gap-4 max-h-[380px] overflow-y-auto pr-2">
            {videos.map((video: any, idx: number) => (
              <Link 
                key={video.id} 
                href={`/tv/${video.slug}`}
                className="group flex gap-3.5 items-center hover:bg-muted/30 p-2 rounded-md transition-colors no-underline cursor-pointer border border-border/10"
              >
                {/* Left Thumbnail with small play badge */}
                <div className="w-20 h-14 sm:w-24 sm:h-16 rounded bg-zinc-900 shrink-0 relative overflow-hidden flex items-center justify-center">
                  <img src={video.featured_image ?? "/logo-white.png"} alt={video.title} className="absolute inset-0 w-full h-full object-cover opacity-75" />
                  {idx === 0 ? (
                    <div className="absolute inset-0 bg-[#12102b]/80 flex flex-col items-center justify-center text-[7px] font-extrabold uppercase tracking-widest text-white text-center p-0.5">
                      <span>NOW</span>
                      <span>PLAYING</span>
                    </div>
                  ) : (
                    <div className="relative z-10 w-6 h-6 rounded-full bg-black/45 border border-white/20 flex items-center justify-center text-white/95 text-[7px]">
                      ▶
                    </div>
                  )}
                </div>

                {/* Right Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-foreground font-serif leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {video.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Second Ad Banner block */}
        <div className="w-full max-w-4xl mx-auto bg-[#7f7f7f] text-white rounded-md p-8 sm:p-12 relative overflow-hidden flex flex-col justify-center items-center text-center shadow-inner min-h-[220px] mb-16">
          <div className="absolute top-4 left-6 opacity-85">
            <img 
              src="/logo-white.png" 
              alt="Lawyard Logo" 
              className="h-5 w-auto object-contain"
            />
          </div>

          <h4 className="text-2xl sm:text-4xl font-serif font-bold tracking-wide mb-6">
            Place your Ad here!
          </h4>
          
          <Link
            href="/contact"
            className="bg-white hover:bg-white/90 text-zinc-900 font-extrabold text-xs uppercase tracking-widest px-8 py-3 rounded-full shadow-md transition-all no-underline"
          >
            Contact Us!
          </Link>
        </div>

        {/* SECTION 7: TRENDING NEWS (Brackets header & 3-column cards grid) */}
        <div className="flex items-center justify-center gap-6 mt-16 mb-6 w-full pt-8 border-t border-border/20">
          <div className="h-px bg-border flex-1 hidden sm:block" />
          <div className="flex items-center gap-3 text-xl sm:text-2xl md:text-3xl font-bold tracking-widest font-serif text-foreground shrink-0">
            <span className="text-muted-foreground/35 text-4xl sm:text-5xl font-light leading-none">{'{'}</span>
            <h2 className="leading-none pt-1">TRENDING NEWS</h2>
            <span className="text-muted-foreground/35 text-4xl sm:text-5xl font-light leading-none">{'}'}</span>
          </div>
          <div className="h-px bg-border flex-1 hidden sm:block" />
        </div>

        {/* Small Trending tag badge */}
        <div className="flex justify-center mb-16">
          <span className="border border-border/70 px-4 py-1 text-[9px] uppercase tracking-widest font-extrabold text-muted-foreground/85 rounded-sm">
            TRENDING NEWS
          </span>
        </div>

        {/* Trending 3-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {trending.map((item) => (
            <div key={item.id} className="flex flex-col justify-between h-full">
              <Link href={`/insights/${item.slug}`} className="group no-underline block">
                <div className="aspect-[16/10] w-full overflow-hidden rounded-md bg-muted mb-4">
                  <img 
                    src={item.featured_image ?? ""} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest block">
                    {Array.isArray(item.category) ? item.category[0] : item.category ?? "NEWS"}
                  </span>
                  <h3 className="text-base font-bold tracking-tight text-foreground font-serif leading-snug group-hover:text-primary transition-colors mt-1 line-clamp-3">
                    {item.title}
                  </h3>
                </div>
              </Link>
              
              <div className="text-[9px] font-bold tracking-wider text-muted-foreground/50 uppercase flex flex-col gap-0.5 mt-4 pt-3 border-t border-border/20">
                <div className="text-foreground/75">BY {(item as any).author?.[0]?.full_name ?? "LAWYARD STAFF"}</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>{formatDate(item.created_at)}</span>
                  <span>•</span>
                  <span>{readMeta(item)}</span>
                  <span>•</span>
                  <span>{sharesLabel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SECTION 8: BRACKET DIVIDER: { LEGISLATIONS } */}
        <div className="flex items-center justify-center gap-6 mt-20 mb-12 w-full pt-8 border-t border-border/20">
          <div className="h-px bg-border flex-1 hidden sm:block" />
          <div className="flex items-center gap-3 text-xl sm:text-2xl font-bold tracking-widest font-serif text-foreground shrink-0">
            <span className="text-muted-foreground/35 text-4xl font-light leading-none">{'{'}</span>
            <h2 className="leading-none pt-1">LEGISLATIONS</h2>
            <span className="text-muted-foreground/35 text-4xl font-light leading-none">{'}'}</span>
          </div>
          <div className="h-px bg-border flex-1 hidden sm:block" />
        </div>

        {/* Legislations Carousel with Fading Transition */}
        <div className="mb-20">
          <LegislationsCarousel />
        </div>

        {/* SECTION 9: Newsletter subscription banner */}
        <NewsletterBanner />

      </div>
    </div>
  )
}
