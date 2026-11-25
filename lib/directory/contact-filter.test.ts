import { describe, expect, it } from 'vitest';
import { contactBlockMessage, findContactDetails } from './contact-filter';

const kinds = (text: string) => findContactDetails(text).map((f) => f.kind);

describe('findContactDetails', () => {
  it('catches a plain email address', () => {
    expect(kinds('email me at ada.obi@example.com please')).toEqual(['email']);
  });

  it('catches bracketed obfuscation', () => {
    expect(kinds('ada [at] example [dot] com')).toEqual(['email']);
    expect(kinds('ada(at)example(dot)com')).toEqual(['email']);
  });

  it('catches a local phone number however it is spaced', () => {
    expect(kinds('call 0803 123 4567')).toEqual(['phone']);
    expect(kinds('08031234567')).toEqual(['phone']);
    expect(kinds('0803-123-4567')).toEqual(['phone']);
  });

  it('catches an international number', () => {
    expect(kinds('+234 803 123 4567')).toEqual(['phone']);
    expect(kinds('+44 (0)20 7946 0958')).toEqual(['phone']);
  });

  it('catches a social handle', () => {
    expect(kinds('my handle is @adaobi_law')).toEqual(['handle']);
  });

  it('reports several kinds at once without duplicates', () => {
    expect(kinds('a@b.com or 0803 123 4567 or a@b.com')).toEqual(['email', 'phone']);
  });

  it('leaves money, citations, dates and years alone', () => {
    expect(kinds('the fee is ₦1,000,000 for the engagement')).toEqual([]);
    expect(kinds('suit no FHC/L/CS/1234/2024 was filed')).toEqual([]);
    expect(kinds('the hearing is on 12/03/2026 at 10am')).toEqual([]);
    expect(kinds('since 2026 we have handled this')).toEqual([]);
  });

  it('does not flag ordinary prose that mentions at and dot', () => {
    expect(kinds('look at the dot com bubble')).toEqual([]);
    expect(kinds('meet me at the office on Allen Avenue')).toEqual([]);
  });

  it('allows website links, which are published anyway', () => {
    expect(kinds('see https://bloomfieldlaw.com/about for the team')).toEqual([]);
  });
});

describe('contactBlockMessage', () => {
  it('names what was found', () => {
    const message = contactBlockMessage([{ kind: 'phone', sample: '0803' }]);
    expect(message).toMatch(/phone number/i);
    expect(message).toMatch(/stay on Lawyard/i);
  });

  it('lists multiple kinds readably', () => {
    const message = contactBlockMessage([
      { kind: 'email', sample: 'a@b.com' },
      { kind: 'phone', sample: '0803' },
    ]);
    expect(message).toMatch(/an email address and a phone number/i);
  });
});
