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
