import { describe, expect, it } from 'vitest';
import { derivePracticeAreas, resolvePracticeArea } from './practice-areas';

describe('resolvePracticeArea', () => {
  it('matches a taxonomy name exactly, including its "Law" suffix', () => {
    expect(resolvePracticeArea('Corporate Law')?.id).toBe('corporate-law');
    expect(resolvePracticeArea('Banking & Finance')?.id).toBe('banking-finance');
    expect(resolvePracticeArea('Banking and Finance')?.id).toBe('banking-finance');
  });

  it('matches an id', () => {
    expect(resolvePracticeArea('privacy-data-protection')?.id).toBe('privacy-data-protection');
  });

  it('resolves slugs that older links still use', () => {
    // These were in data/specialties.json before it was aligned with the table.
    expect(resolvePracticeArea('banking-and-finance')?.id).toBe('banking-finance');
    expect(resolvePracticeArea('mediation-and-arbitration')?.id).toBe('mediation-arbitration');
    expect(resolvePracticeArea('privacy-and-data-protection')?.id).toBe('privacy-data-protection');
  });

  it('matches firm shorthand through the alias table', () => {
    expect(resolvePracticeArea('Corporate')?.id).toBe('corporate-law');
    expect(resolvePracticeArea('Energy')?.id).toBe('energy-law');
    expect(resolvePracticeArea('Dispute Resolution')?.id).toBe('dispute-resolution-law');
    expect(resolvePracticeArea('ADR')?.id).toBe('mediation-arbitration');
    expect(resolvePracticeArea('Oil & Gas')?.id).toBe('energy-law');
    expect(resolvePracticeArea('Tax')?.id).toBe('taxation-law');
    expect(resolvePracticeArea('IP')?.id).toBe('intellectual-property');
  });

  it('returns null rather than inventing an area', () => {
    expect(resolvePracticeArea('Space Law')).toBeNull();
    expect(resolvePracticeArea('')).toBeNull();
    expect(resolvePracticeArea('   ')).toBeNull();
  });
});

describe('derivePracticeAreas', () => {
  it('turns a real focus line into three areas', () => {
    const areas = derivePracticeAreas('Corporate, Energy & Dispute Resolution');
    expect(areas.map((a) => a.id)).toEqual([
      'corporate-law',
      'energy-law',
      'dispute-resolution-law',
    ]);
  });

  it('dedupes when two tokens resolve to the same area', () => {
    const areas = derivePracticeAreas('Banking & Finance, Finance');
    expect(areas.map((a) => a.id)).toEqual(['banking-finance']);
  });

  it('handles separators other firms actually use', () => {
    expect(derivePracticeAreas('Litigation | Tax').map((a) => a.id)).toEqual([
      'litigation-law',
      'taxation-law',
    ]);
    expect(derivePracticeAreas('Real Estate / Property').map((a) => a.id)).toEqual([
      'real-estate-law',
    ]);
  });

  it('returns an empty list for missing or unparseable focus', () => {
    expect(derivePracticeAreas(null)).toEqual([]);
    expect(derivePracticeAreas(undefined)).toEqual([]);
    expect(derivePracticeAreas('')).toEqual([]);
    expect(derivePracticeAreas('General Practice')).toEqual([]);
  });
});
