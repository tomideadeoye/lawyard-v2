'use client'

import * as React from "react"
import { X, Mail, Sparkles, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "./button"
import { cn } from "../lib/utils"

interface NewsletterPopupProps {
  onSubscribe: (formData: FormData) => Promise<{
    success?: boolean
    message?: string
    error?: string
  }>
}

export default function NewsletterPopup({ onSubscribe }: NewsletterPopupProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState<{
    type: "idle" | "loading" | "success" | "error"
    message?: string
  }>({ type: "idle" })

  React.useEffect(() => {
    // Check if user is already subscribed or recently dismissed
    const isSubscribed = localStorage.getItem("lawyard-newsletter-subscribed")
    if (isSubscribed) return

    const dismissedTime = localStorage.getItem("lawyard-newsletter-dismissed")
    if (dismissedTime) {
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000
      const isStillCoolingDown = Date.now() - parseInt(dismissedTime, 10) < fourteenDaysMs
      if (isStillCoolingDown) return
    }

    let triggered = false

    const triggerPopup = () => {
      if (triggered) return
      triggered = true
      setIsOpen(true)
      window.removeEventListener("scroll", handleScroll)
    }

    // Trigger after 7 seconds delay
    const timer = setTimeout(triggerPopup, 7000)

    // Trigger when scrolled down 30% of page
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight <= 0) return
      
      const scrollPercent = window.scrollY / scrollHeight
      if (scrollPercent >= 0.3) {
        triggerPopup()
        clearTimeout(timer)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem("lawyard-newsletter-dismissed", Date.now().toString())
    setIsOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus({ type: "loading" })

    try {
      const formData = new FormData()
      formData.append("email", email)

      const result = await onSubscribe(formData)

      if (result.error) {
        setStatus({ type: "error", message: result.error })
      } else {
        setStatus({ type: "success", message: result.message })
        localStorage.setItem("lawyard-newsletter-subscribed", "true")
        setTimeout(() => setIsOpen(false), 2500)
      }
    } catch {
      setStatus({ type: "error", message: "Something went wrong. Please try again." })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/60 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleDismiss}
      />
      
      {/* Modal Container */}
      <div 
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-2xl border border-border/80 shadow-2xl p-8 z-10",
          "bg-background/95 dark:bg-zinc-950/95 backdrop-blur-md",
          "animate-in zoom-in-95 fade-in duration-300 ease-out"
        )}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
          aria-label="Dismiss newsletter invitation"
        >
          <X className="h-4 w-4" />
        </button>

        {status.type === "success" ? (
          <div className="flex flex-col items-center text-center py-6 animate-in zoom-in-90 duration-300">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Welcome to the inner circle!</h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-[280px]">
              {status.message || "You've successfully subscribed to Lawyard Weekly."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Lawyard Spotlight
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                Stay Ahead of the Curve
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Join thousands of legal practitioners and professionals. Get our curated weekly briefs on news, opinions, and analysis of Africa's legal landscape.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="Enter your professional email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status.type === "loading"}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-background/50 border-input placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    "transition-all duration-200"
                  )}
                />
              </div>

              {status.type === "error" && (
                <p className="text-destructive text-xs font-medium pl-1 animate-in fade-in duration-200">
                  {status.message}
                </p>
              )}

              <Button
                type="submit"
                disabled={status.type === "loading"}
                className="w-full h-10 font-medium bg-primary hover:bg-primary/95 text-primary-foreground flex items-center justify-center gap-2"
              >
                {status.type === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Subscribing...
                  </>
                ) : (
                  "Subscribe to Newsletter"
                )}
              </Button>
            </form>

            <p className="text-[10px] text-muted-foreground text-center">
              By subscribing, you agree to our privacy policy. No spam, unsubscribe anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
