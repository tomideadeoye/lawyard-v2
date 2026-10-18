'use server';

import { createClient } from '@/lib/supabase/server';
import { canUseIntroVideo } from '@/lib/directory/publishing';

const MAX_BYTES = 25 * 1024 * 1024; // ~1 minute

export async function uploadIntroVideo(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file || file.size === 0) return { error: 'No file provided' };
  if (!file.type.startsWith('video/')) return { error: 'File must be a video' };
  if (file.size > MAX_BYTES) return { error: 'Video must be under 25MB (about 1 minute)' };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle();

  if (!canUseIntroVideo(profile?.subscription_tier)) {
    return { error: 'Intro videos are a premium feature. Upgrade to add one.' };
  }

  const ext = file.name.split('.').pop() || 'mp4';
  const filePath = `${user.id}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('intro-videos')
    .upload(filePath, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return { error: `Failed to upload video: ${uploadError.message}` };

  const { data: publicUrlData } = supabase.storage.from('intro-videos').getPublicUrl(filePath);
  return { success: true, url: publicUrlData.publicUrl };
}
