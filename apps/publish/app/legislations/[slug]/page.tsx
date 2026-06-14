import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLegislationBySlug, LEGISLATIONS } from '@/lib/legislations'
import AddToCartButton from './AddToCartButton'

export async function generateStaticParams() {
  return LEGISLATIONS.map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const act = getLegislationBySlug(slug)
  if (!act) return { title: 'Not Found – Lawyard' }
  return {
    title: `${act.title} – Lawyard Legislations`,
    description: `Purchase and download the ${act.title} — Nigerian legislation PDF.`,
  }
}

function GavelIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m14 13-5 5M16 11l-3 3M19 14c-1.5-1.5-3-1.5-4.5 0l-4.5-4.5c1.5-1.5 1.5-3 0-4.5l4.5-4.5c1.5 1.5 3 1.5 4.5 0l4.5 4.5c-1.5 1.5-1.5 3 0 4.5Z" />
      <path d="M2 22h8" />
    </svg>
  )
}

function ScrollIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}

export default async function LegislationPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const act = getLegislationBySlug(slug)
  if (!act) notFound()

  return (
    <div className="max-w-5xl mx-auto px-6 py-24">
      <nav className="text-xs text-muted-foreground/60 mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-foreground transition-colors no-underline">
          Home
        </Link>
        <span>/</span>
        <Link href="/legislations" className="hover:text-foreground transition-colors no-underline">
          Legislations
        </Link>
        <span>/</span>
        <span className="text-foreground font-semibold truncate max-w-[300px]">
          {act.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="bg-[#12102b] text-white border border-white/5 rounded-xl p-8 flex flex-col items-center text-center aspect-[3/3.8] max-w-sm mx-auto w-full shadow-lg">
          <div className="flex flex-col items-center gap-1.5 text-white/35">
            <div className="border border-white/20 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold font-serif leading-none">
              L
            </div>
            <span className="font-serif font-black tracking-widest text-[9px] leading-none">LAWYARD</span>
          </div>

          <h1 className="text-base font-serif font-bold uppercase tracking-wide leading-snug text-white/90 text-center w-full px-4 my-auto whitespace-pre-line">
            {act.title}
          </h1>

          <div className="w-full flex justify-between items-center text-white/30 pt-4 border-t border-white/5">
            <GavelIcon className="h-6 w-6" />
            <ScrollIcon className="h-6 w-6" />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-black leading-tight mb-3">
              {act.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              Nigerian legislation — Laws of the Federation of Nigeria
            </p>
          </div>

          <div className="bg-muted/10 border border-border/20 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Price
              </span>
              <span className="text-2xl font-black text-[#a77c5c]">
                ₦{act.price.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Format
              </span>
              <span className="text-sm font-bold">PDF Download</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </span>
              <span className="text-sm font-bold">Legislation</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <AddToCartButton act={act} />
            <Link
              href="/legislations"
              className="border border-border hover:bg-muted text-foreground font-extrabold text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all text-center no-underline"
            >
              Browse All
            </Link>
          </div>

          <p className="text-xs text-muted-foreground/60 leading-relaxed pt-4 border-t border-border/20">
            By purchasing this legislation, you agree to our terms of service.
            PDF will be available for download immediately after payment
            confirmation.
          </p>
        </div>
      </div>
    </div>
  )
}
