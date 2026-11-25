// Validation for an inquiry, kept out of the server actions so it can be tested
// without a database. A provider page is public, so the only trustworthy check
// is this one.

export interface InquiryFields {
  name: string;
  email: string;
  phone?: string;
  message: string;
  /** Honeypot. Real people never fill this in. */
  company?: string;
}

export interface InquiryFieldsValue {
  name: string;
  email: string;
  phone: string | null;
  message: string;
}

export interface ChamberInquiryInput extends InquiryFields {
  chamberId: string;
}

export interface ChamberInquiryValue extends InquiryFieldsValue {
  chamberId: string;
}

export type InquiryResult<T> = { ok: true; value: T } | { ok: false; error: string };

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LIMITS = {
  name: 120,
  email: 200,
  phone: 40,
  message: 2000,
} as const;

const clean = (value?: string | null) => (value ?? '').trim();

/** Name, address and message. Shared by firm and lawyer inquiries. */
export function validateInquiryFields(input: InquiryFields): InquiryResult<InquiryFieldsValue> {
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

  return { ok: true, value: { name, email, phone: phone || null, message } };
}

export function validateChamberInquiry(
  input: ChamberInquiryInput
): InquiryResult<ChamberInquiryValue> {
  const chamberId = clean(input.chamberId);
  if (!UUID.test(chamberId)) return { ok: false, error: 'Unknown firm.' };

  const fields = validateInquiryFields(input);
  if (!fields.ok) return fields;

  return { ok: true, value: { ...fields.value, chamberId } };
}
