'use server';

import { createClient } from '@/lib/supabase/server';
import { sendInquiryNotification } from '@/lib/api/email';

interface InquiryInput {
  lawyerId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export async function submitInquiry(input: InquiryInput) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('lawyer_inquiries')
    .insert({
      lawyer_id: input.lawyerId,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      message: input.message,
    });

  if (error) throw new Error(error.message);

  // Notify the lawyer via email
  try {
    const { data: lawyer } = await supabase
      .from('lawyers')
      .select('name, email')
      .eq('id', input.lawyerId)
      .single();

    if (lawyer?.email) {
      sendInquiryNotification({
        lawyerEmail: lawyer.email,
        lawyerName: lawyer.name,
        clientName: input.name,
        clientEmail: input.email,
        clientPhone: input.phone,
        message: input.message,
      }).catch(() => {});
    }
  } catch {
    // notification is best-effort
  }

  return { success: true };
}

export async function getInquiries() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('lawyer_inquiries')
    .select('*')
    .eq('lawyer_id', user.id)
    .order('created_at', { ascending: false });

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
    .select('*, lawyer:lawyers(name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return { error: error.message };
  return { data: data ?? [] };
}
