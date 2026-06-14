import { createClient } from '@/lib/supabase/server'
import { getPublishedPodcasts } from '@/lib/api/articles'
import { PodcastCard } from '@/components/ui/podcast-card'

export const metadata = {
  title: 'Lawyard TV – Lawyard',
  description: 'Legal video content covering news, opinions, and analysis from Nigeria\'s leading legal media platform.',
}

export default async function TVPage() {
  const supabase = await createClient()
  const allPodcasts = await getPublishedPodcasts(supabase, { limit: 50 })
  const videos = allPodcasts.filter(p => p.media_type === 'video')

  return (
    <div className="max-w-5xl mx-auto px-6 py-24">
      <div className="mb-12">
        <h1 className="text-4xl font-black mb-3">Lawyard TV</h1>
        <p className="text-muted-foreground text-lg">
          Legal video content, interviews, and analysis.
        </p>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-lg">No videos yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <PodcastCard
              key={video.id}
              {...video}
              authorName={video.author?.[0]?.full_name}
            />
          ))}
        </div>
      )}
    </div>
  )
}
