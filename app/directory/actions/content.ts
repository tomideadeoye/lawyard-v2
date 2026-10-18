'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { postArticleToSlackWithButtons, postPodcastToSlackWithButtons } from '@/lib/slack';
import { validateCoupon } from '@/app/actions/validate-coupon';
import { consumePostAllowance } from '@/app/directory/actions/publishing';

export async function publishArticle(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const excerpt = formData.get('excerpt') as string || content.substring(0, 160).replace(/<[^>]*>/g, '') + '...';
  const featured_image = formData.get('featured_image') as string || null;
  const scheduled_date = formData.get('scheduled_date') as string || null;
  const couponCode = formData.get('coupon_code') as string || '';

  // Post cap (C05): a valid publishing coupon overrides the cap; otherwise the
  // tier allowance applies (free = 1 total, paid = 3/month, then paid extras).
  let couponOverride = false;
  if (couponCode) {
    const couponResult: any = await validateCoupon(couponCode, 0)
    if (!couponResult.valid) {
      return { error: 'That publishing code is not valid. Remove it to publish with your plan allowance.' }
    }
    if (!couponResult.isFree) {
      return { error: 'This coupon does not grant free publishing. Please use a valid publishing coupon.' }
    }
    couponOverride = true
  }
  if (!couponOverride) {
    const gate = await consumePostAllowance(user.id)
    if (!gate.allowed) return { error: gate.error }
  }

  let categories: string[] = ['general-practice'];
  try {
    const raw = formData.get('category');
    if (raw) categories = JSON.parse(raw as string);
  } catch {}

  const { data: article, error } = await supabase
    .from('articles')
    .insert([{
      title,
      slug,
      content,
      excerpt,
      category: categories,
      featured_image,
      author_id: user.id,
      status: 'pending_review',
      scheduled_date: scheduled_date,
      article_type: 'editorial',
    }])
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  // Get author name for Slack message
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const dateNote = scheduled_date 
    ? `\n📅 Scheduled for: ${new Date(scheduled_date).toLocaleDateString()}` 
    : '';
  await postArticleToSlackWithButtons({
    id: article.id,
    title,
    slug,
    excerpt: excerpt + dateNote,
    authorName: profile?.full_name || 'Unknown Author',
    categories,
  });

  revalidatePath('/');
  revalidatePath(`/lawyer/${user.id}`);
  return { success: true };
}

export async function publishPodcast(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Post cap (C05) — articles and podcasts share one allowance.
  const gate = await consumePostAllowance(user.id)
  if (!gate.allowed) return { error: gate.error }

  const title = formData.get('title') as string;
  const media_url = formData.get('media_url') as string;
  const media_type = formData.get('media_type') as string;
  const description = formData.get('description') as string;
  const scheduled_date = formData.get('scheduled_date') as string || null;

  let categories: string[] = ['general-practice'];
  try {
    const raw = formData.get('category');
    if (raw) categories = JSON.parse(raw as string);
  } catch {}

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const { data: podcast, error } = await supabase
    .from('podcasts')
    .insert([{
      title, 
      slug, 
      media_url, 
      media_type, 
      description, 
      category: categories,
      author_id: user.id, 
      status: 'pending_review',
      scheduled_date: scheduled_date,
    }])
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  // Get author name for Slack message
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // Post to Slack for editorial review
  const dateNote = scheduled_date 
    ? `\n📅 Scheduled for: ${new Date(scheduled_date).toLocaleDateString()}` 
    : '';
  await postPodcastToSlackWithButtons({
    id: podcast.id,
    title,
    slug,
    description: (description || '') + dateNote,
    mediaType: media_type,
    authorName: profile?.full_name || 'Unknown Author',
    categories,
  });

  revalidatePath('/');
  revalidatePath(`/lawyer/${user.id}`);
  return { success: true };
}
