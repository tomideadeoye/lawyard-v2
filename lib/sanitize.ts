import sanitizeHtml from 'sanitize-html'

// Editor output is stored as HTML and rendered with dangerouslySetInnerHTML.
// The allowlist matches what the TipTap editor (StarterKit + Link + Image) can
// actually produce — anything else is a submission we did not intend to accept.

const ALLOWED_TAGS = [
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'mark', 'code', 'pre',
  'blockquote', 'span',
  'h1', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li',
  'a', 'img',
]

const ALLOWED_ATTRIBUTES = {
  // `target` / `rel` are not accepted from submissions — they are set below —
  // but they must be allowlisted or sanitize-html strips them back off.
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
}

/** Clean submitted rich text before it is stored. */
export function sanitizeRichHtml(html: string | null | undefined): string {
  return sanitizeHtml(String(html ?? ''), {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    // The editor leaves `<p></p>` behind after a deletion; they render as
    // blank gaps at the top and bottom of a post.
    exclusiveFilter: (frame) =>
      frame.tag === 'p' && !frame.text.trim() && frame.mediaChildren.length === 0,
    transformTags: {
      // Submitted links open in a new tab, without handing the opener over.
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer nofollow' },
      }),
    },
  }).trim()
}

/** Tags, entities and excess whitespace out — for excerpts and previews. */
export function stripHtml(html: string | null | undefined): string {
  const spaced = String(html ?? '')
    // Block boundaries are newlines for a reader, not zero-width: without this
    // "…acquisition.</p><p><strong>Compliance" becomes "acquisition.Compliance".
    .replace(/<\/?(?:p|div|br|h[1-6]|li|ul|ol|dl|dt|dd|blockquote|pre|hr|tr|td)\b[^>]*>/gi, ' ')
  return sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * A plain-text excerpt from a rich-text body, cut on a word boundary.
 * Legacy rows stored the raw HTML in `excerpt`, so this is also the read-side
 * guard for those.
 */
export function excerptFromHtml(html: string | null | undefined, limit = 160): string {
  const text = stripHtml(html)
  if (text.length <= limit) return text
  const cut = text.slice(0, limit)
  const boundary = cut.lastIndexOf(' ')
  return `${(boundary > limit * 0.6 ? cut.slice(0, boundary) : cut).replace(/[,;:.\s]+$/, '')}…`
}
