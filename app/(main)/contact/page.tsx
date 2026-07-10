'use client'

import * as React from 'react'
import { submitContact } from './actions'
import { CONTACT_INFO } from '@/lib/constants'

function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function MapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

export default function ContactPage() {
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    const result = await submitContact(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setSent(true)
      form.reset()
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="mb-16">
        <h1 className="text-4xl font-black mb-3">Contact Us</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Have a question, tip, or inquiry? Get in touch with the Lawyard team.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        <div className="md:col-span-2">
          {sent ? (
            <div className="bg-muted/30 border border-border/20 rounded-xl p-10 text-center">
              <MailIcon className="h-12 w-12 mx-auto mb-4 text-[#a77c5c]" />
              <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
              <p className="text-muted-foreground">
                Thank you for reaching out. We&apos;ll get back to you as soon as possible.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm text-[#a77c5c] hover:underline font-semibold"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border/40 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#a77c5c]/40 focus:border-[#a77c5c]/60 transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border/40 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#a77c5c]/40 focus:border-[#a77c5c]/60 transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Subject
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-border/40 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#a77c5c]/40 focus:border-[#a77c5c]/60 transition-all"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-border/40 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#a77c5c]/40 focus:border-[#a77c5c]/60 transition-all resize-y"
                  placeholder="Write your message here..."
                />
              </div>

              {error && (
                <p className="text-destructive text-sm font-medium">{error}</p>
              )}

              <button
                type="submit"
                className="bg-[#111129] hover:bg-[#1e1e4a] text-white font-extrabold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all shadow-md"
              >
                Send Message
              </button>
            </form>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-4">Get In Touch</h3>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <MailIcon className="h-5 w-5 text-[#a77c5c] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Email</p>
                  <a href={`mailto:${CONTACT_INFO.email}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">
                    {CONTACT_INFO.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PhoneIcon className="h-5 w-5 text-[#a77c5c] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Phone / WhatsApp</p>
                  <a href={`tel:${CONTACT_INFO.phoneRaw}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">
                    {CONTACT_INFO.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-5 w-5 text-[#a77c5c] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {CONTACT_INFO.location}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/20 pt-8">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-4">Corporate Posts</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Interested in publishing on Lawyard? Submit your press release or article through our Corporate Posts program.
            </p>
            <a
              href="/corporate-posts"
              className="text-sm text-[#a77c5c] hover:underline font-semibold no-underline"
            >
              Learn more →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
