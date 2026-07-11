'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminClient } from '@/lib/supabase/admin-auth';
import { verifyLawyerAction, rejectLawyerAction, updateLawyerAction, updateArticleAction, deleteArticleAction, updatePodcastAction, deletePodcastAction } from '@/lib/admin/api';

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
  if (!id) return redirect('/admin/content');
  try {
    await deleteArticleAction(id);
  } catch (error) {
    console.error('Failed to delete article:', error);
  }
  redirect('/admin/content');
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
  if (!id) return redirect('/admin/content?tab=podcasts');
  try {
    await deletePodcastAction(id);
  } catch (error) {
    console.error('Failed to delete podcast:', error);
  }
  redirect('/admin/content?tab=podcasts');
}

export async function approveCorporatePost(formData: FormData) {
  const id = formData.get('id') as string;
  const scheduledDate = formData.get('scheduled_date') as string;
  if (!id) return;
  try {
    const { supabase } = await getAdminClient();
    const { data: article } = await supabase.from('articles').select('title, content, excerpt, featured_image, brand_name').eq('id', id).single();
    if (!article) return;

    const isScheduled = !!scheduledDate;
    const { publishCorporatePostToWordPress } = await import('@/lib/wordpress');
    try {
      await publishCorporatePostToWordPress({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt || '',
        featured_image: article.featured_image,
        status: isScheduled ? 'future' : 'publish',
        ...(isScheduled ? { date_gmt: new Date(scheduledDate).toISOString() } : {}),
      });
    } catch (wpError) {
      console.error('WordPress publish failed:', wpError);
      return;
    }

    const updates: Record<string, any> = { status: 'published', payment_status: 'paid' };
    if (scheduledDate) updates.scheduled_date = scheduledDate;
    await updateArticleAction(id, updates);

    const { sendCorporatePostApproved } = await import('@/lib/api/email');
    const { data: profile } = await supabase.from('articles').select('profiles!inner(email)').eq('id', id).single();
    if (profile) {
      const email = Array.isArray(profile.profiles) ? profile.profiles[0]?.email : (profile.profiles as any)?.email;
      if (email) sendCorporatePostApproved(email, article.brand_name || 'Corporate Post').catch(() => {});
    }

    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Failed to approve corporate post:', error);
  }
}

export async function rejectCorporatePost(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;
  try {
    await updateArticleAction(id, { status: 'archived' });

    const { sendCorporatePostRejected } = await import('@/lib/api/email');
    const { supabase } = await getAdminClient();
    const { data } = await supabase.from('articles').select('brand_name, profiles!inner(email)').eq('id', id).single();
    if (data) {
      const email = Array.isArray(data.profiles) ? data.profiles[0]?.email : (data.profiles as any)?.email;
      if (email) sendCorporatePostRejected(email, data.brand_name || 'Corporate Post').catch(() => {});
    }

    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Failed to reject corporate post:', error);
  }
}

export async function createArticle(formData: FormData) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  if (!title || !slug || !content) return;
  const { supabase, user } = await getAdminClient();
  const { error } = await supabase.from('articles').insert([{
    title, slug,
    content,
    excerpt: content.substring(0, 160) + '...',
    author_id: user.id,
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
  const { supabase, user } = await getAdminClient();
  const { error } = await supabase.from('podcasts').insert([{
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    media_url,
    media_type,
    description,
    author_id: user.id,
    status: 'draft',
  }]);
  if (error) console.error('Failed to create podcast:', error);
  revalidatePath('/', 'layout');
}

export async function createCoupon(formData: FormData) {
  const { supabase } = await getAdminClient();

  const code = (formData.get('code') as string).trim().toUpperCase();
  const discountType = formData.get('discount_type') as string;
  const discountValueRaw = formData.get('discount_value') as string;
  const frequencyDaysRaw = formData.get('frequency_days') as string;
  const maxUsesRaw = formData.get('max_uses') as string;
  const description = (formData.get('description') as string) || '';

  if (!code || !discountType) return;

  const payload: Record<string, any> = {
    code,
    discount_type: discountType,
    is_active: true,
    description,
  };

  if (discountType === 'percentage') {
    const discountValue = parseInt(discountValueRaw || '0', 10);
    if (!discountValue || discountValue <= 0 || discountValue > 100) return;
    payload.discount_value = discountValue;
  } else {
    payload.discount_value = null;
  }

  if (frequencyDaysRaw) {
    const frequencyDays = parseInt(frequencyDaysRaw, 10);
    if (frequencyDays > 0) payload.frequency_days = frequencyDays;
  }

  if (maxUsesRaw) {
    const maxUses = parseInt(maxUsesRaw, 10);
    if (maxUses > 0) payload.max_uses = maxUses;
  }

  const { error } = await supabase.from('coupons').insert([payload]);
  if (error) {
    console.error('Failed to create coupon:', error);
    return;
  }
  revalidatePath('/admin/coupons', 'layout');
}

export async function updateCouponStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const isActive = formData.get('is_active') === 'true';
  const { supabase } = await getAdminClient();

  const { error } = await supabase
    .from('coupons')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) console.error('Failed to update coupon:', error);
  revalidatePath('/admin/coupons', 'layout');
}

export async function updateCoupon(formData: FormData) {
  const { supabase } = await getAdminClient();

  const id = formData.get('id') as string;
  if (!id) return;

  const code = (formData.get('code') as string).trim().toUpperCase();
  const discountType = formData.get('discount_type') as string;
  const discountValueRaw = formData.get('discount_value') as string;
  const frequencyDaysRaw = formData.get('frequency_days') as string;
  const maxUsesRaw = formData.get('max_uses') as string;
  const description = (formData.get('description') as string) || '';

  if (!code || !discountType) return;

  const payload: Record<string, any> = {
    code,
    discount_type: discountType,
    description,
    updated_at: new Date().toISOString(),
  };

  if (discountType === 'percentage') {
    const discountValue = parseInt(discountValueRaw || '0', 10);
    if (!discountValue || discountValue <= 0 || discountValue > 100) return;
    payload.discount_value = discountValue;
  } else {
    payload.discount_value = null;
  }

  if (frequencyDaysRaw) {
    const frequencyDays = parseInt(frequencyDaysRaw, 10);
    payload.frequency_days = frequencyDays > 0 ? frequencyDays : null;
  } else {
    payload.frequency_days = null;
  }

  if (maxUsesRaw) {
    const maxUses = parseInt(maxUsesRaw, 10);
    payload.max_uses = maxUses > 0 ? maxUses : null;
  } else {
    payload.max_uses = null;
  }

  const { error } = await supabase.from('coupons').update(payload).eq('id', id);
  if (error) {
    console.error('Failed to update coupon:', error);
    return;
  }
  revalidatePath('/admin/coupons', 'layout');
}

export async function deleteCoupon(formData: FormData) {
  const id = formData.get('id') as string;
  const { supabase } = await getAdminClient();

  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', id);

  if (error) console.error('Failed to delete coupon:', error);
  revalidatePath('/admin/coupons', 'layout');
}
