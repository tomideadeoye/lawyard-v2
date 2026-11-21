import specialtiesData from '@/data/specialties.json';

// Firms store practice areas as free text in `chambers.focus` ("Corporate,
// Energy & Dispute Resolution") while the rest of the directory filters on the
// `specialties` taxonomy. This module is the single place that reconciles the
// two, so a firm page can turn its tagline into real, linkable areas without
// waiting for the owner to re-enter anything.
//
// The parser is intentionally conservative: a token that does not resolve to a
// taxonomy area is dropped rather than shown as a fake area. Owners who want a
// custom label can still write one into the description.

export interface PracticeArea {
  id: string;
  name: string;
  slug: string;
}

export const PRACTICE_AREAS: PracticeArea[] = specialtiesData as PracticeArea[];

const bySlug = new Map(PRACTICE_AREAS.map((a) => [a.slug, a]));

function norm(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const byNormalisedName = new Map(PRACTICE_AREAS.map((a) => [norm(a.name), a]));

// Shorthand firms actually type, mapped to canonical ids. The ids here must
// exist in the `specialties` table — both junction tables point at it — and are
// kept in step with data/specialties.json.
const ALIASES: Record<string, string> = {
  corporate: 'corporate-law',
  company: 'corporate-law',
  commercial: 'commercial-law',
  business: 'commercial-law',
  energy: 'energy-law',
  'oil and gas': 'energy-law',
  power: 'energy-law',
  'dispute resolution': 'dispute-resolution-law',
  disputes: 'dispute-resolution-law',
  litigation: 'litigation-law',
  arbitration: 'mediation-arbitration',
  mediation: 'mediation-arbitration',
  adr: 'mediation-arbitration',
  banking: 'banking-finance',
  finance: 'banking-finance',
  'banking and finance': 'banking-finance',
  capital: 'capital-markets',
  'capital market': 'capital-markets',
  construction: 'construction-law',
  criminal: 'criminal-law',
  crime: 'criminal-law',
  family: 'family-law',
  divorce: 'divorce-law',
  immigration: 'immigration-law',
  injury: 'injury-law',
  'personal injury': 'injury-law',
  ip: 'intellectual-property',
  'intellectual property': 'intellectual-property',
  maritime: 'maritime-law',
  shipping: 'maritime-law',
  'real estate': 'real-estate-law',
  property: 'real-estate-law',
  regulatory: 'regulatory-compliance',
  compliance: 'regulatory-compliance',
  privacy: 'privacy-data-protection',
  'data protection': 'privacy-data-protection',
  'project finance': 'project-finance',
  fintech: 'fintech',
  tax: 'taxation-law',
  taxation: 'taxation-law',
};

/** Resolve one free-text token to a taxonomy area, or null if it is not one. */
export function resolvePracticeArea(raw: string): PracticeArea | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const direct = bySlug.get(trimmed.toLowerCase());
  if (direct) return direct;

  const normalised = norm(trimmed);
  const exact = byNormalisedName.get(normalised);
  if (exact) return exact;

  const bare = normalised.replace(/\s+law$/, '');
  const aliasSlug = ALIASES[bare] ?? ALIASES[normalised];
  if (aliasSlug) return bySlug.get(aliasSlug) ?? null;

  return null;
}

/**
 * Turn a `focus` line into taxonomy areas.
 * "Corporate, Energy & Dispute Resolution" → Corporate Law, Energy Law,
 * Dispute Resolution Law.
 */
export function derivePracticeAreas(focus: string | null | undefined): PracticeArea[] {
  if (!focus) return [];

  const seen = new Set<string>();
  const areas: PracticeArea[] = [];

  for (const token of focus.split(/\s*(?:,|&|;|\||\/|\band\b)\s*/i)) {
    const area = resolvePracticeArea(token);
    if (area && !seen.has(area.slug)) {
      seen.add(area.slug);
      areas.push(area);
    }
  }

  return areas;
}
