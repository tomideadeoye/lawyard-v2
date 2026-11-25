import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { isThreadToken, validateThreadBody } from './inquiry-thread';

// Lawyer-side thread access, mirroring lib/directory/inquiry-server.ts.
//
// The lawyer uses their own session, so row-level security decides what they
// see. The client has no session: the token in their link is the credential,
// and the service role is used only after that token matched.

export interface LawyerThreadMessage {
  id: string;
  sender: 'client' | 'lawyer';
  sender_name: string | null;
  body: string;
  created_at: string;
}

export interface LawyerThread {
  inquiryId: string;
  lawyerId: string;
  clientName: string;
  clientEmail: string;
  lawyerName: string;
  createdAt: string;
  messages: LawyerThreadMessage[];
}

export interface Recipient {
  email: string;
  name: string;
}

export async function loadLawyerThreadByToken(token: string): Promise<LawyerThread | null> {
  if (!isThreadToken(token)) return null;

  const admin = createServiceRoleClient();
  const { data: inquiry } = await admin
    .from('lawyer_inquiries')
    .select('id, lawyer_id, name, email, created_at, lawyers(name)')
    .eq('access_token', token)
    .maybeSingle();

  if (!inquiry) return null;

  const { data: messages } = await admin
    .from('lawyer_inquiry_messages')
    .select('id, sender, sender_name, body, created_at')
    .eq('inquiry_id', inquiry.id)
    .order('created_at', { ascending: true });

  const lawyer = Array.isArray(inquiry.lawyers) ? inquiry.lawyers[0] : inquiry.lawyers;

  return {
    inquiryId: inquiry.id,
    lawyerId: inquiry.lawyer_id,
    clientName: inquiry.name,
    clientEmail: inquiry.email,
    lawyerName: (lawyer as { name?: string } | null)?.name ?? 'the lawyer',
    createdAt: inquiry.created_at,
    messages: (messages ?? []) as LawyerThreadMessage[],
  };
}

export async function appendLawyerClientMessageByToken(
  token: string,
  body: string
): Promise<{ ok: true; thread: LawyerThread } | { ok: false; error: string }> {
  const parsed = validateThreadBody(body);
  if (!parsed.ok) return parsed;

  const thread = await loadLawyerThreadByToken(token);
  if (!thread) return { ok: false, error: 'This link is no longer valid.' };

  const admin = createServiceRoleClient();
  const { error } = await admin.from('lawyer_inquiry_messages').insert({
    inquiry_id: thread.inquiryId,
    sender: 'client',
    sender_name: thread.clientName,
    body: parsed.body,
  });

  if (error) return { ok: false, error: 'Message could not be sent.' };

  await admin
    .from('lawyer_inquiries')
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

/** The client's address and thread token. Never exposed to the lawyer. */
export async function getLawyerClientContact(inquiryId: string) {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from('lawyer_inquiries')
    .select('name, email, lawyer_id, access_token')
    .eq('id', inquiryId)
    .maybeSingle();
  return data ?? null;
}

/**
 * Who to notify. The lawyer's public address, then their login email, then the
 * Lawyard inbox so an unclaimed profile cannot swallow a client message.
 */
export async function resolveLawyerRecipients(
  lawyerId: string,
  lawyerName: string
): Promise<{ recipients: Recipient[]; unclaimed: boolean }> {
  const admin = createServiceRoleClient();

  const { data: lawyer } = await admin
    .from('lawyers')
    .select('email')
    .eq('id', lawyerId)
    .maybeSingle();

  if (lawyer?.email) {
    return { recipients: [{ email: lawyer.email, name: lawyerName }], unclaimed: false };
  }

  const { data } = await admin.auth.admin.getUserById(lawyerId);
  const loginEmail = data?.user?.email;
  if (loginEmail) return { recipients: [{ email: loginEmail, name: lawyerName }], unclaimed: false };

  return {
    recipients: [
      { email: process.env.ADMIN_EMAIL || 'contact@lawyard.org', name: 'Lawyard Directory' },
    ],
    unclaimed: true,
  };
}

/** Authorise a lawyer against one of their inquiries. */
export async function authoriseLawyerInquiry(inquiryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: inquiry } = await supabase
    .from('lawyer_inquiries')
    .select('id, lawyer_id, name, read')
    .eq('id', inquiryId)
    .eq('lawyer_id', user.id)
    .maybeSingle();

  if (!inquiry) return null;

  const { data: lawyer } = await supabase
    .from('lawyers')
    .select('id, name')
    .eq('id', user.id)
    .maybeSingle();

  return { user, inquiry, lawyerName: lawyer?.name ?? 'Your profile' };
}
