'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ProfileUpdateData = {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  website?: string;
  address?: string;
  about?: string;
  facebook_url?: string;
  x_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
};

export async function updateProfile(data: ProfileUpdateData) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Not authenticated' };
  }

  const updates: Record<string, string | null> = {};

  if (data.display_name !== undefined) {
    if (!data.display_name?.trim()) {
      return { error: 'Display name is required' };
    }
    updates.full_name = data.display_name.trim();
  }

  if (data.first_name !== undefined) updates.first_name = data.first_name || null;
  if (data.last_name !== undefined) updates.last_name = data.last_name || null;
  if (data.phone !== undefined) updates.phone = data.phone || null;
  if (data.website !== undefined) updates.website = data.website || null;
  if (data.address !== undefined) updates.address = data.address || null;
  if (data.about !== undefined) updates.about = data.about || null;
  if (data.facebook_url !== undefined) updates.facebook_url = data.facebook_url || null;
  if (data.x_url !== undefined) updates.x_url = data.x_url || null;
  if (data.linkedin_url !== undefined) updates.linkedin_url = data.linkedin_url || null;
  if (data.youtube_url !== undefined) updates.youtube_url = data.youtube_url || null;

  if (Object.keys(updates).length === 0) {
    return { error: 'No fields to update' };
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    console.error('Profile update error:', error);
    return { error: `Failed to update profile: ${error.message}` };
  }

  revalidatePath('/directory/dashboard', 'layout');
  revalidatePath('/directory/dashboard/settings');
  
  return { success: true };
}
