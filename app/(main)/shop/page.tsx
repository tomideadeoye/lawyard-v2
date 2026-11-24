'use client'

import * as React from "react"
import Link from "next/link"
import { useCart } from "@/components/CartContext"
import { LEGISLATIONS } from "@/lib/legislations"
import type { Legislation } from "@/lib/legislations"

function coverTitle(title: string): string {
  const words = title.split(" ")
  if (words.length <= 4) return title
  const mid = Math.ceil(words.length / 2)
  return words.slice(0, mid).join(" ") + "\n" + words.slice(mid).join(" ")
}

const SHOP_PRODUCTS = LEGISLATIONS

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

function FilterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" x2="16.65" y1="21" y2="16.65" />
    </svg>
  )
}

export default function ShopPage() {
  const { addToCart, cart } = useCart()
  const [addedProduct, setAddedProduct] = React.useState<string | null>(null)
  
  // Sorting States
  const [sortBy, setSortBy] = React.useState<string>("default")
  
  // Search State
  const [searchQuery, setSearchQuery] = React.useState<string>("")

  const handleAddToCart = (product: Legislation) => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
    })
    setAddedProduct(product.id)
    setTimeout(() => setAddedProduct(null), 2000)
  }

  const sortedProducts = React.useMemo(() => {
    const items = [...SHOP_PRODUCTS]
    if (sortBy === "price-asc") {
      // Sort by price ascending, secondary by title
      return items.sort((a, b) => a.price - b.price || a.title.localeCompare(b.title))
    }
    if (sortBy === "price-desc") {
      // Sort by price descending, secondary by title
      return items.sort((a, b) => b.price - a.price || a.title.localeCompare(b.title))
    }
    if (sortBy === "popularity") {
      // Dummy popularity sort (by ID string length & alphabetical)
      return items.sort((a, b) => b.id.length - a.id.length || a.title.localeCompare(b.title))
    }
    if (sortBy === "latest") {
      // Dummy latest sort (reverse ID alphabetical)
      return items.sort((a, b) => b.id.localeCompare(a.id))
    }
    return items
  }, [sortBy])

  const filteredProducts = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return sortedProducts
    return sortedProducts.filter((product) => 
      product.title.toLowerCase().includes(query)
    )
  }, [sortedProducts, searchQuery])

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Upper Navigation / Sorting Bar */}
      <div className="border-b border-border/40 py-6 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {/* Left: Filter and Breadcrumbs */}
          <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
            <div className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
              <FilterIcon className="h-4 w-4" />
              <span>Filter</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground/60">
              <Link href="/" className="hover:text-foreground transition-colors no-underline">
                Home
              </Link>
              <span>/</span>
              <span className="text-foreground font-bold">Shop</span>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="relative w-full md:max-w-xs">
            <input
              type="text"
              placeholder="Search legislations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border/40 hover:border-foreground/20 focus:border-[#ae8877] text-foreground placeholder:text-muted-foreground/50 text-[11px] px-3.5 py-2 pl-9 pr-8 rounded transition-all focus:outline-none focus:ring-1 focus:ring-[#ae8877]/30 uppercase font-bold tracking-wider"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors text-xs font-normal"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right: Showing Results & Sorting */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 text-foreground/80 w-full md:w-auto">
            <span className="normal-case font-medium text-xs text-muted-foreground/80">
              {searchQuery ? `Showing ${filteredProducts.length} of ${SHOP_PRODUCTS.length} results` : `Showing 1–${Math.min(12, filteredProducts.length)} of ${SHOP_PRODUCTS.length} results`}
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-foreground hover:text-foreground transition-colors uppercase font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#ae8877]/50 rounded border border-border/40 px-2.5 py-1.5 cursor-pointer"
              >
                <option value="default" className="text-black bg-white">Default sorting</option>
                <option value="popularity" className="text-black bg-white">Sort by popularity</option>
                <option value="latest" className="text-black bg-white">Sort by latest</option>
                <option value="price-asc" className="text-black bg-white">Sort by price: low to high</option>
                <option value="price-desc" className="text-black bg-white">Sort by price: high to low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main shop grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="p-4 bg-[#12102b]/10 rounded-full border border-[#ae8877]/20">
              <SearchIcon className="h-8 w-8 text-[#ae8877]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-foreground">No legislations found</h3>
            <p className="text-xs text-muted-foreground max-w-xs">
              We couldn't find any matches for "{searchQuery}". Try using different terms.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-[10px] font-bold uppercase tracking-wider bg-[#ae8877] text-white hover:bg-[#ae8877]/90 px-4 py-2.5 rounded transition-colors"
            >
              Clear search
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
              {filteredProducts.map((product) => {
                const inCartItem = cart.find((item) => item.id === product.id)
                const countInCart = inCartItem?.quantity || 0

                return (
                  <div key={product.id} className="flex flex-col items-center text-center group">
                    {/* Book Cover Card */}
                    <div 
                      onClick={() => handleAddToCart(product)}
                      className="bg-[#12102b] text-white border border-white/5 rounded-lg p-6 flex flex-col justify-between items-center text-center aspect-[3/3.8] w-full shadow-md hover:scale-[1.01] hover:shadow-lg hover:border-white/10 transition-all duration-300 cursor-pointer relative overflow-hidden select-none"
                    >
                      {/* Decorative Logo at Center-Top */}
                      <div className="flex flex-col items-center gap-1.5 text-white/35">
                        <div className="border border-white/20 rounded-full w-7 h-7 flex items-center justify-center text-[11px] font-bold font-serif leading-none">
                          L
                        </div>
                        <span className="font-serif font-black tracking-widest text-[8px] leading-none">LAWYARD</span>
                      </div>

                      {/* Title of Act at Center-Middle */}
                      <h3 className="text-sm font-serif font-bold uppercase tracking-wide leading-snug text-white/90 text-center w-full px-2 whitespace-pre-line my-auto">
                        {coverTitle(product.title)}
                      </h3>

                      {/* Gavel & Scroll Icons at Center-Bottom */}
                      <div className="w-full flex justify-between items-center text-white/30 pt-3 border-t border-white/5">
                        <GavelIcon className="h-5 w-5" />
                        <ScrollIcon className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Info Text below Book Cover */}
                    <div className="mt-5 space-y-1.5 w-full">
                      <h4 className="text-[11px] sm:text-xs font-serif font-extrabold uppercase tracking-wide text-foreground leading-tight line-clamp-2 px-1">
                        {product.title}
                      </h4>
                      <div className="text-[11px] font-bold text-[#a77c5c]">
                        ₦{product.price}
                      </div>
                      
                      {/* Interactive Cart Button Link */}
                      <div className="pt-1 flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="text-[10px] font-bold uppercase tracking-wider text-foreground/80 hover:text-primary transition-colors underline underline-offset-4 decoration-1 decoration-foreground/30 hover:decoration-primary"
                        >
                          {addedProduct === product.id ? "Added ✓" : "Add to cart"}
                        </button>
                        {countInCart > 0 && (
                          <span className="text-[8.5px] font-extrabold bg-accent text-accent-foreground rounded-full px-2 py-0.5 border border-background">
                            {countInCart}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Premium WooCommerce-style Pagination */}
            {!searchQuery && (
              <div className="flex justify-center mt-24">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="w-8 h-8 flex items-center justify-center bg-[#ae8877] text-white rounded-full">1</span>
                  <Link href="#" className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground border border-border/40 hover:border-foreground/40 rounded-full transition-colors no-underline">2</Link>
                  <Link href="#" className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground border border-border/40 hover:border-foreground/40 rounded-full transition-colors no-underline">3</Link>
                  <Link href="#" className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground border border-border/40 hover:border-foreground/40 rounded-full transition-colors no-underline">4</Link>
                  <span className="text-foreground/40 px-1 select-none">...</span>
                  <Link href="#" className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground border border-border/40 hover:border-foreground/40 rounded-full transition-colors no-underline">14</Link>
                  <Link href="#" className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground border border-border/40 hover:border-foreground/40 rounded-full transition-colors no-underline">15</Link>
                  <Link href="#" className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground border border-border/40 hover:border-foreground/40 rounded-full transition-colors no-underline">16</Link>
                  <Link href="#" className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground border border-border/40 hover:border-foreground/40 rounded-full transition-colors no-underline">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
