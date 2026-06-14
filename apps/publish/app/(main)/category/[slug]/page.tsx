import { createClient } from "@/lib/supabase/server"
import { getPublishedArticles } from "@/lib/api/articles"
import { notFound } from "next/navigation"
import Link from "next/link"
import NewsletterBanner from "@/components/NewsletterBanner"

export const dynamic = "force-dynamic"

const SPOTLIGHT_MOCK_ARTICLES = [
  {
    id: "spotlight-1",
    title: "African Development Bank approves USD 125 million investment to expand risk insurance capacity",
    slug: "african-development-bank-approves-usd-125-million-investment-to-expand-risk-insurance-capacity",
    featured_image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600",
    category: "BLOG, LAWYARD SPOTLIGHT, NEWS",
    created_at: "2026-06-12T20:00:00.000Z"
  },
  {
    id: "spotlight-2",
    title: "MTN targets Nigeria's lending market as it seeks fintech licences",
    slug: "mtn-targets-nigerias-lending-market-as-it-seeks-fintech-licences",
    featured_image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=600",
    category: "BLOG, LAWYARD SPOTLIGHT, NEWS",
    created_at: "2026-06-12T20:00:00.000Z"
  },
  {
    id: "spotlight-3",
    title: "Texas Governor Recommends Sweeping Data Center Regulation",
    slug: "texas-governor-recommends-sweeping-data-center-regulation",
    featured_image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=600",
    category: "LAWYARD SPOTLIGHT, NEWS",
    created_at: "2026-06-12T20:00:00.000Z"
  },
  {
    id: "spotlight-4",
    title: "Call for Feedback on the Final DRAFT GUIDELINES FOR LEGAL PRACTITIONERS/LAWYERS PROVIDING PROFESSIONAL SERVICES IN THE CAPITAL MARKET in Ghana",
    slug: "call-for-feedback-on-the-final-draft-guidelines-for-legal-practitioners-lawyers-providing-professional-services-in-the-capital-market-in-ghana",
    featured_image: null,
    category: "LAWYARD SPOTLIGHT",
    created_at: "2026-06-12T20:00:00.000Z"
  }
]

const SPORTS_LAW_FEATURES = {
  featured: {
    title: "Unsafe Grounds: What Nigeria Must Learn to Promote Stadium Safety by Ayomide Eribake",
    category: "FEATURES, OPINIONS, SPORTS LAW",
    slug: "unsafe-grounds-what-nigeria-must-learn-to-promote-stadium-safety-by-ayomide-eribake",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800"
  },
  list: [
    {
      id: "sl-1",
      title: "CJN Approves 2025 National Judiciary Games in Uyo as Over 10,000 Athletes Set to Compete",
      category: "SPORTS LAW",
      date: "OCTOBER 30, 2025",
      readTime: "1 MIN READ",
      shares: "0 SHARES",
      image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=200",
      slug: "cjn-approves-2025-national-judiciary-games-in-uyo-as-over-10000-athletes-set-to-compete"
    },
    {
      id: "sl-2",
      title: "Football Evolution: Assessing the Creation of Salary Caps by Eribake Ayomide & Al-Ameen Sulyman.",
      category: "SPORTS LAW",
      date: "JULY 29, 2020",
      readTime: "5 MINS READ",
      shares: "2 SHARES",
      image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=200",
      slug: "football-evolution-assessing-the-creation-of-salary-caps-by-eribake-ayomide-al-ameen-sulyman"
    },
    {
      id: "sl-3",
      title: "The Need for a National Dispute Resolution Chamber in Nigeria",
      category: "SPORTS LAW",
      date: "JUNE 29, 2020",
      readTime: "5 MINS READ",
      shares: "0 SHARES",
      image: "https://images.unsplash.com/photo-1505664194779-8bebcb95c02e?auto=format&fit=crop&q=80&w=200",
      slug: "the-need-for-a-national-dispute-resolution-chamber-in-nigeria"
    }
  ]
}

