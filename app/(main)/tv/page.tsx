import { createClient } from '@/lib/supabase/server'
import { getPublishedPodcasts } from '@/lib/api/articles'
import TVPageClient from './TVPageClient'

export const metadata = {
  title: 'Lawyard TV – Lawyard',
  description: 'Legal video content covering news, opinions, and analysis from Nigeria\'s leading legal media platform.',
}

export default async function TVPage() {
  const supabase = await createClient()
  const allPodcasts = await getPublishedPodcasts(supabase, { limit: 50 })
  const videos = allPodcasts.filter(p => p.media_type === 'video')

  return <TVPageClient initialVideos={videos} />
}
