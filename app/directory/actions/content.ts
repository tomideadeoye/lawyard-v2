'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function publishArticle(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const excerpt = formData.get('excerpt') as string || content.substring(0, 160).replace(/<[^>]*>/g, '') + '...';
  const featured_image = formData.get('featured_image') as string || null;

  let categories: string[] = ['documentation'];
  try {
    const raw = formData.get('category');
    if (raw) categories = JSON.parse(raw as string);
  } catch {}

  const { error } = await supabase
    .from('articles')
    .insert([{
      title,
      slug,
      content,
      excerpt,
      category: categories,
      featured_image,
      author_id: user.id,
      status: 'published',
    }]);

  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath(`/lawyer/${user.id}`);
  redirect('/dashboard');
}

export async function publishPodcast(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const title = formData.get('title') as string;
  const media_url = formData.get('media_url') as string;
  const media_type = formData.get('media_type') as string;
  const description = formData.get('description') as string;

  let categories: string[] = ['documentation'];
  try {
    const raw = formData.get('category');
    if (raw) categories = JSON.parse(raw as string);
  } catch {}

  const { error } = await supabase
    .from('podcasts')
    .insert([{
      title, 
      slug: title.toLowerCase().replace(/ /g, '-'),
      media_url, 
      media_type, 
      description, 
      category: categories,
      author_id: user.id, 
      status: 'published'
    }]);

  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath(`/lawyer/${user.id}`);
  redirect('/dashboard');
}