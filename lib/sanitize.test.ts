import { describe, it, expect } from 'vitest'
import { sanitizeRichHtml, stripHtml, excerptFromHtml } from '@/lib/sanitize'

// A Corporate Post rendered its own HTML as visible text because the detail
// page escaped the body instead of rendering it. Fixing that made submitted
// HTML live: these are the cases that must stay safe and readable.

describe('sanitizeRichHtml', () => {
  it('keeps the markup the editor produces', () => {
    const html = '<p>Hello <strong>world</strong></p><h2>Title</h2><ul><li>One</li></ul>'
    expect(sanitizeRichHtml(html)).toBe(html)
  })

  it('drops scripts, styles and inline handlers', () => {
    const out = sanitizeRichHtml(
      '<p onclick="steal()">Hi</p><script>alert(1)</script><style>p{}</style>'
    )
    expect(out).toBe('<p>Hi</p>')
  })

  it('rejects javascript: and data: URLs but keeps https and mailto', () => {
    const out = sanitizeRichHtml(
      '<a href="javascript:alert(1)">x</a>' +
        '<a href="data:text/html;base64,PHN2Zz4=">y</a>' +
        '<a href="https://kredete.io/">z</a>' +
        '<a href="mailto:press@kredete.io">w</a>'
    )
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('data:')
    expect(out).toContain('https://kredete.io/')
    expect(out).toContain('mailto:press@kredete.io')
  })

  it('hardens outgoing links', () => {
    const out = sanitizeRichHtml('<a href="https://example.com">x</a>')
    expect(out).toContain('rel="noopener noreferrer nofollow"')
    expect(out).toContain('target="_blank"')
  })

  it('removes the empty paragraphs the editor leaves behind', () => {
    expect(sanitizeRichHtml('<p>One</p><p></p><p> </p><p>Two</p>')).toBe('<p>One</p><p>Two</p>')
  })

  it('keeps an image-only paragraph', () => {
    const out = sanitizeRichHtml('<p><img src="https://example.com/a.png" alt="a"></p>')
    expect(out).toContain('<img')
  })

  it('treats missing content as empty, not "undefined"', () => {
    expect(sanitizeRichHtml(null)).toBe('')
    expect(sanitizeRichHtml(undefined)).toBe('')
  })
})

describe('stripHtml', () => {
  it('turns the body into readable text', () => {
    expect(stripHtml('<p><a href="https://kredete.io/">Kredete</a>, a platform.</p>')).toBe(
      'Kredete, a platform.'
    )
  })

  it('leaves plain text alone', () => {
    expect(stripHtml('A quiet announcement.')).toBe('A quiet announcement.')
  })

  it('keeps a space where a block boundary was', () => {
    expect(stripHtml('<p>One.</p><p>Two.</p>')).toBe('One. Two.')
    expect(stripHtml('<p>Line<br>break</p>')).toBe('Line break')
  })
})

describe('excerptFromHtml', () => {
  it('cuts on a word boundary and marks the cut', () => {
    const out = excerptFromHtml('<p>The quick brown fox jumps over the lazy dog again and again</p>', 30)
    expect(out.endsWith('…')).toBe(true)
    expect(out.length).toBeLessThanOrEqual(31)
    expect(out).not.toContain('<')
  })

  it('returns short bodies whole', () => {
    expect(excerptFromHtml('<p>Short.</p>', 30)).toBe('Short.')
  })
})
