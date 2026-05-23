'use server';

import { toggleSubscriberStatus as toggleStatus, getSubscribers } from '../../../lib/subscribers';
import { revalidatePath } from 'next/cache';

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
