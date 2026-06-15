import { getAdminClient } from '@/lib/supabase/admin-auth';

export interface Subscriber {
  id: string;
  email: string;
  active: boolean;
  created_at: string;
}

export async function getSubscribers() {
  const { supabase } = await getAdminClient();
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subscribers:', error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function toggleSubscriberStatus(id: string, active: boolean) {
  const { supabase } = await getAdminClient();
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ active })
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
}
