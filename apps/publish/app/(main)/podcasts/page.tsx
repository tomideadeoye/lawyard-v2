import { createClient } from '@/lib/supabase/server'
import { getPublishedPodcasts } from '@/lib/api/articles'
import { PodcastCard } from '@/components/ui/podcast-card'

export const metadata = {
  title: 'Podcasts – Lawyard',
  description: 'Legal podcasts covering news, opinions, and analysis from Nigeria\'s leading legal media platform.',
}

export default async function PodcastsPage() {
  const supabase = await createClient()
  const podcasts = await getPublishedPodcasts(supabase, { limit: 50 })

  return (
    <div className="max-w-5xl mx-auto px-6 py-24">
      <div className="mb-12">
        <h1 className="text-4xl font-black mb-3">Podcasts</h1>
        <p className="text-muted-foreground text-lg">
          Legal conversations, analysis, and interviews.
        </p>
      </div>

      {podcasts.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-lg">No podcasts yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast) => (
            <PodcastCard
              key={podcast.id}
              {...podcast}
              authorName={podcast.author?.[0]?.full_name}
            />
          ))}
        </div>
      )}
    </div>
  )
}
