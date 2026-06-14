'use client'

import * as React from "react"
import { useCart } from "@/components/CartContext"

interface CarouselProduct {
  id: string
  title: string
  coverTitle: string
  price: number
}

const CAROUSEL_PRODUCTS: CarouselProduct[] = [
  {
    id: "infrastructure-concession-regulatory-commission-act",
    title: "INFRASTRUCTURE CONCESSION REGULATORY COMMISSION ESTABLISHMENT ETC ACT 2005",
    coverTitle: "INFRASTRUCTURE\nCONCESSION REGULATORY\nCOMMISSION\nESTABLISHMENT ETC ACT\n2005",
    price: 500,
  },
  {
    id: "industrial-development-income-tax-relief-act",
    title: "INDUSTRIAL DEVELOPMENT INCOME TAX RELIEF ACT",
    coverTitle: "INDUSTRIAL\nDEVELOPMENT INCOME\nTAX RELIEF ACT",
    price: 500,
  },
  {
    id: "internal-loans-act",
    title: "INTERNAL LOANS ACT",
    coverTitle: "INTERNAL LOANS\nACT",
    price: 500,
  },
  {
    id: "institute-of-personnel-management-of-nigeria-act",
    title: "INSTITUTE OF PERSONNEL MANAGEMENT OF NIGERIA ACT",
    coverTitle: "INSTITUTE OF\nPERSONNEL\nMANAGEMENT OF\nNIGERIA ACT",
    price: 500,
  },
  {
    id: "institute-of-chartered-accountants-of-nigeria-act",
    title: "INSTITUTE OF CHARTERED ACCOUNTANTS OF NIGERIA ACT",
    coverTitle: "INSTITUTE OF\nCHARTERED\nACCOUNTANTS OF\nNIGERIA ACT",
    price: 500,
  },
  {
    id: "industrial-training-fund-act",
    title: "INDUSTRIAL TRAINING FUND ACT",
    coverTitle: "INDUSTRIAL\nTRAINING FUND\nACT",
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

export default function LegislationCarousel() {
  const { addToCart, cart } = useCart()
  const [addedId, setAddedId] = React.useState<string | null>(null)

  const handleAddToCart = (product: CarouselProduct) => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
    })
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 2000)
  }

  return (
    <div className="w-full bg-[#ebf5fb] dark:bg-[#0c1822] py-10 px-6 border-b border-border/10">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Books Grid/Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 w-full max-w-6xl">
          {CAROUSEL_PRODUCTS.map((product) => {
            const cartItem = cart.find(item => item.id === product.id)
            const count = cartItem?.quantity || 0

            return (
              <div key={product.id} className="flex flex-col items-center text-center group cursor-pointer" onClick={() => handleAddToCart(product)}>
                {/* Book Cover */}
                <div className="bg-[#12102b] text-white border border-white/5 rounded p-3.5 flex flex-col justify-between items-center text-center aspect-[1/1.3] w-full max-w-[130px] shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all duration-300 relative select-none">
                  {/* Small logo text */}
                  <div className="flex flex-col items-center text-[5px] text-white/30 tracking-widest font-serif leading-none gap-0.5">
                    <span className="font-extrabold border-[0.5px] border-white/10 rounded-full w-3 h-3 flex items-center justify-center scale-90">L</span>
                    <span>LAWYARD</span>
                  </div>

                  {/* Title */}
                  <div className="text-[7.5px] font-bold font-serif uppercase tracking-wider text-white/80 leading-snug whitespace-pre-line my-auto px-1 line-clamp-4">
                    {product.coverTitle}
                  </div>

                  {/* Small Icons */}
                  <div className="flex justify-between items-center w-full text-white/20 border-t border-white/5 pt-1">
                    <GavelIcon className="h-3 w-3" />
                    <ScrollIcon className="h-3 w-3" />
                  </div>
                </div>

                {/* Details below cover */}
                <div className="mt-3 space-y-0.5 max-w-[130px]">
                  <h4 className="text-[9px] font-bold uppercase tracking-wide text-foreground/80 group-hover:text-primary transition-colors line-clamp-1">
                    {product.title}
                  </h4>
                  <div className="text-[9px] font-extrabold text-[#a77c5c] flex items-center justify-center gap-1.5">
                    <span>₦{product.price}</span>
                    {count > 0 && (
                      <span className="text-[7.5px] bg-[#a77c5c] text-white px-1 rounded-full scale-90">
                        {count}
                      </span>
                    )}
                  </div>
                  <div className="text-[8.5px] text-muted-foreground/60 font-semibold group-hover:underline">
                    {addedId === product.id ? "Added ✓" : "Add to Cart"}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Carousel Dots */}
        <div className="flex items-center gap-1.5 mt-8">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground/60" />
          <span className="w-1.5 h-1.5 rounded-full border border-foreground/30" />
          <span className="w-1.5 h-1.5 rounded-full border border-foreground/30" />
          <span className="w-1.5 h-1.5 rounded-full border border-foreground/30" />
          <span className="w-1.5 h-1.5 rounded-full border border-foreground/30" />
          <span className="w-1.5 h-1.5 rounded-full border border-foreground/30" />
          <span className="w-1.5 h-1.5 rounded-full border border-foreground/30" />
          <span className="w-1.5 h-1.5 rounded-full border border-foreground/30" />
        </div>
      </div>
    </div>
  )
}
