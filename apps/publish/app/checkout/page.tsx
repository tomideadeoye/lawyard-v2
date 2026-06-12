'use client'

import * as React from "react"
import Link from "next/link"
import { useCart } from "@/components/CartContext"
import { createClient } from "@/lib/supabase/client"
import { initializeShopPayment } from "@/app/actions/shop"

export default function CheckoutPage() {
  const { cart, getCartTotal, clearCart } = useCart()
  const [user, setUser] = React.useState<any>(null)
  const [loadingUser, setLoadingUser] = React.useState(true)
  
  // Form States
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [country, setCountry] = React.useState("Nigeria")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [agree, setAgree] = React.useState(false)

  // Status message states
  const [status, setStatus] = React.useState<{ error?: string; success?: boolean }>({})
  const [submitting, setSubmitting] = React.useState(false)

  // Coupon States
  const [showCoupon, setShowCoupon] = React.useState(false)
  const [couponCode, setCouponCode] = React.useState("")
  const [couponStatus, setCouponStatus] = React.useState("")

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    if (couponCode.trim() === "") return
    setCouponStatus(`Coupon "${couponCode.toUpperCase()}" applied successfully!`)
  }

  const supabase = createClient()

  React.useEffect(() => {
    async function checkUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          setEmail(session.user.email || "")
        }
      } catch (err) {
        console.error("Failed checking auth session:", err)
      } finally {
        setLoadingUser(false)
      }
    }
    checkUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agree) {
      setStatus({ error: "You must agree to the website terms and conditions." })
      return
    }

    if (cart.length === 0) {
      setStatus({ error: "Your cart is empty. Add legislations to checkout." })
      return
    }

    setSubmitting(true)
    setStatus({})

    const billingData = {
      firstName,
      lastName,
      country,
      phone,
      email,
      notes,
    }

    const cartItems = cart.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
    }))

    try {
      const res = await initializeShopPayment(billingData, cartItems)
      if (res.error) {
        setStatus({ error: res.error })
      } else if (res.authorization_url) {
        // Redirect to Paystack
        window.location.href = res.authorization_url
      } else {
        setStatus({ error: "Failed to initialize payment transaction. Please try again." })
      }
    } catch (err) {
      console.error("Payment initialization error:", err)
      setStatus({ error: "An unexpected error occurred. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  // Loader state
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center py-24">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Checking authentication...</span>
      </div>
    )
  }

  const loginRedirectUrl = `http://localhost:3000/login?next=${encodeURIComponent("http://localhost:3002/checkout")}`

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Upper Navigation / Sorting Bar */}
      <div className="border-b border-border/40 py-6 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-2">
            <Link href="/shop" className="hover:text-foreground transition-colors no-underline">
              Shop
            </Link>
            <span>/</span>
            <span className="text-foreground font-bold">Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight text-center mb-12">
          Checkout
        </h1>

        {!user ? (
          /* Login Notice for Guests */
          <div className="max-w-xl mx-auto bg-amber-500/10 border border-amber-500/20 rounded-lg p-8 text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-xl">
              🔑
            </div>
            <h3 className="text-lg font-bold">Authentication Required</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Transactions must be linked to a Lawyard profile. Returning customer?{" "}
              <a 
                href={loginRedirectUrl} 
                className="text-primary hover:underline font-bold decoration-1"
              >
                Click here to login
              </a>
              .
            </p>
            <div className="pt-2">
              <a 
                href={loginRedirectUrl} 
                className="bg-[#111129] hover:bg-[#1e1e4a] text-white font-extrabold text-xs uppercase tracking-widest px-8 py-3 rounded shadow-md transition-colors inline-block no-underline"
              >
                Sign In / Sign Up
              </a>
            </div>
          </div>
        ) : (
          /* Checkout Billing and Summary Flow */
          <div className="space-y-12 animate-in fade-in duration-300">
            {/* Coupon Code Section */}
            <div className="text-center text-xs sm:text-sm text-foreground/80 font-medium pb-2 border-b border-border/10 max-w-xl mx-auto">
              Have a coupon?{" "}
              <button
                type="button"
                onClick={() => setShowCoupon(!showCoupon)}
                className="font-semibold text-foreground underline hover:text-[#ae8877] transition-colors cursor-pointer"
              >
                Click here to enter your code
              </button>

              {showCoupon && (
                <div className="w-full max-w-md mx-auto mt-6 border border-border/80 rounded bg-background overflow-hidden flex items-center p-1.5 focus-within:ring-2 focus-within:ring-[#ae8877]/30 transition-all duration-200">
                  <input
                    type="text"
                    placeholder="COUPON CODE"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-wider focus:outline-none placeholder-muted-foreground/50 text-foreground"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-transparent hover:text-[#ae8877] text-[10px] font-black uppercase tracking-widest px-4 py-2 border-l border-border/80 transition-colors shrink-0 text-foreground"
                  >
                    Apply Coupon
                  </button>
                </div>
              )}
              {couponStatus && (
                <p className="text-[10px] text-green-600 dark:text-green-400 font-bold mt-3 text-center animate-in fade-in duration-200">
                  {couponStatus}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: Billing Details (spans 7 tracks) */}
            <div className="lg:col-span-7 space-y-10">
              <h2 className="text-xl font-bold font-serif border-b border-border/30 pb-3 uppercase tracking-wider">
                Billing details
              </h2>

              {status.error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold p-4 rounded-md">
                  {status.error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* First Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-extrabold text-muted-foreground/80 uppercase tracking-wider">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-border px-4 py-2.5 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-[#111129] dark:focus:ring-white text-zinc-900 dark:text-white"
                  />
                </div>

                {/* Last Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-extrabold text-muted-foreground/80 uppercase tracking-wider">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-border px-4 py-2.5 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-[#111129] dark:focus:ring-white text-zinc-900 dark:text-white"
                  />
                </div>

                {/* Country / Region */}
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-[10px] font-extrabold text-muted-foreground/80 uppercase tracking-wider">
                    Country / Region <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-border px-4 py-2.5 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-[#111129] dark:focus:ring-white text-zinc-900 dark:text-white"
                  >
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Kenya">Kenya</option>
                    <option value="South Africa">South Africa</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                  </select>
                </div>

                {/* Phone / WhatsApp */}
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-[10px] font-extrabold text-muted-foreground/80 uppercase tracking-wider">
                    Phone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="tel" 
                    required 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +234..."
                    className="w-full bg-white dark:bg-zinc-950 border border-border px-4 py-2.5 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-[#111129] dark:focus:ring-white text-zinc-900 dark:text-white"
                  />
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-[10px] font-extrabold text-muted-foreground/80 uppercase tracking-wider">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-border px-4 py-2.5 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-[#111129] dark:focus:ring-white text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Additional Information / Order Notes */}
              <div className="space-y-4 pt-4">
                <h3 className="text-base font-bold font-serif uppercase tracking-wider">
                  Additional information
                </h3>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-extrabold text-muted-foreground/80 uppercase tracking-wider">
                    Order notes (optional)
                  </label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes about your order, e.g. special notes for delivery."
                    rows={4}
                    className="w-full bg-white dark:bg-zinc-950 border border-border px-4 py-2.5 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-[#111129] dark:focus:ring-white text-zinc-900 dark:text-white resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary (spans 5 tracks) */}
            <div className="lg:col-span-5 bg-muted/20 border border-border/30 rounded-lg p-6 sm:p-8 space-y-8">
              <h2 className="text-lg font-bold font-serif border-b border-border/30 pb-3 uppercase tracking-wider">
                Your order
              </h2>

              <div className="divide-y divide-border/20 text-sm">
                {/* Header row */}
                <div className="flex justify-between items-center font-bold pb-3 uppercase tracking-wider text-[11px] text-muted-foreground">
                  <span>Product</span>
                  <span>Subtotal</span>
                </div>

                {/* Cart Items */}
                {cart.length === 0 ? (
                  <div className="py-4 text-muted-foreground text-xs text-center">
                    No items in cart.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-start py-4 gap-4">
                      <span className="font-medium text-xs leading-snug">
                        {item.title} <strong className="text-primary font-black ml-1">× {item.quantity}</strong>
                      </span>
                      <span className="font-bold shrink-0">
                        ₦{item.price * item.quantity}
                      </span>
                    </div>
                  ))
                )}

                {/* Subtotal row */}
                <div className="flex justify-between items-center py-4 text-xs font-bold uppercase tracking-wider">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₦{getCartTotal()}</span>
                </div>

                {/* Total row */}
                <div className="flex justify-between items-center py-4 text-sm font-black uppercase tracking-widest text-[#a77c5c] border-t-2 border-border/40">
                  <span>Total</span>
                  <span>₦{getCartTotal()}</span>
                </div>
              </div>

              {/* Payment Methods info */}
              <div className="bg-background/40 border border-border/20 rounded-md p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-bold text-xs uppercase tracking-wider text-primary">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full" />
                    <span>Debit/Credit Cards</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="https://www.lawyard.org/wp-content/plugins/woo-paystack/assets/images/paystack-wc.png" 
                    alt="Paystack payment methods" 
                    className="h-5 object-contain"
                  />
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Make payment using your debit and credit cards safely with Paystack.
                </p>
              </div>

              {/* Terms Checkbox */}
              <div className="space-y-4">
                <p className="text-muted-foreground text-[10px] leading-relaxed">
                  Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our{" "}
                  <Link href="/privacy" className="text-primary underline decoration-1">
                    privacy policy
                  </Link>
                  .
                </p>

                <label className="flex items-start gap-3 text-xs font-semibold text-foreground cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-0.5 rounded border-border text-[#111129] focus:ring-[#111129]"
                  />
                  <span>
                    I have read and agree to the website{" "}
                    <Link href="/terms" className="text-primary underline decoration-1 uppercase font-bold text-[10px] tracking-wide">
                      terms and conditions
                    </Link>{" "}
                    *
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || cart.length === 0}
                  className="w-full bg-[#111129] hover:bg-[#1e1e4a] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-widest py-4 rounded-sm shadow-md transition-colors"
                >
                  {submitting ? "Processing order..." : "Place order"}
                </button>
              </div>
            </div>

          </form>
        </div>
      )}
      </div>
    </div>
  )
}
