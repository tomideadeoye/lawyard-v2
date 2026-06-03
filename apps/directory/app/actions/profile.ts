'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(data: { full_name: string; role: string }) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Not authenticated' };
  }

  if (!data.full_name?.trim()) {
    return { error: 'Full name is required' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: data.full_name, role: data.role })
    .eq('id', user.id);

  if (error) {
    console.error('Profile update error:', error);
    return { error: `Failed to update profile: ${error.message}` };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  
  return { success: true };
}
