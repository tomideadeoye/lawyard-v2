'use client'

import Link from "next/link"
import Image from "next/image"
import { ModeToggle } from "./mode-toggle"
import { useState, useEffect } from "react"
import { useCart } from "./CartContext"
import { usePathname } from "next/navigation"

// Custom SVGs for social media and utility icons
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

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13.8 12.7l-3-3c0.8-1 1.3-2.3 1.3-3.8c0-3.3-2.7-6-6.1-6C2.7 0 0 2.7 0 6c0 3.3 2.7 6 6.1 6 1.4 0 2.6-.5 3.6-1.2l3 3c.1.1.3.2.5.2.2 0 .4-.1.5-.2.3-.3.3-.8 0-1.1zM1.5 6c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5-2 4.5-4.5 4.5S1.5 8.5 1.5 6z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TrendingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 10 14" fill="currentColor" {...props}>
      <path d="M9.3,4.3H6.3l1-3.4C7.4,0.5,7.2,0.1,6.8,0C6.7,0,6.7,0,6.6,0h-4C2.3,0,2,0.2,1.9,0.5L0,7c-0.1,0.4,0.1,0.8,0.5,0.9 c0.1,0,0.1,0,0.2,0h2.5l-0.5,5.3c0,0.3,0.2,0.6,0.5,0.7l0.3,0c0.2,0,0.5-0.1,0.6-0.3l5.8-8.3c0.2-0.3,0.1-0.8-0.2-1 C9.5,4.3,9.4,4.3,9.3,4.3z M4.5,10.6l0.3-3.4c0-0.4-0.3-0.8-0.7-0.8c0,0-0.1,0-0.1,0H1.7l1.4-5h2.5l-1,3.4C4.5,5.2,4.7,5.6,5.1,5.7 c0.1,0,0.1,0,0.2,0h2.5L4.5,10.6z" />
    </svg>
  )
}

function CartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12,2.3c0-0.1,0-0.3-0.1-0.4l-1.6-1.8C10.1,0,10,0,9.8,0H2.1C2,0,1.8,0,1.7,0.2L0.1,2C0,2,0,2.1,0,2.3h0v9.5 C0,13,0.9,14,2.1,14h7.6c1.2,0,2.2-1,2.2-2.2L12,2.3L12,2.3z M2.4,1.1h7.1l0.6,0.7H1.8L2.4,1.1z M10.8,11.8c0,0.6-0.5,1.1-1,1.1 H2.1c-0.6,0-1-0.5-1-1.1V2.9h9.7V11.8z M6,9.6c1.7,0,3-1.4,3-3.1V4.9c0-0.3-0.3-0.6-0.6-0.6c-0.3,0-0.6,0.3-0.6,0.6v1.6 C7.9,7.6,7,8.4,6,8.4c-1.1,0-1.9-0.9-1.9-1.9V4.9c0-0.3-0.3-0.6-0.6-0.6c-0.3,0-0.6,0.3-0.6,0.6v1.6C2.9,8.2,4.3,9.6,6,9.6z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { getCartCount, cart, getCartTotal, removeFromCart } = useCart()
  const pathname = usePathname()
  const [readingTitle, setReadingTitle] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (pathname.startsWith('/insights/') && window.scrollY > 150) {
        const titleEl = document.querySelector('h1')
        if (titleEl) {
          setReadingTitle(titleEl.innerText)
          return
        }
      }
      setReadingTitle(null)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname])

  return (
    <header className="w-full bg-background border-b border-border/50 sticky top-0 z-50 shadow-sm">
      {/* Row 1: Logo & Utilities */}
      <div className="w-full border-b border-border/40 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left Block: Hamburger & Social Icons */}
          <div className="flex items-center gap-4 sm:gap-6 flex-1 justify-start">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-foreground hover:opacity-80 transition-opacity p-1"
              aria-label="Toggle Menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            
            <div className="hidden md:flex items-center gap-3.5 text-muted-foreground">
              <a href="https://facebook.com/lawyardNG" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="Facebook">
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a href="https://twitter.com/lawyardOrg" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="Twitter">
                <TwitterIcon className="h-4 w-4" />
              </a>
              <a href="https://instagram.com/lawyardorg" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="Instagram">
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a href="https://youtube.com/channel/UCSfulylPsd7fCNRh_4wWANQ/videos" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="YouTube">
                <YoutubeIcon className="h-4 w-4" />
              </a>
              <a href="https://www.linkedin.com/company/lawyard-nigeria/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="LinkedIn">
                <LinkedinIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Center Block: Perfectly Centered Logo */}
          <div className="flex justify-center items-center">
            <Link href="/" className="flex items-center justify-center cursor-pointer group">
              {/* Light Mode Logo (Blue) */}
              <img 
                src="/logo-blue.png" 
                alt="Lawyard Logo" 
                className="h-10 w-auto object-contain block dark:hidden group-hover:scale-[1.01] transition-transform duration-300"
              />
              {/* Dark Mode Logo (White) */}
              <img 
                src="/logo-white.png" 
                alt="Lawyard Logo" 
                className="h-10 w-auto object-contain hidden dark:block group-hover:scale-[1.01] transition-transform duration-300"
              />
            </Link>
          </div>

          {/* Right Block: Follow, Cart, Search, Theme Toggle */}
          <div className="flex items-center gap-4 sm:gap-5 flex-1 justify-end text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {/* Follow Dropdown */}
            <div className="relative group cursor-pointer hidden sm:flex items-center gap-1 hover:text-foreground transition-colors py-1">
              <span>FOLLOW</span>
              <ChevronDownIcon className="h-3 w-3" />
              <div className="absolute top-full right-0 pt-2 hidden group-hover:block z-50">
                <div className="bg-background border border-border shadow-xl rounded-lg p-3 min-w-[150px] flex flex-col gap-2 font-semibold">
                  <a href="https://facebook.com/lawyardNG" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors py-1 block">Facebook</a>
                  <a href="https://twitter.com/lawyardOrg" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors py-1 block">Twitter</a>
                  <a href="https://instagram.com/lawyardorg" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors py-1 block">Instagram</a>
                  <a href="https://youtube.com/... " target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors py-1 block">YouTube</a>
                  <a href="https://www.linkedin.com/..." target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors py-1 block">LinkedIn</a>
                </div>
              </div>
            </div>

            {/* Lightning bolt / Trending Icon */}
            <div className="relative group cursor-pointer flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors p-1">
              <TrendingIcon className="h-4 w-4" />
            </div>

             {/* Shopping Bag Icon with badge & hover dropdown */}
            <div className="relative group py-1">
              <Link href="/cart" className="relative flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors p-1" aria-label="Cart">
                <CartIcon className="h-4 w-4" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-background">
                    {getCartCount()}
                  </span>
                )}
              </Link>

              {/* Cart Dropdown Menu on hover */}
              <div className="absolute top-full right-0 pt-2 hidden group-hover:block z-50">
                <div className="bg-background border border-border shadow-xl rounded-lg p-5 w-[320px] flex flex-col gap-4 text-xs font-semibold text-foreground">
                  {cart.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-xs">
                      Your cart is empty.
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-border/10 max-h-[240px] overflow-y-auto pr-1">
                        {cart.map((item) => (
                          <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0 items-center justify-between">
                            {/* Product Miniature Book Cover */}
                            <div className="w-10 h-13 bg-[#12102b] rounded border border-white/5 flex flex-col justify-center items-center text-center shrink-0 p-1 select-none">
                              <span className="font-serif font-black text-[4px] text-white/30 tracking-widest leading-none">L</span>
                              <span className="font-serif font-black text-[4.5px] text-white/90 uppercase tracking-wide leading-tight mt-1 line-clamp-3">
                                {(item.title.split(" ACT")[0] || "").substring(0, 15)}
                              </span>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0 px-1 text-left">
                              <h5 className="text-[10px] font-bold text-foreground font-serif leading-tight uppercase tracking-wide line-clamp-2">
                                {item.title}
                              </h5>
                              <span className="text-[9px] text-muted-foreground/80 block mt-1">
                                {item.quantity} × ₦{item.price}
                              </span>
                            </div>

                            {/* Remove button */}
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-muted-foreground hover:text-destructive text-sm font-bold p-1 transition-colors shrink-0"
                              aria-label="Remove item"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Subtotal */}
                      <div className="flex justify-between items-center border-t border-border/20 pt-3 text-xs font-bold uppercase tracking-wider">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="text-foreground">₦{getCartTotal()}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Link 
                          href="/cart"
                          className="bg-[#111129] hover:bg-[#1e1e4a] text-white text-[9px] font-extrabold uppercase tracking-widest py-2.5 rounded-sm shadow-sm transition-colors text-center no-underline"
                        >
                          View Cart
                        </Link>
                        <Link 
                          href="/checkout"
                          className="bg-[#a77c5c] hover:bg-[#906b4e] text-white text-[9px] font-extrabold uppercase tracking-widest py-2.5 rounded-sm shadow-sm transition-colors text-center no-underline"
                        >
                          Checkout
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Search Icon */}
            <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors p-1" aria-label="Search">
              <SearchIcon className="h-4 w-4" />
            </Link>

            {/* Dark Mode Toggle */}
            <div className="h-4 w-px bg-border/60 mx-0.5 hidden sm:block" />
            <ModeToggle />
          </div>
        </div>
      </div>

      {/* Row 2: Main Navigation Menu or NOW READING bar */}
      <div className="w-full py-3.5 px-6 hidden md:block border-t border-border/20 transition-all duration-300">
        {readingTitle ? (
          <div className="max-w-7xl mx-auto flex justify-between items-center text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="text-foreground/90 font-serif font-bold text-sm tracking-wide truncate max-w-xl">
              <span className="text-[#a77c5c] font-sans font-black text-xs mr-2 uppercase tracking-widest">Now Reading</span>
              | {readingTitle}
            </div>
            
            {/* Sharing / Comments counts */}
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span>0 SHARES</span>
              <span>•</span>
              <a href="#comments" className="hover:text-foreground transition-colors no-underline">
                0 COMMENTS
              </a>
            </div>
          </div>
        ) : (
          <nav className="max-w-7xl mx-auto flex justify-center items-center gap-x-8 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
            <Link href="/about" className="hover:text-foreground transition-colors no-underline">
              About
            </Link>
            
            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-foreground transition-colors">
              <span>Categories</span>
              <ChevronDownIcon className="h-3 w-3" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:block z-50">
                <div className="bg-background border border-border shadow-xl rounded-lg p-3 min-w-[160px] flex flex-col gap-2 font-semibold">
                  <Link href="/category/news" className="hover:text-primary transition-colors no-underline py-1 block">News</Link>
                  <Link href="/category/opinions" className="hover:text-primary transition-colors no-underline py-1 block">Opinions</Link>
                  <Link href="/category/lawyard-spotlight" className="hover:text-primary transition-colors no-underline py-1 block">Spotlight</Link>
                  <Link href="/category/sports-law" className="hover:text-primary transition-colors no-underline py-1 block">Sports Law</Link>
                  <Link href="/category/judgements" className="hover:text-primary transition-colors no-underline py-1 block">Judgements</Link>
                </div>
              </div>
            </div>

            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-foreground transition-colors">
              <span>Media</span>
              <ChevronDownIcon className="h-3 w-3" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:block z-50">
                <div className="bg-background border border-border shadow-xl rounded-lg p-3 min-w-[140px] flex flex-col gap-2 font-semibold">
                  <Link href="/podcasts" className="hover:text-primary transition-colors no-underline py-1 block">Podcasts</Link>
                  <Link href="/tv" className="hover:text-primary transition-colors no-underline py-1 block">Lawyard TV</Link>
                </div>
              </div>
            </div>

            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-foreground transition-colors">
              <span>Features</span>
              <ChevronDownIcon className="h-3 w-3" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:block z-50">
                <div className="bg-background border border-border shadow-xl rounded-lg p-3 min-w-[170px] flex flex-col gap-2 font-semibold">
                  <Link href="/legislations" className="hover:text-primary transition-colors no-underline py-1 block">Legislations</Link>
                  <a href="https://directory.lawyard.ng" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors no-underline py-1 block">Lawyard Directory</a>
                  <a href="https://job.lawyard.ng" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors no-underline py-1 block">Lawyard Jobs</a>
                </div>
              </div>
            </div>

            <Link href="/shop" className="hover:text-foreground transition-colors no-underline">
              Shop
            </Link>

            <a href="https://directory.lawyard.ng/login" className="hover:text-foreground transition-colors no-underline">
              My Account
            </a>

            <Link href="/contact" className="hover:text-foreground transition-colors no-underline">
              Contact
            </Link>
          </nav>
        )}
      </div>

      {/* Mobile Drawer menu (simple expandable list) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-muted/30 px-6 py-4 flex flex-col gap-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground transition-colors py-1 block no-underline">
            About
          </Link>
          <div className="border-t border-border/20 my-1" />
          <span className="text-xs text-foreground/45 tracking-widest font-extrabold mb-1">Categories</span>
          <div className="pl-4 flex flex-col gap-2 normal-case">
            <Link href="/category/news" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground transition-colors no-underline">News</Link>
            <Link href="/category/opinions" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground transition-colors no-underline">Opinions</Link>
            <Link href="/category/lawyard-spotlight" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground transition-colors no-underline">Spotlight</Link>
            <Link href="/category/sports-law" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground transition-colors no-underline">Sports Law</Link>
            <Link href="/category/judgements" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground transition-colors no-underline">Judgements</Link>
          </div>
          <div className="border-t border-border/20 my-1" />
          <span className="text-xs text-foreground/45 tracking-widest font-extrabold mb-1">Media</span>
          <div className="pl-4 flex flex-col gap-2 normal-case">
            <Link href="/podcasts" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground transition-colors no-underline">Podcasts</Link>
            <Link href="/tv" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground transition-colors no-underline">Lawyard TV</Link>
          </div>
          <div className="border-t border-border/20 my-1" />
          <span className="text-xs text-foreground/45 tracking-widest font-extrabold mb-1">Features</span>
          <div className="pl-4 flex flex-col gap-2 normal-case">
            <Link href="/legislations" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground transition-colors no-underline">Legislations</Link>
            <a href="https://directory.lawyard.ng" onClick={() => setMobileMenuOpen(false)} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors no-underline">Lawyard Directory</a>
            <a href="https://job.lawyard.ng" onClick={() => setMobileMenuOpen(false)} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors no-underline">Lawyard Jobs</a>
          </div>
          <div className="border-t border-border/20 my-1" />
          <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground transition-colors py-1 block no-underline">
            Shop
          </Link>
          <a href="https://directory.lawyard.ng/login" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground transition-colors py-1 block no-underline">
            My Account
          </a>
          <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground transition-colors py-1 block no-underline">
            Contact
          </Link>
          
          <div className="border-t border-border/20 my-2" />
          <div className="flex items-center gap-4 justify-center py-2">
            <a href="https://facebook.com/lawyardNG" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="Facebook">
              <FacebookIcon className="h-5 w-5" />
            </a>
            <a href="https://twitter.com/lawyardOrg" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="Twitter">
              <TwitterIcon className="h-5 w-5" />
            </a>
            <a href="https://instagram.com/lawyardorg" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="Instagram">
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a href="https://youtube.com/channel/UCSfulylPsd7fCNRh_4wWANQ/videos" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="YouTube">
              <YoutubeIcon className="h-5 w-5" />
            </a>
            <a href="https://www.linkedin.com/company/lawyard-nigeria/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" aria-label="LinkedIn">
              <LinkedinIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
