'use server';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { sendChamberInquiryNotification } from '@/lib/api/email';
import { validateChamberInquiry, type ChamberInquiryInput } from '@/lib/directory/inquiries';

// The firm page is public and a firm may have no contact details at all, so the
// inquiry is the only route a client has. It is accepted from guests: requiring
// an account here would put a signup wall in front of the one action the page
// offers. The honeypot and server-side validation are the spam gate.

interface Recipient {
  email: string;
  name: string;
}

/**
 * Where a firm inquiry is delivered.
 *
 * Prefer the firm's own address. Otherwise the people who manage the listing —
 * their login emails, which live in auth, not in profiles. If nobody manages it
 * yet (the common case for an unclaimed listing), it falls back to the Lawyard
 * inbox so a client message is never written to a table nobody reads.
 */
async function resolveRecipients(
  chamberId: string,
  firmName: string,
  firmEmail: string | null
): Promise<{ recipients: Recipient[]; fallback: boolean }> {
  if (firmEmail) return { recipients: [{ email: firmEmail, name: firmName }], fallback: false };

  const admin = createServiceRoleClient();
  const { data: admins } = await admin
    .from('chamber_admins')
    .select('user_id')
    .eq('chamber_id', chamberId);

  const recipients: Recipient[] = [];
  for (const row of admins ?? []) {
    const { data } = await admin.auth.admin.getUserById(row.user_id as string);
    const email = data?.user?.email;
    if (email) recipients.push({ email, name: firmName });
  }

  if (recipients.length > 0) return { recipients, fallback: false };

  return {
    recipients: [{ email: process.env.ADMIN_EMAIL || 'contact@lawyard.org', name: 'Lawyard Directory' }],
    fallback: true,
  };
}

export async function submitChamberInquiry(input: ChamberInquiryInput) {
  const result = validateChamberInquiry(input);
  if (!result.ok) throw new Error(result.error);
  const value = result.value;

  const supabase = await createClient();

  const { data: chamber, error: chamberError } = await supabase
    .from('chambers')
    .select('id, name, email, published_at')
    .eq('id', value.chamberId)
    .maybeSingle();

  if (chamberError || !chamber) throw new Error('Unknown firm.');

  const { error } = await supabase.from('chamber_inquiries').insert({
    chamber_id: value.chamberId,
    name: value.name,
    email: value.email,
    phone: value.phone,
    message: value.message,
  });

  if (error) throw new Error('Message could not be sent. Please try again.');

  // Delivery is best-effort: the message is already stored, and the firm's
  // dashboard reads it from there.
  try {
    const { recipients, fallback } = await resolveRecipients(
      value.chamberId,
      chamber.name,
      chamber.email ?? null
    );

    await Promise.allSettled(
      recipients.map((recipient) =>
        sendChamberInquiryNotification({
          firmEmail: recipient.email,
          firmName: recipient.name,
          clientName: value.name,
          clientEmail: value.email,
          clientPhone: value.phone ?? undefined,
          message: value.message,
          viaLawyard: fallback,
        })
      )
    );
  } catch (notificationError) {
    console.error('Firm inquiry notification failed:', notificationError);
  }

  return { success: true };
}
