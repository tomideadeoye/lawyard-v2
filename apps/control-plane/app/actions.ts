'use server'

import { revalidatePath } from 'next/cache';
import { verifyLawyerAction, rejectLawyerAction, updateLawyerAction, updateArticleAction, deleteArticleAction, updatePodcastAction, deletePodcastAction } from '../lib/api';

export async function verifyLawyer(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;
  try {
    await verifyLawyerAction(id);
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Failed to verify lawyer:', error);
  }
}

export async function rejectLawyer(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;
  try {
    await rejectLawyerAction(id);
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Failed to reject lawyer:', error);
  }
}

export async function updateLawyer(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;
  const name = formData.get('name') as string;
  const role = formData.get('role') as string;
  const location = formData.get('location') as string;
  try {
    await updateLawyerAction(id, { name, role, location });
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Failed to update lawyer:', error);
  }
}

export async function toggleArticleStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  if (!id || !status) return;
  try {
    await updateArticleAction(id, { status });
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Failed to toggle article status:', error);
  }
}

export async function deleteArticle(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;
  try {
    await deleteArticleAction(id);
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Failed to delete article:', error);
  }
}

export async function togglePodcastStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  if (!id || !status) return;
  try {
    await updatePodcastAction(id, { status });
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Failed to toggle podcast status:', error);
  }
}

export async function deletePodcast(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;
  try {
    await deletePodcastAction(id);
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Failed to delete podcast:', error);
  }
}

export async function createArticle(formData: FormData) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  if (!title || !slug || !content) return;
  const supabase = (await import('../lib/supabase/admin')).createAdminClient();
  const { error } = await supabase.from('articles').insert([{
    title, slug,
    content,
    excerpt: content.substring(0, 160) + '...',
    author_id: '00000000-0000-0000-0000-000000000000',
    status: 'draft',
  }]);
  if (error) console.error('Failed to create article:', error);
  revalidatePath('/', 'layout');
}

export async function createPodcast(formData: FormData) {
  const title = formData.get('title') as string;
  const media_url = formData.get('media_url') as string;
  const media_type = formData.get('media_type') as string || 'audio';
  const description = formData.get('description') as string || '';
  if (!title || !media_url) return;
  const supabase = (await import('../lib/supabase/admin')).createAdminClient();
  const { error } = await supabase.from('podcasts').insert([{
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    media_url,
    media_type,
    description,
    author_id: '00000000-0000-0000-0000-000000000000',
    status: 'draft',
  }]);
  if (error) console.error('Failed to create podcast:', error);
  revalidatePath('/', 'layout');
}
