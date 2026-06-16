'use server';

import { createClient } from '@/lib/supabase/server';

export async function uploadArticleImage(formData: FormData) {
  const file = formData.get('image') as File;
  if (!file || file.size === 0) {
    return { error: 'No file provided' };
  }

  if (!file.type.startsWith('image/')) {
    return { error: 'File must be an image' };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: 'File is too large (max 2MB)' };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated' };
  }

  const fileExtension = file.name.split('.').pop();
  const filePath = `articles/${user.id}-${Date.now()}.${fileExtension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('article-images')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { error: `Failed to upload image: ${uploadError.message}` };
  }

  const { data: publicUrlData } = supabase.storage
    .from('article-images')
    .getPublicUrl(filePath);

  return { success: true, imageUrl: publicUrlData.publicUrl };
}
