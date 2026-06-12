import Link from "next/link"
import Image from "next/image"

// Custom SVGs for social media icons
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  )
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  )
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="w-full bg-background border-t border-border mt-auto">
      {/* Upper Footer: 3 Columns Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Column 1: ABOUT LAWYARD (spans 5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground border-b border-border/30 pb-2">
            About Lawyard
          </h4>
          <div className="flex items-center">
            {/* Light Mode Logo (Blue) */}
            <img 
              src="/logo-blue.png" 
              alt="Lawyard Logo" 
              className="h-10 w-auto object-contain block dark:hidden"
            />
            {/* Dark Mode Logo (White) */}
            <img 
              src="/logo-white.png" 
              alt="Lawyard Logo" 
              className="h-10 w-auto object-contain hidden dark:block"
            />
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-sm">
            Lawyard is a legal media and services platform that provides enlightenment and access to legal services to members of the public (individuals and businesses) while also assisting lawyers of needed information on new trends and resources in various areas of practice.
          </p>
        </div>

        {/* Column 2: CATEGORIES (spans 3 cols) */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground border-b border-border/30 pb-2">
            Categories
          </h4>
          <div className="grid grid-cols-1 gap-2 text-xs font-semibold">
            {[
              { name: "Blog", href: "/category/blog" },
              { name: "Blog Articles", href: "/category/blog-articles" },
              { name: "Downloads", href: "/category/downloads" },
              { name: "Events", href: "/category/events" },
              { name: "Features", href: "/category/features" },
              { name: "Judgements", href: "/category/judgements" },
              { name: "Lawyard Journal", href: "/category/lawyard-journal" },
              { name: "Lawyard Spotlight", href: "/category/lawyard-spotlight" },
              { name: "Lawyard TV", href: "/category/lawyard-tv" },
              { name: "Legal Advice", href: "/category/legal-advice" },
              { name: "Legal articles", href: "/category/legal-articles" },
              { name: "News", href: "/category/news" },
              { name: "Opinions", href: "/category/opinions" },
              { name: "Sports Law", href: "/category/sports-law" }
            ].map(link => (
              <Link key={link.name} href={link.href} className="no-underline text-muted-foreground hover:text-primary transition-colors py-0.5">
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Column 3: SHOP LEGISLATIONS (spans 4 cols) */}
        <div className="md:col-span-4 space-y-6">
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground border-b border-border/30 pb-2">
            Shop Legislations
          </h4>
          
          <div className="space-y-4">
            {/* Shop item 1 */}
            <Link href="/shop" className="group flex gap-3.5 items-center no-underline border border-border/20 rounded-md p-2.5 bg-muted/10 hover:bg-muted/30 hover:scale-[1.002] transition-all duration-300">
              {/* Product Cover */}
              <div className="w-14 h-18 rounded bg-[#12102b] flex flex-col justify-center items-center text-center shrink-0 border border-white/5">
                <span className="font-serif font-black text-[5px] text-white/30 tracking-widest leading-none">L</span>
                <span className="font-serif font-black text-[5px] text-white/30 tracking-widest leading-none mt-0.5">LAWYARD</span>
              </div>
              {/* Product Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <h5 className="text-[10px] font-bold text-foreground font-serif leading-tight uppercase tracking-wide line-clamp-3 group-hover:text-primary transition-colors">
                  INSTITUTE OF CHARTERED SECRETARIES AND ADMINISTRATORS OF NIGERIA ACT
                </h5>
                <span className="text-[9px] font-bold text-[#a77c5c] block">
                  N500
                </span>
              </div>
            </Link>

            {/* Shop item 2 */}
            <Link href="/shop" className="group flex gap-3.5 items-center no-underline border border-border/20 rounded-md p-2.5 bg-muted/10 hover:bg-muted/30 hover:scale-[1.002] transition-all duration-300">
              {/* Product Cover */}
              <div className="w-14 h-18 rounded bg-[#12102b] flex flex-col justify-center items-center text-center shrink-0 border border-white/5">
                <span className="font-serif font-black text-[5px] text-white/30 tracking-widest leading-none">L</span>
                <span className="font-serif font-black text-[5px] text-white/30 tracking-widest leading-none mt-0.5">LAWYARD</span>
              </div>
              {/* Product Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <h5 className="text-[10px] font-bold text-foreground font-serif leading-tight uppercase tracking-wide line-clamp-3 group-hover:text-primary transition-colors">
                  INFRASTRUCTURE CONCESSION REGULATORY COMMISSION ESTABLISHMENT ETC ACT 2005
                </h5>
                <span className="text-[9px] font-bold text-[#a77c5c] block">
                  N500
                </span>
              </div>
            </Link>
          </div>
        </div>

      </div>

      {/* Lower Footer: Dark Bottom Utility Bar */}
      <div className="w-full bg-[#111129] text-white/80 py-10 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Left Block: Nav Links */}
          <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-white/90 justify-center md:justify-start">
            <Link href="/tv" className="hover:text-white transition-colors no-underline">TV</Link>
            <Link href="/podcasts" className="hover:text-white transition-colors no-underline">Podcasts</Link>
            <Link href="/shop" className="hover:text-white transition-colors no-underline">Shop</Link>
            <Link href="/about" className="hover:text-white transition-colors no-underline">About</Link>
            <Link href="/contact" className="hover:text-white transition-colors no-underline">Contact</Link>
          </div>

          {/* Center Block: Logo Signature */}
          <div className="flex justify-center items-center">
            <Link href="/" className="flex items-center justify-center cursor-pointer">
              <img 
                src="/logo-white.png" 
                alt="Lawyard Logo" 
                className="h-8 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Right Block: Social Icons */}
          <div className="flex items-center justify-center gap-4 text-white/90">
            <a href="https://facebook.com/lawyardNG" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Facebook">
              <FacebookIcon className="h-4 w-4" />
            </a>
            <a href="https://twitter.com/lawyardOrg" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Twitter">
              <TwitterIcon className="h-4 w-4" />
            </a>
            <a href="https://instagram.com/lawyardorg" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Instagram">
              <InstagramIcon className="h-4 w-4" />
            </a>
            <a href="https://youtube.com/... " target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="YouTube">
              <YoutubeIcon className="h-4 w-4" />
            </a>
            <a href="https://www.linkedin.com/company/lawyard-nigeria/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="LinkedIn">
              <LinkedinIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Lower Row: Copyright Notice */}
        <div className="max-w-7xl mx-auto pt-6 mt-6 border-t border-white/5 text-center text-[8.5px] font-bold uppercase tracking-widest text-white/40">
          <p>© COPYRIGHT 2026 ALL RIGHTS RESERVED | DESIGNED BY RENIX CONSULTING</p>
        </div>

        {/* Vertical Scroll to Top (Positioned bottom right) */}
        <div className="absolute bottom-6 right-6 rotate-90 origin-left hidden lg:block">
          <a 
            href="#"
            className="text-[8.5px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors py-1 no-underline"
          >
            SCROLL TO TOP
          </a>
        </div>
      </div>
    </footer>
  )
}
