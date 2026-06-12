import { createClient } from '@/lib/supabase/server'
import { getPodcastBySlug, formatDate } from '@repo/api/articles'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function PodcastDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const podcast = await getPodcastBySlug(supabase, slug)
  if (!podcast) notFound()

  const author = podcast.author?.[0]

  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/podcasts" className="hover:text-foreground no-underline">Podcasts</Link>
        <span>/</span>
        <span className="text-foreground">{podcast.title}</span>
      </div>

      <header className="mb-10">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="font-semibold text-accent uppercase tracking-wider">
            {podcast.media_type === 'video' ? 'Video' : 'Audio'}
          </span>
          {podcast.duration && <span>• {podcast.duration}</span>}
          <time>{formatDate(podcast.created_at)}</time>
        </div>
        <h1 className="text-4xl font-black leading-tight mb-4">{podcast.title}</h1>
        {author?.full_name && (
          <p className="text-sm text-muted-foreground">By {author.full_name}</p>
        )}
      </header>

      {podcast.featured_image && (
        <div className="aspect-[16/9] rounded-xl overflow-hidden bg-muted mb-8">
          <img
            src={podcast.featured_image}
            alt={podcast.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <audio
          controls
          src={podcast.media_url}
          className="w-full"
        >
          Your browser does not support the audio element.
        </audio>
      </div>

      {podcast.description && (
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {podcast.description}
        </div>
      )}
    </div>
  )
}
