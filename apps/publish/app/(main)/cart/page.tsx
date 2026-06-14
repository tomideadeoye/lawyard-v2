'use client'

import * as React from "react"
import Link from "next/link"
import { useCart } from "@/components/CartContext"

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart()
  const [couponCode, setCouponCode] = React.useState("")
  const [appliedCoupon, setAppliedCoupon] = React.useState(false)
  const [updateSuccess, setUpdateSuccess] = React.useState(false)

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    if (couponCode.trim() !== "") {
      setAppliedCoupon(true)
      setTimeout(() => setAppliedCoupon(false), 3000)
    }
  }

  const handleUpdateCart = () => {
    setUpdateSuccess(true)
    setTimeout(() => setUpdateSuccess(false), 2000)
  }

  const getCoverTitle = (title: string) => {
    return title.replace(" ACT", "").trim()
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Title */}
        <h1 className="text-center font-serif text-3xl md:text-4xl font-normal tracking-wide mb-16 mt-4">
          Shopping Cart
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border/60 rounded-lg max-w-xl mx-auto">
            <p className="text-muted-foreground font-serif mb-6 text-sm">Your shopping cart is empty.</p>
            <Link
              href="/shop"
              className="bg-[#111129] hover:bg-[#1e1e4a] text-white text-[10px] font-extrabold uppercase tracking-widest px-6 py-3.5 rounded-sm transition-colors no-underline inline-block"
            >
              Return to shop
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Cart Items Table */}
            <div className="overflow-x-auto border-b border-border/20">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 pb-3">
                    <th className="py-4 w-12"></th>
                    <th className="py-4 w-20"></th>
                    <th className="py-4 pl-4">Product</th>
                    <th className="py-4 w-28 text-center">Price</th>
                    <th className="py-4 w-36 text-center">Quantity</th>
                    <th className="py-4 w-28 text-right pr-4">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {cart.map((item) => (
                    <tr key={item.id} className="align-middle">
                      {/* Remove Button */}
                      <td className="py-6">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-muted-foreground hover:text-destructive text-xl font-bold p-1 transition-colors leading-none"
                          aria-label="Remove item"
                        >
                          ×
                        </button>
                      </td>

                      {/* Cover Image */}
                      <td className="py-6">
                        <div className="w-14 h-18 bg-[#12102b] rounded border border-white/5 flex flex-col justify-between items-center text-center p-2.5 select-none shadow-md shrink-0">
                          <div className="flex flex-col items-center gap-0.5 text-white/35">
                            <div className="border border-white/20 rounded-full w-3 h-3 flex items-center justify-center text-[4px] font-bold font-serif leading-none">
                              L
                            </div>
                          </div>
                          <span className="font-serif font-black text-[5px] text-white/95 uppercase tracking-wide leading-tight px-0.5 my-auto line-clamp-3">
                            {getCoverTitle(item.title)}
                          </span>
                          <div className="w-full border-t border-white/5 pt-0.5 flex justify-between text-white/20 text-[5px] leading-none">
                            <span>⚖️</span>
                            <span>📜</span>
                          </div>
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="py-6 pl-4">
                        <span className="font-serif font-bold text-xs uppercase tracking-wider text-foreground block hover:text-primary transition-colors">
                          {item.title}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-6 text-center">
                        <span className="text-xs font-bold text-muted-foreground">
                          ₦{item.price}
                        </span>
                      </td>

                      {/* Quantity with Stepper */}
                      <td className="py-6 text-center">
                        <div className="inline-flex items-center justify-center">
                          <div className="flex items-center border border-border/60 rounded h-9 w-20 overflow-hidden bg-background">
                            {/* Quantity Number */}
                            <span className="flex-1 text-center text-xs font-bold text-foreground">
                              {item.quantity}
                            </span>
                            {/* Vertical Stepper Buttons */}
                            <div className="flex flex-col border-l border-border/60 h-full w-7 divide-y divide-border/60">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="flex items-center justify-center hover:bg-muted text-[10px] font-bold flex-1 text-foreground"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="flex items-center justify-center hover:bg-muted text-[10px] font-bold flex-1 text-foreground"
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Subtotal */}
                      <td className="py-6 text-right pr-4">
                        <span className="text-xs font-bold text-foreground">
                          ₦{item.price * item.quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Coupon and Update Buttons */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 pt-2">
              <form onSubmit={handleApplyCoupon} className="flex gap-2.5 max-w-md w-full">
                <input
                  type="text"
                  placeholder="COUPON CODE"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="border border-border/60 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider bg-background focus:outline-none focus:ring-1 focus:ring-[#ae8877] flex-1 rounded-sm"
                />
                <button
                  type="submit"
                  className="bg-transparent hover:bg-foreground/5 text-foreground border border-foreground/30 px-6 py-2.5 text-[9px] font-extrabold uppercase tracking-widest transition-colors rounded-sm shrink-0"
                >
                  {appliedCoupon ? "Applied ✓" : "Apply Coupon"}
                </button>
              </form>

              <button
                onClick={handleUpdateCart}
                className="bg-[#111129] hover:bg-[#1e1e4a] text-white px-8 py-3 text-[9px] font-extrabold uppercase tracking-widest transition-colors rounded-sm shadow-sm md:self-auto self-end"
              >
                {updateSuccess ? "Cart Updated ✓" : "Update Cart"}
              </button>
            </div>

            {/* Cart Totals aligned to the right */}
            <div className="flex justify-end pt-12">
              <div className="w-full max-w-sm space-y-6">
                <div className="space-y-3.5 border-b border-border/20 pb-5">
                  {/* Subtotal row */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold uppercase tracking-wider text-muted-foreground/80">Subtotal</span>
                    <span className="font-bold text-foreground">₦{getCartTotal()}</span>
                  </div>

                  {/* Total row */}
                  <div className="flex justify-between items-center pt-2.5 border-t border-border/10">
                    <span className="font-bold uppercase tracking-wider text-foreground">Total</span>
                    <span className="text-sm font-extrabold text-foreground">₦{getCartTotal()}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <Link
                  href="/checkout"
                  className="block w-full bg-[#111129] hover:bg-[#1e1e4a] text-white text-[10px] font-extrabold uppercase tracking-widest py-4 rounded-sm shadow-md transition-colors text-center no-underline"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
