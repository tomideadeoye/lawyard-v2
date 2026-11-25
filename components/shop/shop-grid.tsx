"use client";

import * as React from "react";
import { useCart } from "@/components/CartContext";
import type { Legislation } from "@/lib/legislations";
import type { CatalogueItem } from "@/lib/shop/catalogue";

function coverTitle(title: string): string {
  const words = title.split(" ");
  if (words.length <= 4) return title;
  const mid = Math.ceil(words.length / 2);
  return words.slice(0, mid).join(" ") + "\n" + words.slice(mid).join(" ");
}

function GavelIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m14 13-5 5M16 11l-3 3M19 14c-1.5-1.5-3-1.5-4.5 0l-4.5-4.5c1.5-1.5 1.5-3 0-4.5l4.5-4.5c1.5 1.5 3 1.5 4.5 0l4.5 4.5c-1.5 1.5-1.5 3 0 4.5Z" />
      <path d="M2 22h8" />
    </svg>
  );
}

function ScrollIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </svg>
  );
}

/** Presentational grid. Filtering and paging happen on the server. */
export function ShopGrid({
  products,
  availableSlugs,
}: {
  products: CatalogueItem[];
  availableSlugs: string[];
}) {
  const { cart, addToCart } = useCart();
  const [added, setAdded] = React.useState<string | null>(null);
  const available = React.useMemo(() => new Set(availableSlugs), [availableSlugs]);

  const handleAdd = (product: Legislation) => {
    if (!available.has(product.slug)) return;
    addToCart({ id: product.id, title: product.title, price: product.price });
    setAdded(product.id);
    setTimeout(() => setAdded(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
      {products.map((product) => {
        const inCart = cart.find((item) => item.id === product.id);
        const canBuy = available.has(product.slug);

        return (
          <div key={product.id} className="flex flex-col items-center text-center group">
            <div
              onClick={() => canBuy && handleAdd(product as Legislation)}
              className={`bg-[#12102b] text-white border border-white/5 rounded-lg p-6 flex flex-col justify-between items-center text-center aspect-[3/3.8] w-full shadow-md transition-all duration-300 relative overflow-hidden select-none ${
                canBuy ? "hover:scale-[1.01] hover:shadow-lg hover:border-white/10 cursor-pointer" : "opacity-70"
              }`}
            >
              <div className="flex flex-col items-center gap-1.5 text-white/35">
                <div className="border border-white/20 rounded-full w-7 h-7 flex items-center justify-center text-[11px] font-bold font-serif leading-none">
                  L
                </div>
                <span className="font-serif font-black tracking-widest text-[8px] leading-none">LAWYARD</span>
              </div>

              <h3 className="text-sm font-serif font-bold uppercase tracking-wide leading-snug text-white/90 text-center w-full px-2 whitespace-pre-line my-auto">
                {coverTitle(product.title)}
              </h3>

              <div className="w-full flex justify-between items-center text-white/30 pt-3 border-t border-white/5">
                <GavelIcon className="h-5 w-5" />
                <ScrollIcon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 space-y-1.5 w-full">
              <h4 className="text-[11px] sm:text-xs font-serif font-extrabold uppercase tracking-wide text-foreground leading-tight line-clamp-2 px-1">
                {product.title}
              </h4>
              <div className="text-[11px] font-bold text-[#a77c5c]">₦{product.price.toLocaleString()}</div>

              <div className="pt-1 flex items-center justify-center gap-2">
                <button
                  onClick={() => handleAdd(product as Legislation)}
                  disabled={!canBuy}
                  title={canBuy ? undefined : "This legislation has no file yet"}
                  className={`text-[10px] font-bold uppercase tracking-wider transition-colors underline underline-offset-4 decoration-1 ${
                    canBuy
                      ? "text-foreground/80 hover:text-primary decoration-foreground/30 hover:decoration-primary"
                      : "text-muted-foreground/50 cursor-not-allowed decoration-muted-foreground/20"
                  }`}
                >
                  {!canBuy ? "Coming soon" : added === product.id ? "Added ✓" : "Add to cart"}
                </button>
                {inCart && (inCart.quantity ?? 0) > 0 && (
                  <span className="text-[8.5px] font-extrabold bg-accent text-accent-foreground rounded-full px-2 py-0.5 border border-background">
                    {inCart.quantity}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
