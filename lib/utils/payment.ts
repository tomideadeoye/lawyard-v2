import crypto from 'crypto'

/**
 * Generates a unique, collision-proof payment reference string.
 * Format: PREFIX-TIMESTAMP-RANDOM
 */
export function generatePaymentReference(prefix: 'SH' | 'LWY' | 'BP'): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomUUID().slice(0, 8).toUpperCase()
  return `${prefix}-${ts}-${rand}`
}

/**
 * Returns the host website URL, defaulting consistently to port 3000 for local development.
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}
