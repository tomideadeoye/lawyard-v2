/**
 * Currency — NGN end-to-end (C20, 12 Sep 2026).
 * The single source of truth for money formatting on the platform.
 * Never hardcode "$" or a currency symbol in a component; use these helpers.
 */
export const CURRENCY = {
  code: 'NGN',
  symbol: '₦',
  locale: 'en-NG',
} as const

/** Parse a numeric amount from a number or a formatted string ("₦155,000" → 155000). */
export function parseAmount(value: number | string | null | undefined): number {
  if (value == null) return 0
  const n = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** Format an amount as NGN, e.g. 155000 → "₦155,000". */
export function formatNGN(value: number | string | null | undefined): string {
  return `${CURRENCY.symbol}${parseAmount(value).toLocaleString(CURRENCY.locale, {
    maximumFractionDigits: 0,
  })}`
}
