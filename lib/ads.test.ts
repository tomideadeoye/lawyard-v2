import { describe, it, expect } from 'vitest'
import { isAdLive, safeDestination, pickAd, isAdPlacement } from '@/lib/ads'

// Ads are money and they are third-party destinations rendered as clickable
// images on a public page. These are the cases that cost either revenue or
// trust: an expired booking still serving, a paid booking hidden by a malformed
// date, and a destination that is not a URL.

describe('isAdLive', () => {
  const now = new Date('2026-11-21T12:00:00Z')

  it('serves a row with no flight window', () => {
    expect(isAdLive({ is_active: true, starts_at: null, ends_at: null }, now)).toBe(true)
  })

  it('waits for its start', () => {
    expect(isAdLive({ is_active: true, starts_at: '2026-11-22T00:00:00Z', ends_at: null }, now)).toBe(false)
    expect(isAdLive({ is_active: true, starts_at: '2026-11-20T00:00:00Z', ends_at: null }, now)).toBe(true)
  })

  it('stops at its end', () => {
    expect(isAdLive({ is_active: true, starts_at: null, ends_at: '2026-11-21T11:59:59Z' }, now)).toBe(false)
    expect(isAdLive({ is_active: true, starts_at: null, ends_at: '2026-11-21T12:00:01Z' }, now)).toBe(true)
  })

  it('never serves an inactive row, even inside its window', () => {
    expect(isAdLive({ is_active: false, starts_at: null, ends_at: null }, now)).toBe(false)
  })

  it('does not hide a paid booking behind a malformed end date', () => {
    expect(isAdLive({ is_active: true, starts_at: null, ends_at: 'not-a-date' }, now)).toBe(true)
  })
})

describe('safeDestination', () => {
  it('keeps absolute http(s) links', () => {
    expect(safeDestination('https://lpstore.lawpavilion.com/texts-and-journals/416')).toBe(
      'https://lpstore.lawpavilion.com/texts-and-journals/416'
    )
  })

  it('keeps site-relative links', () => {
    expect(safeDestination('/contact')).toBe('/contact')
  })

  it('refuses script and data URLs', () => {
    expect(safeDestination('javascript:alert(1)')).toBeNull()
    expect(safeDestination('data:text/html;base64,PHN2Zz4=')).toBeNull()
  })

  it('refuses junk and empty values', () => {
    expect(safeDestination('')).toBeNull()
    expect(safeDestination(null)).toBeNull()
    expect(safeDestination('{}')).toBeNull()
  })
})

describe('pickAd', () => {
  const older = { id: 'a', weight: 0, created_at: '2026-11-01T00:00:00Z' }
  const heavier = { id: 'b', weight: 10, created_at: '2026-10-01T00:00:00Z' }
  const newer = { id: 'c', weight: 0, created_at: '2026-11-20T00:00:00Z' }

  it('returns nothing for an empty placement', () => {
    expect(pickAd([])).toBeNull()
  })

  it('prefers the heaviest booking', () => {
    expect(pickAd([older, heavier, newer])?.id).toBe('b')
  })

  it('breaks a weight tie with the newest booking', () => {
    expect(pickAd([older, newer])?.id).toBe('c')
  })
})

describe('isAdPlacement', () => {
  it('accepts the four known placements', () => {
    for (const p of ['article-before', 'article-after', 'footer-banner', 'sidebar']) {
      expect(isAdPlacement(p)).toBe(true)
    }
  })

  it('rejects anything else', () => {
    expect(isAdPlacement('article-middle')).toBe(false)
    expect(isAdPlacement(undefined)).toBe(false)
  })
})
