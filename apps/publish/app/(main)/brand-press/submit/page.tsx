'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitBrandPress } from '@/app/actions/brand-press'
import config from '@/lib/brand-press.json'

export default function SubmitBrandPressPage() {
  const router = useRouter()
  const [selectedTier, setSelectedTier] = useState('core')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('tier', selectedTier)

    const result = await submitBrandPress(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if ('authorization_url' in result && result.authorization_url) {
      window.location.href = result.authorization_url
    } else if ('success' in result && result.success) {
      router.push('/brand-press/success')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      <div className="mb-12">
        <h1 className="text-4xl font-black mb-3">Submit a Brand Press</h1>
        <p className="text-muted-foreground text-lg">
          Get your brand announcement published on Lawyard — Nigeria&apos;s leading legal media platform.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Article Details */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold border-b border-border pb-3">Article Details</h2>

          <div>
            <label htmlFor="title" className="block text-sm font-bold mb-1.5">Post Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g. ABC Corp Announces Landmark Partnership"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-bold mb-1.5">Post Summary</label>
            <textarea
              id="excerpt"
              name="excerpt"
              maxLength={160}
              placeholder="Brief summary of your announcement (160 characters max)"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[80px] resize-y"
            />
            <p className="text-xs text-muted-foreground mt-1">Max 160 characters</p>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-bold mb-1.5">Post Body *</label>
            <textarea
              id="content"
              name="content"
              required
              placeholder="Write your full announcement here..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent min-h-[300px] resize-y font-mono text-sm"
            />
          </div>

          <div>
            <label htmlFor="featured_image" className="block text-sm font-bold mb-1.5">Featured Image URL</label>
            <input
              id="featured_image"
              name="featured_image"
              type="url"
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </section>

        {/* Issuer Information */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold border-b border-border pb-3">Issuer Information</h2>

          <div>
            <label htmlFor="brand_name" className="block text-sm font-bold mb-1.5">Brand / Client Name *</label>
            <input
              id="brand_name"
              name="brand_name"
              type="text"
              required
              placeholder="The brand or company being featured"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </section>

        {/* Schedule */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold border-b border-border pb-3">Schedule</h2>

          <div>
            <label htmlFor="scheduled_date" className="block text-sm font-bold mb-1.5">Publish Date</label>
            <input
              id="scheduled_date"
              name="scheduled_date"
              type="date"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </section>

        {/* Tier Selection */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold border-b border-border pb-3">Select Tier</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {config.tiers.map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSelectedTier(tier.id)}
                className={`relative text-left p-6 rounded-xl border-2 transition-all ${
                  selectedTier === tier.id
                    ? 'border-accent bg-accent/5 shadow-lg'
                    : 'border-border bg-card hover:border-accent/50'
                }`}
              >
                {tier.recommended && (
                  <span className="absolute -top-2.5 right-4 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                    Recommended
                  </span>
                )}
                <h3 className="text-lg font-bold">{tier.name}</h3>
                <p className="text-2xl font-black mt-2">{tier.formatted_price}</p>
                <ul className="mt-4 space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-accent mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Submit'}
        </button>
      </form>
    </div>
  )
}