const LEGISLATIONS_LIST = [
  { id: "l-1", title: "INSTITUTE OF CHARTERED ACCOUNTANTS OF NIGERIA ACT" },
  { id: "l-2", title: "INDUSTRIAL TRAINING FUND ACT" },
  { id: "l-3", title: "INSTITUTE OF CHARTERED CHEMISTS OF NIGERIA ACT" },
  { id: "l-4", title: "INDUSTRIAL INSPECTORATE ACT" },
  { id: "l-5", title: "INDIAN HEMP ACT" }
]

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  let dbArticles: any[] = []

  try {
    dbArticles = await getPublishedArticles(supabase, { category: slug })
  } catch {
    // Fallback if db query fails
  }

  // Combine DB articles and mock fallback articles
  const finalArticles = [...dbArticles]
  
  // Only insert mock articles if they correspond to the requested category or if database is empty
  const isSpotlight = slug === "lawyard-spotlight"
  const fallbacks = isSpotlight ? SPOTLIGHT_MOCK_ARTICLES : []

  for (const mock of fallbacks) {
    if (finalArticles.length >= 4) break
    if (!finalArticles.some(a => a.title.toLowerCase() === mock.title.toLowerCase())) {
      finalArticles.push({
        id: mock.id,
        title: mock.title,
        slug: mock.slug,
        featured_image: mock.featured_image,
        category: mock.category,
        created_at: mock.created_at,
        author: [{ full_name: "Lawyard Staff" }]
      } as any)
    }
  }

  if (finalArticles.length === 0) {
    notFound()
  }

  const categoryLabel = slug.replace(/-/g, " ").toUpperCase()

  return (
    <div className="min-h-screen bg-background text-foreground relative pb-32">
      {/* Category Header with large curly brackets & divider lines */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-6">
        <div className="flex items-center justify-center gap-6 my-4 w-full">
          <div className="h-px bg-border flex-1 hidden sm:block" />
          <div className="flex items-center gap-3 text-xl sm:text-2xl md:text-3xl font-bold tracking-widest font-serif text-foreground shrink-0">
            <span className="text-muted-foreground/35 text-4xl sm:text-5xl font-light leading-none">{'{'}</span>
            <h1 className="leading-none pt-1">{categoryLabel}</h1>
            <span className="text-muted-foreground/35 text-4xl sm:text-5xl font-light leading-none">{'}'}</span>
          </div>
          <div className="h-px bg-border flex-1 hidden sm:block" />
        </div>

        {/* Small repeating category tag underneath */}
        <div className="flex justify-center mb-16">
          <span className="border border-border/70 px-4 py-1 text-[9px] uppercase tracking-widest font-extrabold text-muted-foreground/85 rounded-sm">
            {categoryLabel}
          </span>
        </div>

        {/* 4-Column Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {finalArticles.map((article) => {
            const hasImage = !!article.featured_image

            return (
              <Link
                key={article.id}
                href={`/insights/${article.slug}`}
                className="group relative flex flex-col justify-end aspect-[3/4.2] overflow-hidden rounded-lg bg-card border border-border/40 shadow-sm no-underline hover:scale-[1.005] hover:shadow-md transition-all duration-300"
              >
                {/* Image background */}
                {hasImage ? (
                  <>
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    />
                    {/* Dark overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10" />
                  </>
                ) : (
                  // Plain dark background if no image exists (matching the 4th card in the design)
                  <div className="absolute inset-0 bg-zinc-950 z-10" />
                )}

                {/* Article Info (Z-index 20 to sit on top of overlays) */}
                <div className="relative z-20 p-5 space-y-3">
                  <span className="text-[9px] font-bold text-accent-foreground/75 uppercase tracking-widest block line-clamp-1">
                    {article.category || categoryLabel}
                  </span>
                  <h3 className="text-base font-bold tracking-tight text-white font-serif leading-snug group-hover:text-accent transition-colors line-clamp-4">
                    {article.title}
                  </h3>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Pagination bar */}
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

        {/* Ad Banner block */}
        <div className="w-full max-w-4xl mx-auto bg-[#7f7f7f] text-white rounded-md p-8 sm:p-12 relative overflow-hidden flex flex-col justify-center items-center text-center shadow-inner min-h-[220px] mb-16">
          {/* Logo on top-left */}
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

        {/* NEXT SECTION AFTER ADS: Features & Sports Law */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-16 pt-8 border-t border-border/20">
          {/* Left Column: Featured Card */}
          <div className="lg:col-span-8">
            <Link 
              href={`/insights/${SPORTS_LAW_FEATURES.featured.slug}`} 
              className="group relative w-full aspect-[16/10] sm:aspect-[16/9.5] lg:aspect-[16/9.8] rounded-lg overflow-hidden border border-border/40 shadow-sm flex flex-col justify-center items-center text-center p-6 sm:p-10 no-underline hover:shadow-md transition-all duration-300"
            >
              <img 
                src={SPORTS_LAW_FEATURES.featured.image} 
                alt={SPORTS_LAW_FEATURES.featured.title} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/60 z-10" />
              
              <div className="relative z-20 space-y-4 max-w-xl">
                <span className="text-[10px] font-bold text-white/75 uppercase tracking-widest block">
                  {SPORTS_LAW_FEATURES.featured.category}
                </span>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-serif tracking-tight leading-tight group-hover:text-accent transition-colors">
                  {SPORTS_LAW_FEATURES.featured.title}
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
            {SPORTS_LAW_FEATURES.list.map((item) => (
              <Link 
                key={item.id} 
                href={`/insights/${item.slug}`} 
                className="group flex gap-4 items-center bg-card border border-border/40 rounded-lg p-3 shadow-sm hover:shadow-md hover:scale-[1.003] transition-all duration-300 no-underline h-full"
              >
                {/* Square Left Thumbnail */}
                <div className="w-24 h-20 sm:w-28 sm:h-24 md:w-32 md:h-24 lg:w-28 lg:h-22 xl:w-32 xl:h-24 overflow-hidden rounded bg-muted shrink-0">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>

                {/* Right Details */}
                <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
                  <span className="text-[9px] font-extrabold text-accent uppercase tracking-widest block">
                    {item.category}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground font-serif leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <div className="text-[8px] font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1 mt-0.5 flex-wrap">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span>{item.readTime}</span>
                    <span>•</span>
                    <span>{item.shares}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* BRACKET DIVIDER: { LEGISLATIONS } */}
        <div className="flex items-center justify-center gap-6 mt-20 mb-12 w-full">
          <div className="h-px bg-border flex-1 hidden sm:block" />
          <div className="flex items-center gap-3 text-xl sm:text-2xl font-bold tracking-widest font-serif text-foreground shrink-0">
            <span className="text-muted-foreground/35 text-4xl font-light leading-none">{'{'}</span>
            <h2 className="leading-none pt-1">LEGISLATIONS</h2>
            <span className="text-muted-foreground/35 text-4xl font-light leading-none">{'}'}</span>
          </div>
          <div className="h-px bg-border flex-1 hidden sm:block" />
        </div>

        {/* 5-Column Legislations Card Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {LEGISLATIONS_LIST.map((item) => (
            <Link 
              key={item.id} 
              href={`/shop`} 
              className="bg-[#12102b] text-white border border-white/5 rounded-lg p-5 flex flex-col justify-between items-center text-center aspect-[3/3.8] shadow-sm hover:scale-[1.01] hover:border-white/10 transition-all duration-300 no-underline"
            >
              {/* Logo in the center */}
              <div className="flex flex-col items-center gap-2 text-white/35 my-auto">
                <div className="border border-white/25 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold font-serif leading-none">
                  L
                </div>
                <span className="font-serif font-black tracking-widest text-[9px] leading-none">LAWYARD</span>
              </div>

              {/* Legislation Title at the bottom */}
              <h3 className="text-[9px] sm:text-[10px] font-serif font-bold uppercase tracking-wide leading-tight text-white/90 text-center w-full line-clamp-3 mt-auto pt-4 border-t border-white/5">
                {item.title}
              </h3>
            </Link>
          ))}
        </div>

        {/* Newsletter Banner at the end of category page */}
        <NewsletterBanner />
      </div>

      {/* Floating Vertical Scroll to Top (Positioned absolute or sticky) */}
      <div className="hidden lg:block absolute bottom-24 right-6 translate-x-1/2 rotate-90 origin-left">
        <a 
          href="#"
          className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors py-2 no-underline"
        >
          SCROLL TO TOP
        </a>
      </div>
    </div>
  )
}
