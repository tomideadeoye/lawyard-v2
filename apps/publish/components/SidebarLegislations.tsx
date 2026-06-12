'use client'

import * as React from "react"
import { useCart } from "@/components/CartContext"

interface Product {
  id: string
  title: string
  coverTitle: string
  price: number
}

const SIDEBAR_PRODUCTS: Product[] = [
  {
    id: "armed-forces-disciplinary-proceedings-act",
    title: "ARMED FORCES DISCIPLINARY PROCEEDINGS ACT",
    coverTitle: "ARMED FORCES\nDISCIPLINARY PROCEEDINGS\nACT",
    price: 500,
  },
  {
    id: "asset-management-corporation-of-nigeria-act",
    title: "ASSET MANAGEMENT CORPORATION OF NIGERIA ACT",
    coverTitle: "ASSET MANAGEMENT\nCORPORATION OF\nNIGERIA ACT",
    price: 500,
  },
]

function GavelIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m14 13-5 5M16 11l-3 3M19 14c-1.5-1.5-3-1.5-4.5 0l-4.5-4.5c1.5-1.5 1.5-3 0-4.5l4.5-4.5c1.5 1.5 3 1.5 4.5 0l4.5 4.5c-1.5 1.5-1.5 3 0 4.5Z" />
      <path d="M2 22h8" />
    </svg>
  )
}

export default function SidebarLegislations() {
  const { addToCart, cart } = useCart()
  const [addedId, setAddedId] = React.useState<string | null>(null)

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
    })
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 2000)
  }

  return (
    <div className="space-y-4 pt-6 border-t border-border/10">
      <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/80 border-b-2 border-foreground/30 pb-2.5">
        Shop Legislations
      </h3>

      <div className="space-y-6">
        {SIDEBAR_PRODUCTS.map((product) => {
          const cartItem = cart.find(item => item.id === product.id)
          const count = cartItem?.quantity || 0

          return (
            <div 
              key={product.id} 
              onClick={() => handleAddToCart(product)}
              className="flex gap-4 items-center p-3 rounded-lg border border-border/40 hover:border-foreground/30 bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer group select-none"
            >
              {/* Miniature Cover */}
              <div className="w-12 h-16 bg-[#12102b] text-white border border-white/5 rounded flex flex-col justify-between items-center text-center p-1.5 shrink-0 select-none">
                <span className="text-[3px] text-white/35 font-serif font-black leading-none tracking-widest">L</span>
                <div className="text-[5px] font-bold font-serif uppercase tracking-wider text-white/80 leading-snug line-clamp-3 my-auto">
                  {(product.title.split(" ACT")[0] || "").substring(0, 15)}
                </div>
                <GavelIcon className="h-2 w-2 text-white/20" />
              </div>

              {/* Title, price, button */}
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-[11px] font-bold font-serif uppercase tracking-wide text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {product.title}
                </h4>
                <div className="text-[10px] font-bold text-[#a77c5c] flex items-center gap-2">
                  <span>₦{product.price}</span>
                  {count > 0 && (
                    <span className="text-[8px] bg-[#a77c5c] text-white px-1.5 py-0.5 rounded-full scale-90">
                      {count} in cart
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-muted-foreground/60 font-semibold group-hover:underline">
                  {addedId === product.id ? "Added ✓" : "Add to Cart"}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
