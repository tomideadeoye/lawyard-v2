'use client'

import * as React from "react"
import { subscribeToNewsletter } from "@/app/actions/newsletter"

export default function NewsletterBanner() {
  const [status, setStatus] = React.useState<{ success?: boolean; message?: string; error?: string }>({})
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setStatus({})

    const formData = new FormData(e.currentTarget)
    try {
      const res = await subscribeToNewsletter(formData)
      setStatus(res)
      if (res.success) {
        // Clear input form
        (e.target as HTMLFormElement).reset()
      }
    } catch {
      setStatus({ error: "An unexpected error occurred. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full bg-[#f0f9ff] dark:bg-zinc-900/30 border border-sky-100/50 dark:border-zinc-800 rounded-lg p-8 sm:p-12 my-16 max-w-7xl mx-auto">
      {/* Small brown horizontal rule above the label to match the design */}
      <div className="w-12 h-0.5 bg-[#a77c5c] mb-6" />

      <span className="text-[10px] font-bold text-[#a77c5c] uppercase tracking-widest block mb-2">
        LAWYARD WEEKLY NEWSLETTER
      </span>
      <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] dark:text-white font-sans tracking-tight mb-2">
        Subscribe to Lawyard Newsletter
      </h3>
      <p className="text-muted-foreground text-sm mb-8">
        Receive a weekly brief on legal, regulatory and policy developments.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-extrabold text-muted-foreground/80 uppercase tracking-wider">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input 
            type="email" 
            required 
            name="email"
            placeholder="you@company.com" 
            className="w-full bg-white dark:bg-zinc-950 border border-border px-4 py-2.5 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-[#111129] dark:focus:ring-white text-zinc-900 dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-extrabold text-muted-foreground/80 uppercase tracking-wider">
            First Name
          </label>
          <input 
            type="text" 
            name="firstName"
            placeholder="first name" 
            className="w-full bg-white dark:bg-zinc-950 border border-border px-4 py-2.5 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-[#111129] dark:focus:ring-white text-zinc-900 dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-extrabold text-muted-foreground/80 uppercase tracking-wider">
            Last Name
          </label>
          <input 
            type="text" 
            name="lastName"
            placeholder="last name" 
            className="w-full bg-white dark:bg-zinc-950 border border-border px-4 py-2.5 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-[#111129] dark:focus:ring-white text-zinc-900 dark:text-white"
          />
        </div>

        <div className="md:col-span-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground font-medium">
              Weekly legal intelligence. Unsubscribe anytime.
            </span>
            {status.success && (
              <span className="text-[11px] font-bold text-green-600 dark:text-green-400">
                {status.message}
              </span>
            )}
            {status.error && (
              <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                {status.error}
              </span>
            )}
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#111129] hover:bg-[#1e1e4a] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-widest px-8 py-3 rounded-sm shadow-md transition-colors"
          >
            {loading ? "SUBSCRIBING..." : "SUBSCRIBE"}
          </button>
        </div>
      </form>
    </div>
  )
}
