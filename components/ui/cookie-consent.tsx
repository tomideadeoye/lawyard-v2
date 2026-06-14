'use client'

import * as React from "react"
import { Cookie, X, Check, Shield } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export default function CookieConsent() {
  const [isVisible, setIsVisible] = React.useState(false)
  const [showPreferences, setShowPreferences] = React.useState(false)
  const [preferences, setPreferences] = React.useState({
    necessary: true,
    analytics: true,
    marketing: false,
  })

  React.useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("lawyard-cookie-consent")
    if (!consent) {
      // Show banner with a slight delay
      const timer = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    const consentSettings = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem("lawyard-cookie-consent", JSON.stringify(consentSettings))
    setIsVisible(false)
  }

  const handleDeclineAll = () => {
    const consentSettings = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem("lawyard-cookie-consent", JSON.stringify(consentSettings))
    setIsVisible(false)
  }

  const handleSavePreferences = () => {
    const consentSettings = {
      ...preferences,
      necessary: true, // Always true
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem("lawyard-cookie-consent", JSON.stringify(consentSettings))
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div 
      className={cn(
        "fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50",
        "bg-background/95 dark:bg-zinc-950/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-xl p-6",
        "animate-in slide-in-from-bottom-5 duration-500 ease-out"
      )}
      role="dialog"
      aria-describedby="cookie-consent-desc"
      aria-labelledby="cookie-consent-title"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
          <Cookie className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 id="cookie-consent-title" className="font-semibold text-foreground text-base">
              Cookie Preferences
            </h3>
            <button
              onClick={handleDeclineAll}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
              aria-label="Close cookie banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p id="cookie-consent-desc" className="text-muted-foreground text-xs leading-relaxed mt-2">
            We use cookies to optimize site features, analyze traffic, and personalize your experience. Choose what metadata you allow us to process.
          </p>

          {showPreferences ? (
            <div className="mt-4 space-y-3 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-emerald-500" /> Necessary
                  </label>
                  <p className="text-[10px] text-muted-foreground">Required for the website core features.</p>
                </div>
                <div className="flex items-center justify-center h-5 w-8 rounded-full bg-emerald-500/10 text-emerald-500">
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <label htmlFor="analytics-cookies" className="text-xs font-medium text-foreground">
                    Analytics & Performance
                  </label>
                  <p className="text-[10px] text-muted-foreground">Helps us understand user interactions and performance.</p>
                </div>
                <input
                  id="analytics-cookies"
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <label htmlFor="marketing-cookies" className="text-xs font-medium text-foreground">
                    Marketing & Personalization
                  </label>
                  <p className="text-[10px] text-muted-foreground">Tailor promotional insights and spotlit content to you.</p>
                </div>
                <input
                  id="marketing-cookies"
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary/30"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowPreferences(false)}
                  className="text-xs flex-1 h-8"
                >
                  Back
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSavePreferences}
                  className="text-xs flex-1 h-8"
                >
                  Save Choices
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 mt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreferences(true)}
                className="text-xs justify-center flex-1 h-8 border-border"
              >
                Preferences
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDeclineAll}
                className="text-xs justify-center flex-1 h-8"
              >
                Decline
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="text-xs justify-center flex-1 h-8 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground"
              >
                Accept All
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
