'use server'

import { createClient } from '@/lib/supabase/server'
import { postArticleToSlackWithButtons } from '@/lib/slack'
import { revalidatePath } from 'next/cache'

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

/** C17: publish a PR/announcement post on behalf of a law firm (editorial-gated). */
export async function publishPressRelease(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const chamberId = formData.get('chamber_id') as string
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const excerpt = (formData.get('excerpt') as string) || content.substring(0, 160).replace(/<[^>]*>/g, '') + '...'

  if (!chamberId || !title?.trim() || !content?.trim()) {
    return { error: 'Title, content, and a law firm are required' }
  }

  const { data: chamber } = await supabase
    .from('chambers')
    .select('id, user_id, name')
    .eq('id', chamberId)
    .maybeSingle()
  if (!chamber) return { error: 'Law firm not found' }

  const { data: admin } = await supabase
    .from('chamber_admins')
    .select('id')
    .eq('chamber_id', chamberId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!admin && chamber.user_id !== user.id) {
    return { error: 'You do not manage this law firm' }
  }

  const slug = slugify(title)

  const { data: article, error } = await supabase
    .from('articles')
    .insert([{
      title,
      slug,
      content,
      excerpt,
      category: ['press-release'],
      author_id: user.id,
      chamber_id: chamberId,
      article_type: 'press_release',
      status: 'pending_review',
    }])
    .select('id')
    .single()

  if (error) return { error: error.message }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  try {
    await postArticleToSlackWithButtons({
      id: article.id,
      title,
      slug,
      excerpt: `${excerpt}\n\n— ${chamber.name} (Press Release)`,
      authorName: profile?.full_name || chamber.name,
      categories: ['press-release'],
    })
  } catch {
    // editorial notification is best-effort
  }

  revalidatePath('/dashboard/chamber')
  return { success: true }
}

export async function getPressReleasesForChamber(chamberId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('articles')
    .select('id, title, status, created_at')
    .eq('chamber_id', chamberId)
    .eq('article_type', 'press_release')
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}
