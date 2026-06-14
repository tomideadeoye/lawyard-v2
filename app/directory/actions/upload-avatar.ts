'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function uploadAvatar(formData: FormData) {
  const file = formData.get('avatar') as File;
  if (!file || file.size === 0) {
    return { error: 'No file provided' };
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { error: 'File must be an image' };
  }

  // Validate size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File is too large (max 5MB)' };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'Not authenticated' };
  }

  // Create unique filename using user ID
  const fileExtension = file.name.split('.').pop();
  const filePath = `${user.id}-${Date.now()}.${fileExtension}`;

  // Convert File to Buffer to fix Next.js fetch serialization issues
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, buffer, { 
      contentType: file.type,
      upsert: true 
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return { error: `Failed to upload image: ${uploadError.message}` };
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const avatarUrl = publicUrlData.publicUrl;

  // Save to profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id);

  if (profileError) {
    console.error('Profile update error:', profileError);
    return { error: 'Failed to save avatar URL to database' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');

  return { success: true, avatarUrl };
}
