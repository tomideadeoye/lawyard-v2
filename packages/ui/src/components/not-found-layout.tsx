'use client'

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Home, HelpCircle } from "lucide-react"
import { Button } from "./button"
import { cn } from "../lib/utils"

interface NotFoundLayoutProps {
  badgeText?: string
  title?: string
  description?: string
  primaryActionText?: string
  primaryActionUrl?: string
  secondaryActionText?: string
  secondaryActionUrl?: string
}

export default function NotFoundLayout({
  badgeText = "404 Error",
  title = "This page could not be found.",
  description = "The path you followed does not exist or has been relocated. Let's get you back on course.",
  primaryActionText = "Return Home",
  primaryActionUrl = "/",
  secondaryActionText = "Go Back",
  secondaryActionUrl,
}: NotFoundLayoutProps) {
  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      window.history.back()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 py-24 text-center relative overflow-hidden bg-background">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[200px] h-[200px] rounded-full bg-accent/5 dark:bg-accent/10 blur-2xl pointer-events-none" />

      <div className="max-w-xl w-full space-y-8 relative z-10">
        {/* Stylized Badge */}
        {badgeText && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/25">
            <HelpCircle className="h-3.5 w-3.5" /> {badgeText}
          </div>
        )}

        {/* Big Giant 404 Header */}
        <div className="relative select-none">
          <h1 className="text-[120px] sm:text-[150px] font-black leading-none tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground/30 dark:from-white dark:to-zinc-800">
            404
          </h1>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          {secondaryActionUrl ? (
            <Link
              href={secondaryActionUrl}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-border hover:bg-muted text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> {secondaryActionText}
            </Link>
          ) : (
            <button
              onClick={handleGoBack}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-border hover:bg-muted text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> {secondaryActionText}
            </button>
          )}
          
          <Link
            href={primaryActionUrl}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" /> {primaryActionText}
          </Link>
        </div>
      </div>
    </div>
  )
}
