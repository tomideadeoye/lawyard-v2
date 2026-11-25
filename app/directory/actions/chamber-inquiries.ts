'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { sendThreadNotice } from '@/lib/api/email';
import { validateChamberInquiry, type ChamberInquiryInput } from '@/lib/directory/inquiries';
import { createThreadToken, validateThreadBody } from '@/lib/directory/inquiry-thread';
import {
  appendClientMessageByToken,
  authoriseFirmInquiry,
  getClientContact,
  resolveFirmRecipients,
} from '@/lib/directory/inquiry-server';

// The conversation lives here. Email only announces that it moved: no client
// address is ever put in a firm's inbox, and no message body is put in an
// email. The firm replies in the dashboard; the client replies through the
// token link that was mailed to them.

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://directory.lawyard.org').replace(/\/$/, '');
const firmInboxUrl = `${SITE}/dashboard/chamber/inquiries`;
const clientThreadUrl = (token: string) => `${SITE}/inquiry/${token}`;

export async function submitChamberInquiry(input: ChamberInquiryInput) {
  const result = validateChamberInquiry(input);
  if (!result.ok) throw new Error(result.error);
  const value = result.value;

  const supabase = await createClient();
  const { data: chamber } = await supabase
    .from('chambers')
    .select('id, name')
    .eq('id', value.chamberId)
    .maybeSingle();

  if (!chamber) throw new Error('Unknown firm.');

  // Service role: the browser must not choose the token, and the insert has to
  // return the id without the client acquiring a read grant on the table.
  const admin = createServiceRoleClient();
  const token = createThreadToken();

  const { data: inquiry, error } = await admin
    .from('chamber_inquiries')
    .insert({
      chamber_id: value.chamberId,
      name: value.name,
      email: value.email,
      phone: value.phone,
      message: value.message,
      access_token: token,
    })
    .select('id')
    .single();

  if (error || !inquiry) throw new Error('Message could not be sent. Please try again.');

  await admin.from('chamber_inquiry_messages').insert({
    inquiry_id: inquiry.id,
    sender: 'client',
    sender_name: value.name,
    body: value.message,
  });

  // Delivery is best-effort and must never fail the client's message: it is
  // already stored and visible to the firm's dashboard.
  try {
    const { recipients, unclaimed } = await resolveFirmRecipients(value.chamberId, chamber.name);

    await Promise.allSettled([
      ...recipients.map((recipient) =>
        sendThreadNotice({
          toEmail: recipient.email,
          toName: recipient.name,
          providerName: chamber.name,
          providerRole: 'firm',
          audience: 'provider',
          kind: 'new',
          threadUrl: firmInboxUrl,
          unclaimed,
        })
      ),
      sendThreadNotice({
        toEmail: value.email,
        toName: value.name,
        providerName: chamber.name,
        providerRole: 'firm',
        audience: 'client',
        kind: 'first',
        threadUrl: clientThreadUrl(token),
      }),
    ]);
  } catch (notificationError) {
    console.error('Firm inquiry notification failed:', notificationError);
  }

  return { success: true };
}

export async function replyToChamberInquiry(inquiryId: string, body: string) {
  const parsed = validateThreadBody(body);
  if (!parsed.ok) throw new Error(parsed.error);

  const authorised = await authoriseFirmInquiry(inquiryId);
  if (!authorised) throw new Error('You do not have access to this inquiry.');

  const supabase = await createClient();
  const { error } = await supabase.from('chamber_inquiry_messages').insert({
    inquiry_id: inquiryId,
    sender: 'firm',
    sender_name: authorised.chamber.name,
    body: parsed.body,
  });

  if (error) throw new Error('Reply could not be sent.');

  await supabase
    .from('chamber_inquiries')
    .update({ read: true, last_activity_at: new Date().toISOString() })
    .eq('id', inquiryId);

  try {
    const client = await getClientContact(inquiryId);
    if (client?.email && client.access_token) {
      await sendThreadNotice({
        toEmail: client.email,
        toName: client.name,
        providerName: authorised.chamber.name,
        providerRole: 'firm',
        audience: 'client',
        kind: 'reply',
        threadUrl: clientThreadUrl(client.access_token),
      });
    }
  } catch (notificationError) {
    console.error('Reply notification failed:', notificationError);
  }

  revalidatePath('/dashboard/chamber/inquiries');
  return { success: true };
}

export async function replyAsClient(token: string, body: string) {
  const result = await appendClientMessageByToken(token, body);
  if (!result.ok) throw new Error(result.error);

  try {
    const { recipients, unclaimed } = await resolveFirmRecipients(
      result.thread.chamberId,
      result.thread.firmName
    );

    await Promise.allSettled(
      recipients.map((recipient) =>
        sendThreadNotice({
          toEmail: recipient.email,
          toName: recipient.name,
          providerName: result.thread.firmName,
          providerRole: 'firm',
          audience: 'provider',
          kind: 'reply',
          threadUrl: firmInboxUrl,
          unclaimed,
        })
      )
    );
  } catch (notificationError) {
    console.error('Client reply notification failed:', notificationError);
  }

  return { success: true };
}

export async function markChamberInquiryRead(inquiryId: string) {
  const authorised = await authoriseFirmInquiry(inquiryId);
  if (!authorised) throw new Error('You do not have access to this inquiry.');

  const supabase = await createClient();
  await supabase.from('chamber_inquiries').update({ read: true }).eq('id', inquiryId);
  revalidatePath('/dashboard/chamber/inquiries');
  return { success: true };
}
