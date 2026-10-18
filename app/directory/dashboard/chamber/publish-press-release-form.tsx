'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { publishPressRelease } from '@/app/directory/actions/press-releases'

const inputClass =
  'w-full mt-1 px-3 py-2 rounded-lg bg-muted/20 border border-border/40 text-sm focus:outline-none focus:ring-1 focus:ring-[#a77c5c]'

export default function PublishPressReleaseForm({ chamberId }: { chamberId: string }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setDone(false)
    const fd = new FormData()
    fd.set('chamber_id', chamberId)
    fd.set('title', title)
    fd.set('content', content)
    fd.set('excerpt', excerpt)
    const res = await publishPressRelease(fd)
    setPending(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setDone(true)
    setTitle('')
    setContent('')
    setExcerpt('')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-2xl">
      <div>
        <label className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">Headline</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} placeholder="e.g. Firm advises on ₦50bn IPO" />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">Announcement</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={6} className={`${inputClass} resize-y`} placeholder="Write the announcement body…" />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">Summary (optional)</label>
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={`${inputClass} resize-y`} />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {done && <p className="text-xs text-emerald-600">Submitted for editorial review.</p>}

      <button type="submit" disabled={pending} className="px-6 py-2.5 rounded-lg bg-[#a77c5c] hover:bg-[#906b4e] disabled:opacity-50 text-white text-xs font-bold transition-colors">
        {pending ? 'Submitting…' : 'Submit for review'}
      </button>
    </form>
  )
}
