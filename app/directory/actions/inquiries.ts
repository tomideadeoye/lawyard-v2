'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { sendThreadNotice } from '@/lib/api/email';
import { UUID, validateInquiryFields } from '@/lib/directory/inquiries';
import { createThreadToken, validateThreadBody } from '@/lib/directory/inquiry-thread';
import { guardContactDetails } from '@/lib/directory/contact-guard';
import {
  appendLawyerClientMessageByToken,
  authoriseLawyerInquiry,
  getLawyerClientContact,
  resolveLawyerRecipients,
} from '@/lib/directory/lawyer-inquiry-server';

// Lawyer inquiries follow the same rule as firm ones: the notification is a
// pointer, the reply happens on Lawyard, and the client comes back through a
// token link instead of handing the lawyer their address.

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://directory.lawyard.org').replace(/\/$/, '');
const lawyerInboxUrl = `${SITE}/dashboard/inquiries`;
const clientThreadUrl = (token: string) => `${SITE}/inquiry/${token}`;

interface InquiryInput {
  lawyerId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  company?: string;
}

export async function submitInquiry(input: InquiryInput) {
  const lawyerId = (input.lawyerId ?? '').trim();
  if (!UUID.test(lawyerId)) throw new Error('Unknown lawyer.');

  const fields = validateInquiryFields(input);
  if (!fields.ok) throw new Error(fields.error);
  const value = fields.value;

  await guardContactDetails(value.message, { surface: 'lawyer', direction: 'client' });

  const supabase = await createClient();
  const { data: lawyer } = await supabase
    .from('lawyers')
    .select('id, name')
    .eq('id', lawyerId)
    .maybeSingle();

  if (!lawyer) throw new Error('Unknown lawyer.');

  const admin = createServiceRoleClient();
  const token = createThreadToken();

  const { data: inquiry, error } = await admin
    .from('lawyer_inquiries')
    .insert({
      lawyer_id: lawyerId,
      name: value.name,
      email: value.email,
      phone: value.phone,
      message: value.message,
      access_token: token,
    })
    .select('id')
    .single();

  if (error || !inquiry) throw new Error('Message could not be sent. Please try again.');

  await admin.from('lawyer_inquiry_messages').insert({
    inquiry_id: inquiry.id,
    sender: 'client',
    sender_name: value.name,
    body: value.message,
  });

  try {
    const { recipients, unclaimed } = await resolveLawyerRecipients(lawyerId, lawyer.name);

    await Promise.allSettled([
      ...recipients.map((recipient) =>
        sendThreadNotice({
          toEmail: recipient.email,
          toName: recipient.name,
          providerName: lawyer.name,
          providerRole: 'lawyer',
          audience: 'provider',
          kind: 'new',
          threadUrl: lawyerInboxUrl,
          unclaimed,
        })
      ),
      sendThreadNotice({
        toEmail: value.email,
        toName: value.name,
        providerName: lawyer.name,
        providerRole: 'lawyer',
        audience: 'client',
        kind: 'first',
        threadUrl: clientThreadUrl(token),
      }),
    ]);
  } catch (notificationError) {
    console.error('Lawyer inquiry notification failed:', notificationError);
  }

  return { success: true };
}

export async function replyToInquiry(inquiryId: string, body: string) {
  const parsed = validateThreadBody(body);
  if (!parsed.ok) throw new Error(parsed.error);

  await guardContactDetails(parsed.body, {
    surface: 'lawyer',
    direction: 'provider',
    inquiryId,
  });

  const authorised = await authoriseLawyerInquiry(inquiryId);
  if (!authorised) throw new Error('You do not have access to this inquiry.');

  const supabase = await createClient();
  const { error } = await supabase.from('lawyer_inquiry_messages').insert({
    inquiry_id: inquiryId,
    sender: 'lawyer',
    sender_name: authorised.lawyerName,
    body: parsed.body,
  });

  if (error) throw new Error('Reply could not be sent.');

  await supabase
    .from('lawyer_inquiries')
    .update({ read: true, last_activity_at: new Date().toISOString() })
    .eq('id', inquiryId);

  try {
    const client = await getLawyerClientContact(inquiryId);
    if (client?.email && client.access_token) {
      await sendThreadNotice({
        toEmail: client.email,
        toName: client.name,
        providerName: authorised.lawyerName,
        providerRole: 'lawyer',
        audience: 'client',
        kind: 'reply',
        threadUrl: clientThreadUrl(client.access_token),
      });
    }
  } catch (notificationError) {
    console.error('Lawyer reply notification failed:', notificationError);
  }

  revalidatePath('/dashboard/inquiries');
  return { success: true };
}

export async function replyAsLawyerClient(token: string, body: string) {
  await guardContactDetails(body, { surface: 'lawyer', direction: 'client' });
  const result = await appendLawyerClientMessageByToken(token, body);
  if (!result.ok) throw new Error(result.error);

  try {
    const { recipients, unclaimed } = await resolveLawyerRecipients(
      result.thread.lawyerId,
      result.thread.lawyerName
    );

    await Promise.allSettled(
      recipients.map((recipient) =>
        sendThreadNotice({
          toEmail: recipient.email,
          toName: recipient.name,
          providerName: result.thread.lawyerName,
          providerRole: 'lawyer',
          audience: 'provider',
          kind: 'reply',
          threadUrl: lawyerInboxUrl,
          unclaimed,
        })
      )
    );
  } catch (notificationError) {
    console.error('Client reply notification failed:', notificationError);
  }

  return { success: true };
}

export async function getInquiries() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Not authenticated' };

  // Explicit columns: email and phone are not in the authenticated grant.
  const { data, error } = await supabase
    .from('lawyer_inquiries')
    .select(
      'id, name, read, created_at, last_activity_at, lawyer_inquiry_messages(id, sender, sender_name, body, created_at)'
    )
    .eq('lawyer_id', user.id)
    .order('last_activity_at', { ascending: false });

  if (error) return { error: error.message };
  return { data: data ?? [] };
}

export async function getInquiryStats() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('lawyer_inquiries')
    .select('id, read')
    .eq('lawyer_id', user.id);

  if (error) return { error: error.message };

  const total = data?.length ?? 0;
  const unread = data?.filter((i) => !i.read).length ?? 0;
  return { total, unread };
}

export async function markInquiryRead(inquiryId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('lawyer_inquiries')
    .update({ read: true })
    .eq('id', inquiryId)
    .eq('lawyer_id', user.id);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getAllInquiriesAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return { error: 'Not authorized' };

  const { data, error } = await supabase
    .from('lawyer_inquiries')
    .select('id, lawyer_id, name, message, read, created_at, lawyer:lawyers(name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return { error: error.message };
  return { data: data ?? [] };
}
