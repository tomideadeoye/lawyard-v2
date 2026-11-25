// Stops the obvious bypass: typing an address or a number into a message.
//
// This is friction, not prevention — two determined people can still meet
// elsewhere. What it does is make the sanctioned path the easy one, and leave a
// record when someone tries. Website links are deliberately allowed: a firm's
// site is published on its page by product decision, so blocking it inside a
// message would be inconsistent rather than safer.

export type ContactKind = 'email' | 'phone' | 'handle';

export interface ContactFinding {
  kind: ContactKind;
  sample: string;
}

const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

// Deliberately only bracketed obfuscation ("name [at] domain [dot] com"). The
// unbracketed form ("look at the dot com") would block ordinary sentences.
const OBFUSCATED_EMAIL =
  /\b[\w.+-]+\s*[([{]\s*(?:at|@)\s*[)\]}]?\s*[\w-]+\s*[([{]\s*dot\s*[)\]}]?\s*[a-z]{2,8}\b/gi;

const DIGIT_RUN = /\+?\d[\d\s().-]{5,}\d/g;
const HANDLE = /(^|[\s(])@[a-z0-9_]{3,30}\b/gi;

function digits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Find contact details a person is trying to share.
 *
 * Phone numbers are digit runs of 7–15 digits after punctuation is stripped, so
 * "₦1,000,000" (commas) and "FHC/L/CS/1234/2024" (letters) do not match, while
 * "0803 123 4567" and "+234-803-123-4567" do.
 */
export function findContactDetails(text: string): ContactFinding[] {
  const findings: ContactFinding[] = [];
  const push = (kind: ContactKind, sample: string) => {
    if (!findings.some((f) => f.kind === kind)) findings.push({ kind, sample: sample.trim() });
  };

  for (const match of text.matchAll(EMAIL)) push('email', match[0]);
  for (const match of text.matchAll(OBFUSCATED_EMAIL)) push('email', match[0]);

  for (const match of text.matchAll(DIGIT_RUN)) {
    const count = digits(match[0]).length;
    if (count >= 7 && count <= 15) push('phone', match[0]);
  }

  for (const match of text.matchAll(HANDLE)) {
    // Skip the local part of an address already caught above.
    const at = match[0].indexOf('@');
    const before = match[0].slice(0, at).trim();
    if (before.length > 0) continue;
    push('handle', match[0]);
  }

  return findings;
}

const NAMES: Record<ContactKind, string> = {
  email: 'an email address',
  phone: 'a phone number',
  handle: 'a social handle',
};

/** The message a person sees when their text is held back. */
export function contactBlockMessage(findings: ContactFinding[]): string {
  const kinds = [...new Set(findings.map((f) => NAMES[f.kind]))];
  const list =
    kinds.length === 1
      ? kinds[0]
      : `${kinds.slice(0, -1).join(', ')} and ${kinds[kinds.length - 1]}`;

  return `Please remove ${list}. Conversations stay on Lawyard so both sides keep a record — use this thread instead.`;
}
