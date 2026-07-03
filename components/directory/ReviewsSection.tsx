'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview, deleteReview } from '@/app/directory/actions/reviews'

interface Review {
  id: string
  rating: number
  title: string | null
  content: string | null
  created_at: string
  user_id: string | null
  reviewer?: { full_name: string | null }[] | { full_name: string | null } | null
}

function reviewerName(r: Review['reviewer']): string {
  if (!r) return 'Anonymous'
  if (Array.isArray(r)) return r[0]?.full_name || 'Anonymous'
  return r.full_name || 'Anonymous'
}

interface ReviewsSectionProps {
  lawyerId: string
  reviews: Review[]
  isAuthenticated: boolean
  currentUserId: string | null
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`w-8 h-8 rounded-lg text-lg transition-colors ${
            star <= value
              ? 'text-amber-400 hover:text-amber-500'
              : 'text-muted-foreground/20 hover:text-muted-foreground/40'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function ReviewsSection({ lawyerId, reviews, isAuthenticated, currentUserId }: ReviewsSectionProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) return setError('Please select a rating')
    setSubmitting(true)
    setError('')

    const fd = new FormData()
    fd.set('lawyer_id', lawyerId)
    fd.set('rating', String(rating))
    if (title) fd.set('title', title)
    if (content) fd.set('content', content)

    const result = await submitReview(fd)
    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      setSuccess(true)
      setRating(0)
      setTitle('')
      setContent('')
      setSubmitting(false)
      router.refresh()
    }
  }

  async function handleDelete() {
    const result = await deleteReview(lawyerId)
    if (!result.error) router.refresh()
  }

  const userReview = reviews.find(r => r.user_id === currentUserId)

  return (
    <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
      <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">
        Reviews ({reviews.length})
      </h2>

      {/* Existing Reviews */}
      {reviews.length > 0 ? (
        <div className="space-y-4 mb-6">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-xl border border-border/30 bg-muted/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm font-bold">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {reviewerName(review.reviewer)}
                  </span>
                </div>
                {review.user_id === currentUserId && (
                  <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                    Delete
                  </button>
                )}
              </div>
              {review.title && (
                <h3 className="text-sm font-semibold mb-1">{review.title}</h3>
              )}
              {review.content && (
                <p className="text-sm text-muted-foreground/80 leading-relaxed">{review.content}</p>
              )}
              <p className="text-[10px] text-muted-foreground/40 mt-2">
                {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/60 mb-6">No reviews yet.</p>
      )}

      {/* Review Form */}
      {isAuthenticated ? (
        userReview ? (
          <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
            <p className="text-sm text-muted-foreground">You have reviewed this lawyer.</p>
            <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300 transition-colors mt-1">
              Remove your review
            </button>
          </div>
        ) : success ? (
          <p className="text-sm text-green-500 font-medium">Review submitted. Thank you!</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 border-t border-border/20 pt-4">
            <h3 className="text-sm font-bold">Write a Review</h3>

            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-2">Rating *</label>
              <StarInput value={rating} onChange={setRating} />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                maxLength={100}
                className="w-full px-3 py-2 rounded-lg border border-border/40 bg-muted/10 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-[#a77c5c]/30"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Review</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Share your experience working with this lawyer"
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 rounded-lg border border-border/40 bg-muted/10 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-[#a77c5c]/30 resize-none"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-[#a77c5c] text-white text-sm font-bold hover:bg-[#906b4e] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>
        )
      ) : (
        <div className="p-4 rounded-xl bg-muted/20 border border-border/30 text-center">
          <p className="text-sm text-muted-foreground">Sign in to leave a review</p>
        </div>
      )}
    </section>
  );
}
