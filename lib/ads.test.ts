import { describe, it, expect } from 'vitest'
import {
  isAdLive,
  safeDestination,
  pickAd,
  isAdPlacement,
  summariseAdEvents,
  ctr,
  adClickPath,
} from '@/lib/ads'

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

describe('summariseAdEvents', () => {
  it('adds daily rows into a window per creative', () => {
    const totals = summariseAdEvents([
      { ad_id: 'a', kind: 'impression', count: 10 },
      { ad_id: 'a', kind: 'impression', count: 5 },
      { ad_id: 'a', kind: 'click', count: 2 },
      { ad_id: 'b', kind: 'click', count: 1 },
    ])
    expect(totals.get('a')).toEqual({ impressions: 15, clicks: 2 })
    expect(totals.get('b')).toEqual({ impressions: 0, clicks: 1 })
  })

  it('keeps a click that has no recorded impression', () => {
    // A beacon that never fired must not erase the click: the advertiser was owed it.
    const totals = summariseAdEvents([{ ad_id: 'a', kind: 'click', count: 3 }])
    expect(totals.get('a')?.clicks).toBe(3)
  })
})

describe('ctr', () => {
  it('formats a rate from real numbers', () => {
    expect(ctr({ impressions: 1000, clicks: 31 })).toBe('3.1%')
  })

  it('shows a dash rather than dividing by zero', () => {
    expect(ctr({ impressions: 0, clicks: 0 })).toBe('—')
    expect(ctr(undefined)).toBe('—')
  })
})

describe('adClickPath', () => {
  it('routes the click through our counter', () => {
    expect(adClickPath('c1f4a3d2-0000-4000-8000-000000000000')).toBe(
      '/ads/click/c1f4a3d2-0000-4000-8000-000000000000'
    )
  })
})
