import siteConfig from '@/config/site-config.json';

export const CONTACT_INFO = siteConfig.contact;

/**
 * Canonical product vocabulary — the single source of truth for user-facing
 * role/entity terms (Lawyer / Client / Law Firm). Import from here; never
 * hardcode the labels. To rename a term site-wide, edit `terms` in
 * config/site-config.json only.
 */
export const TERMS = siteConfig.terms;

export type ProductTerm = keyof typeof TERMS;
