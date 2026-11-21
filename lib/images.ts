/**
 * Image helpers for article covers.
 *
 * The WordPress migration produced a handful of values that are neither a URL
 * nor empty ("{}"), which render as a broken image icon. Every surface that
 * paints a cover goes through `coverUrl()` so a bad value degrades to the
 * designed placeholder instead of a broken box.
 */
export function coverUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

/** Neutral cover placeholder — a grey wash, not a photo of something unrelated. */
export const COVER_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e7e5e4"/><stop offset="1" stop-color="#d6d3d1"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/></svg>'
  );

export function coverSrc(value: unknown): string {
  return coverUrl(value) ?? COVER_PLACEHOLDER;
}
