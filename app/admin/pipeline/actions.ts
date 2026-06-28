'use server';

import { revalidatePath } from 'next/cache';
import { getAdminClient } from '@/lib/supabase/admin-auth';
import { updateArticleAction, updatePodcastAction } from '@/lib/admin/api';
import { publishArticleToWordPress, publishBrandPressToWordPress } from '@/lib/wordpress';

export async function approveAndPublishArticle(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;
  
  const { supabase } = await getAdminClient();
  
  // Fetch the article
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (!article) return;

  try {
    // Publish to WordPress
    const wpResult = await publishArticleToWordPress({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      featured_image: article.featured_image,
      status: 'draft',
    });

    // Update DB status
    await updateArticleAction(id, { 
      status: 'published',
    });

    revalidatePath('/', 'layout');
    revalidatePath('/admin/pipeline');
  } catch (error) {
    console.error('Failed to approve and publish article:', error);
  }
}

export async function approveAndPublishBrandPress(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;
  
  const { supabase } = await getAdminClient();
  
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (!article) return;

  try {
    // Publish to WordPress
    const wpResult = await publishBrandPressToWordPress({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      featured_image: article.featured_image,
      status: 'draft',
    });

    // Update DB status
    await updateArticleAction(id, { 
      status: 'published',
      payment_status: 'paid',
    });

    // Send approval email
    const { sendBrandPressApproved } = await import('@/lib/api/email');
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', article.author_id)
      .single();
    
    if (profile?.email) {
      sendBrandPressApproved(profile.email, article.brand_name || 'Brand Press').catch(() => {});
    }

    revalidatePath('/', 'layout');
    revalidatePath('/admin/pipeline');
  } catch (error) {
    console.error('Failed to approve and publish brand press:', error);
  }
}

export async function approveAndPublishPodcast(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) return;
  
  const { supabase } = await getAdminClient();
  
  const { data: podcast } = await supabase
    .from('podcasts')
    .select('*')
    .eq('id', id)
    .single();

  if (!podcast) return;

  try {
    // Update DB status (podcasts don't go to WordPress, just published in directory)
    await updatePodcastAction(id, { status: 'published' });

    revalidatePath('/', 'layout');
    revalidatePath('/admin/pipeline');
  } catch (error) {
    console.error('Failed to approve and publish podcast:', error);
  }
}

export async function rejectContent(formData: FormData) {
  const id = formData.get('id') as string;
  const type = formData.get('type') as string;
  if (!id || !type) return;
  
  try {
    if (type === 'podcast') {
      await updatePodcastAction(id, { status: 'archived' });
    } else {
      await updateArticleAction(id, { status: 'archived' });
    }
    revalidatePath('/', 'layout');
    revalidatePath('/admin/pipeline');
  } catch (error) {
    console.error('Failed to reject content:', error);
  }
}
