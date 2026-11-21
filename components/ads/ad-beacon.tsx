'use client'

import * as React from 'react'

/**
 * Counts an impression when the creative is actually visible.
 *
 * An impression is a thing that was seen, not a thing that was rendered: a
 * banner below the fold on a page nobody scrolls should not pad the report a
 * client is paying against. IntersectionObserver decides that, and a session
 * marker keeps a reload from counting twice.
 */
export function AdBeacon({ adId, children }: { adId: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const key = `ad-impression:${adId}`
    try {
      if (window.sessionStorage.getItem(key)) return
    } catch {
      // Storage can be blocked (private mode, hardened browser) — fall through
      // and count once per page view instead.
    }

    let sent = false
    const send = () => {
      if (sent) return
      sent = true
      try {
        window.sessionStorage.setItem(key, '1')
      } catch {}

      const payload = JSON.stringify({ adId })
      if (typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon('/api/ads/impression', new Blob([payload], { type: 'application/json' }))
        return
      }
      fetch('/api/ads/impression', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            send()
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.35 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [adId])

  return <div ref={ref}>{children}</div>
}
