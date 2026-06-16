'use server';

import { createClient } from '@/lib/supabase/server';

export async function uploadListingImage(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file || file.size === 0) return { error: 'No file provided' };
  if (!file.type.startsWith('image/')) return { error: 'File must be an image' };
  if (file.size > 2 * 1024 * 1024) return { error: 'File is too large (max 2MB)' };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Not authenticated' };

  const ext = file.name.split('.').pop();
  const filePath = `${user.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('listings')
    .upload(filePath, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  const { data: { publicUrl } } = supabase.storage
    .from('listings')
    .getPublicUrl(filePath);

  return { success: true, url: publicUrl };
}
