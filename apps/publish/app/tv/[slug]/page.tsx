import { createClient } from '@/lib/supabase/server'
import { getPublishedPodcasts } from '@repo/api/articles'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function TVDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const allPodcasts = await getPublishedPodcasts(supabase, { limit: 50 })
  const video = allPodcasts.find(p => p.media_type === 'video' && p.slug === slug)
  if (!video) notFound()

  const author = video.author?.[0]

  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/tv" className="hover:text-foreground no-underline">Lawyard TV</Link>
        <span>/</span>
        <span className="text-foreground">{video.title}</span>
      </div>

      <header className="mb-10">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="font-semibold text-accent uppercase tracking-wider">Video</span>
          {video.duration && <span>• {video.duration}</span>}
          <time>
            {new Date(video.created_at).toLocaleDateString('en-NG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>
        <h1 className="text-4xl font-black leading-tight mb-4">{video.title}</h1>
        {author?.full_name && (
          <p className="text-sm text-muted-foreground">By {author.full_name}</p>
        )}
      </header>

      {video.featured_image && (
        <div className="aspect-video rounded-xl overflow-hidden bg-muted mb-8">
          <img
            src={video.featured_image}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <video
          controls
          src={video.media_url}
          className="w-full rounded-lg"
        >
          Your browser does not support the video element.
        </video>
      </div>

      {video.description && (
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {video.description}
        </div>
      )}
    </div>
  )
}
