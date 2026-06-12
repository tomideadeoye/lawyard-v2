'use server';

import { toggleSubscriberStatus as toggleStatus, getSubscribers } from '../../../lib/subscribers';
import { revalidatePath } from 'next/cache';

export async function sendNewsletter(formData: FormData) {
  const subject = formData.get('subject') as string;
  const html = formData.get('html') as string;
  if (!subject || !html) return { error: 'Missing subject or body' };

  const { sendNewsletter: send } = await import('@repo/api/email');
  const result = await getSubscribers();
  const activeSubscribers = (result.data || []).filter((s: any) => s.active).map((s: any) => s.email);

  if (activeSubscribers.length === 0) return { error: 'No active subscribers' };

  const { sent, failed } = await send(activeSubscribers, subject, html);
  return { success: true, sent, failed };
}

export async function toggleSubscriberStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const active = formData.get('active') === 'true';

  try {
    await toggleStatus(id, !active);
    revalidatePath('/subscribers');
  } catch (error) {
    console.error('Error toggling subscriber status:', error);
  }
}

export async function exportSubscribersToCSV() {
  const result = await getSubscribers();
  const subscribers = result.data || [];
  
  const headers = ['Email', 'Subscribed Date', 'Status'];
  const rows = subscribers.map(sub => [
    sub.email,
    new Date(sub.created_at).toLocaleDateString(),
    sub.active ? 'Active' : 'Inactive'
  ]);
  
  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  
  return { success: true, csv: csvContent };
}
