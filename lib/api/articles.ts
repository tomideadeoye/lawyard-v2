import type { SupabaseClient } from '@supabase/supabase-js'

export interface ArticleWithAuthor {
  id: string
  title: string
  slug: string
  content?: string
  excerpt?: string | null
  featured_image?: string | null
  category?: string | null
  article_type?: string | null
  brand_name?: string | null
  tier?: string | null
  created_at: string
  author: { full_name: string; avatar_url?: string | null }[] | null
}

export interface PodcastWithAuthor {
  id: string
  title: string
  slug: string
  description?: string | null
  media_url: string
  media_type: string
  duration?: string | null
  featured_image?: string | null
  created_at: string
  author: { full_name: string }[] | null
}

const articleFields = 'id, title, slug, excerpt, featured_image, category, article_type, brand_name, tier, created_at, author:profiles(full_name, avatar_url)'
const articleDetailFields = '*, author:profiles(full_name, avatar_url)'
const podcastFields = 'id, title, slug, description, media_url, media_type, duration, created_at, author:profiles(full_name)'

export function formatDate(date: string, style: 'full' | 'short' = 'full'): string {
  const opts: Intl.DateTimeFormatOptions = style === 'full'
    ? { year: 'numeric', month: 'long', day: 'numeric' }
    : { day: 'numeric', month: 'short', year: 'numeric' }
  return new Date(date).toLocaleDateString('en-NG', opts)
}

export async function getPublishedArticles(
  supabase: SupabaseClient,
  opts?: { category?: string; excludeType?: string; limit?: number }
): Promise<ArticleWithAuthor[]> {
  let query = supabase
    .from('articles')
    .select(articleFields)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (opts?.category) query = query.eq('category', opts.category)
  if (opts?.excludeType) query = query.neq('article_type', opts.excludeType)
  if (opts?.limit) query = query.limit(opts.limit)

  const { data } = await query
  return (data || []) as unknown as ArticleWithAuthor[]
}

export async function getArticleBySlug(supabase: SupabaseClient, slug: string) {
  const { data } = await supabase
    .from('articles')
    .select(articleDetailFields)
    .eq('slug', slug)
    .single()
  return data as ArticleWithAuthor | null
}

export async function getRelatedArticles(
  supabase: SupabaseClient,
  currentId: string,
  category: string | null,
  limit = 3
) {
  let query = supabase
    .from('articles')
    .select('id, title, slug, featured_image, excerpt')
    .neq('id', currentId)
    .eq('status', 'published')
    .limit(limit)

  if (category) query = query.eq('category', category)

  const { data } = await query
  return data || []
}

export async function getPublishedPodcasts(
  supabase: SupabaseClient,
  opts?: { limit?: number }
): Promise<PodcastWithAuthor[]> {
  let query = supabase
    .from('podcasts')
    .select(podcastFields)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (opts?.limit) query = query.limit(opts.limit)

  const { data } = await query
  return (data || []) as unknown as PodcastWithAuthor[]
}

export async function getPodcastBySlug(supabase: SupabaseClient, slug: string) {
  const { data } = await supabase
    .from('podcasts')
    .select('*, author:profiles(full_name)')
    .eq('slug', slug)
    .single()
  return data as PodcastWithAuthor | null
}
