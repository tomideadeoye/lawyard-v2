// Validation for a firm inquiry, kept out of the server action so it can be
// tested without a database. The browser checks nothing: a firm page is public
// and the endpoint has no session, so the only trustworthy check is this one.

export interface ChamberInquiryInput {
  chamberId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  /** Honeypot. Real people never fill this in. */
  company?: string;
}

export interface ChamberInquiryValue {
  chamberId: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
}

export type ChamberInquiryResult =
  | { ok: true; value: ChamberInquiryValue }
  | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LIMITS = {
  name: 120,
  email: 200,
  phone: 40,
  message: 2000,
} as const;

const clean = (value?: string | null) => (value ?? '').trim();

export function validateChamberInquiry(input: ChamberInquiryInput): ChamberInquiryResult {
  const chamberId = clean(input.chamberId);
  if (!UUID.test(chamberId)) return { ok: false, error: 'Unknown firm.' };

  // Silently accept bot submissions without writing them, so the sender learns
  // nothing about the filter.
  if (clean(input.company)) return { ok: false, error: 'Message could not be sent.' };

  const name = clean(input.name);
  if (name.length < 2) return { ok: false, error: 'Please enter your name.' };
  if (name.length > LIMITS.name) return { ok: false, error: 'That name is too long.' };

  const email = clean(input.email);
  if (!EMAIL.test(email)) return { ok: false, error: 'Please enter a valid email address.' };
  if (email.length > LIMITS.email) return { ok: false, error: 'That email is too long.' };

  const phone = clean(input.phone);
  if (phone.length > LIMITS.phone) return { ok: false, error: 'That phone number is too long.' };

  const message = clean(input.message);
  if (message.length < 10) {
    return { ok: false, error: 'Please describe what you need in a sentence or two.' };
  }
  if (message.length > LIMITS.message) {
    return { ok: false, error: `Please keep the message under ${LIMITS.message} characters.` };
  }

  return {
    ok: true,
    value: { chamberId, name, email, phone: phone || null, message },
  };
}
