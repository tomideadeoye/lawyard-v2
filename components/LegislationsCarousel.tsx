'use client'

import * as React from 'react'
import Link from 'next/link'
import Marquee from 'react-fast-marquee'
import { LEGISLATIONS } from '@/lib/legislations'

// Select two different subsets of legislations for dual-marquee rows
const ROW_1_ITEMS = LEGISLATIONS.slice(0, 18)
const ROW_2_ITEMS = LEGISLATIONS.slice(18, 36)

export default function LegislationsCarousel() {
  return (
    <div className="w-full flex flex-col gap-6 py-6 overflow-hidden relative select-none">
      {/* Top Gradient Shading Overlay (Left & Right fades) */}
      <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Row 1: Left to Right Marquee */}
      <div className="w-full">
        <Marquee 
          speed={45} 
          pauseOnHover={true} 
          gradient={false} 
          direction="left"
        >
          <div className="flex gap-4 pr-4 py-2">
            {ROW_1_ITEMS.map((item) => (
              <Link
                key={`r1-${item.id}`}
                href={`/shop?search=${encodeURIComponent(item.title)}`}
                className="w-[240px] sm:w-[280px] shrink-0 bg-[#12102b] text-white border border-white/5 rounded-xl p-5 flex flex-col justify-between items-center text-center aspect-[3/3.6] shadow-sm hover:scale-[1.03] hover:border-white/20 hover:shadow-lg hover:shadow-black/35 transition-all duration-300 no-underline group"
              >
                <div className="flex flex-col items-center gap-2 text-white/35 my-auto group-hover:text-white/60 transition-colors duration-300">
                  <div className="border border-white/25 group-hover:border-white/50 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold font-serif leading-none transition-colors duration-300">
                    L
                  </div>
                  <span className="font-serif font-black tracking-widest text-[9px] leading-none">LAWYARD</span>
                </div>

                <h3 className="text-[9px] sm:text-[10px] font-serif font-bold uppercase tracking-wide leading-tight text-white/90 group-hover:text-white text-center w-full line-clamp-3 mt-auto pt-4 border-t border-white/5">
                  {item.title}
                </h3>
              </Link>
            ))}
          </div>
        </Marquee>
      </div>

      {/* Row 2: Right to Left Marquee (Reverse direction) */}
      <div className="w-full">
        <Marquee 
          speed={45} 
          pauseOnHover={true} 
          gradient={false} 
          direction="right"
        >
          <div className="flex gap-4 pr-4 py-2">
            {ROW_2_ITEMS.map((item) => (
              <Link
                key={`r2-${item.id}`}
                href={`/shop?search=${encodeURIComponent(item.title)}`}
                className="w-[240px] sm:w-[280px] shrink-0 bg-[#12102b] text-white border border-white/5 rounded-xl p-5 flex flex-col justify-between items-center text-center aspect-[3/3.6] shadow-sm hover:scale-[1.03] hover:border-white/20 hover:shadow-lg hover:shadow-black/35 transition-all duration-300 no-underline group"
              >
                <div className="flex flex-col items-center gap-2 text-white/35 my-auto group-hover:text-white/60 transition-colors duration-300">
                  <div className="border border-white/25 group-hover:border-white/50 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold font-serif leading-none transition-colors duration-300">
                    L
                  </div>
                  <span className="font-serif font-black tracking-widest text-[9px] leading-none">LAWYARD</span>
                </div>

                <h3 className="text-[9px] sm:text-[10px] font-serif font-bold uppercase tracking-wide leading-tight text-white/90 group-hover:text-white text-center w-full line-clamp-3 mt-auto pt-4 border-t border-white/5">
                  {item.title}
                </h3>
              </Link>
            ))}
          </div>
        </Marquee>
      </div>
    </div>
  )
}
