/**
 * The category a person picks on `/add-listing` is the only place they are asked
 * what they are. That answer decides their role once, at account creation —
 * instead of a second, conflicting question on the signup form, and instead of a
 * form submission silently rewriting the account type months later.
 *
 * A law firm applicant is a lawyer who also owns a firm: "firm" is a membership,
 * not a profile role (C22).
 */

export type ProfileRole = 'lawyer' | 'client'

export const LISTING_CATEGORIES = ['lawyer', 'chamber', 'corporate', 'need'] as const
export type ListingCategory = (typeof LISTING_CATEGORIES)[number]

const ROLE_BY_CATEGORY: Record<ListingCategory, ProfileRole> = {
  lawyer: 'lawyer',
  chamber: 'lawyer',
  corporate: 'client',
  need: 'client',
}

/** Unknown or missing category falls back to the least privileged role. */
export function roleForCategory(category?: string | null): ProfileRole {
  if (!category) return 'client'
  return ROLE_BY_CATEGORY[category as ListingCategory] ?? 'client'
}

export function isListingCategory(value: string): value is ListingCategory {
  return (LISTING_CATEGORIES as readonly string[]).includes(value)
}
