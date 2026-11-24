import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { isThreadToken, validateThreadBody } from './inquiry-thread';

// Server-side thread access.
//
// The firm side uses the caller's own session, so row-level security decides
// what it can see. The client side has no session at all: the token in its
// emailed link is the credential, and everything below the lookup runs with the
// service role. That is why the token is validated before a single query runs.

export interface ThreadMessage {
  id: string;
  sender: 'client' | 'firm';
  sender_name: string | null;
  body: string;
  created_at: string;
}

export interface Thread {
  inquiryId: string;
  chamberId: string;
  clientName: string;
  clientEmail: string;
  firmName: string;
  createdAt: string;
  messages: ThreadMessage[];
}

export interface Recipient {
  email: string;
  name: string;
}

export async function loadThreadByToken(token: string): Promise<Thread | null> {
  if (!isThreadToken(token)) return null;

  const admin = createServiceRoleClient();
  const { data: inquiry } = await admin
    .from('chamber_inquiries')
    .select('id, chamber_id, name, email, created_at, chambers(name)')
    .eq('access_token', token)
    .maybeSingle();

  if (!inquiry) return null;

  const { data: messages } = await admin
    .from('chamber_inquiry_messages')
    .select('id, sender, sender_name, body, created_at')
    .eq('inquiry_id', inquiry.id)
    .order('created_at', { ascending: true });

  const firm = Array.isArray(inquiry.chambers) ? inquiry.chambers[0] : inquiry.chambers;

  return {
    inquiryId: inquiry.id,
    chamberId: inquiry.chamber_id,
    clientName: inquiry.name,
    clientEmail: inquiry.email,
    firmName: (firm as { name?: string } | null)?.name ?? 'the firm',
    createdAt: inquiry.created_at,
    messages: (messages ?? []) as ThreadMessage[],
  };
}

/**
 * Append a message from the client, authenticated by the token in their link.
 * Returns the thread so the page can render it without a second read.
 */
export async function appendClientMessageByToken(
  token: string,
  body: string
): Promise<{ ok: true; thread: Thread } | { ok: false; error: string }> {
  const parsed = validateThreadBody(body);
  if (!parsed.ok) return parsed;

  const thread = await loadThreadByToken(token);
  if (!thread) return { ok: false, error: 'This link is no longer valid.' };

  const admin = createServiceRoleClient();
  const { error } = await admin.from('chamber_inquiry_messages').insert({
    inquiry_id: thread.inquiryId,
    sender: 'client',
    sender_name: thread.clientName,
    body: parsed.body,
  });

  if (error) return { ok: false, error: 'Message could not be sent.' };

  await admin
    .from('chamber_inquiries')
    .update({ last_activity_at: new Date().toISOString(), read: false })
    .eq('id', thread.inquiryId);

  return {
    ok: true,
    thread: {
      ...thread,
      messages: [
        ...thread.messages,
        {
          id: `local-${Date.now()}`,
          sender: 'client',
          sender_name: thread.clientName,
          body: parsed.body,
          created_at: new Date().toISOString(),
        },
      ],
    },
  };
}

/** The client's address and thread token for an inquiry. Never exposed to the firm. */
export async function getClientContact(inquiryId: string) {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from('chamber_inquiries')
    .select('name, email, chamber_id, access_token')
    .eq('id', inquiryId)
    .maybeSingle();
  return data ?? null;
}

/**
 * Who to notify about a firm thread.
 *
 * The firm's own address first. Otherwise the login emails of the people who
 * manage it. If nobody manages it, the Lawyard inbox — an unclaimed listing
 * must not swallow a client message.
 */
export async function resolveFirmRecipients(
  chamberId: string,
  firmName: string
): Promise<{ recipients: Recipient[]; unclaimed: boolean }> {
  const admin = createServiceRoleClient();

  const { data: chamber } = await admin
    .from('chambers')
    .select('email')
    .eq('id', chamberId)
    .maybeSingle();

  if (chamber?.email) {
    return { recipients: [{ email: chamber.email, name: firmName }], unclaimed: false };
  }

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

  if (recipients.length > 0) return { recipients, unclaimed: false };

  return {
    recipients: [
      { email: process.env.ADMIN_EMAIL || 'contact@lawyard.org', name: 'Lawyard Directory' },
    ],
    unclaimed: true,
  };
}

/**
 * Authorise a firm user against an inquiry.
 *
 * Returns the chamber when the caller owns it or is one of its admins; null
 * otherwise. Used before any service-role read of client contact details.
 */
export async function authoriseFirmInquiry(inquiryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: inquiry } = await supabase
    .from('chamber_inquiries')
    .select('id, chamber_id, name, read')
    .eq('id', inquiryId)
    .maybeSingle();

  if (!inquiry) return null;

  const { data: owned } = await supabase
    .from('chambers')
    .select('id, name, user_id')
    .eq('id', inquiry.chamber_id)
    .maybeSingle();

  if (owned?.user_id === user.id) {
    return { user, inquiry, chamber: owned };
  }

  const { data: adminRow } = await supabase
    .from('chamber_admins')
    .select('chamber_id')
    .eq('chamber_id', inquiry.chamber_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRow) return null;

  const { data: chamber } = await supabase
    .from('chambers')
    .select('id, name, user_id')
    .eq('id', inquiry.chamber_id)
    .maybeSingle();

  if (!chamber) return null;
  return { user, inquiry, chamber };
}
