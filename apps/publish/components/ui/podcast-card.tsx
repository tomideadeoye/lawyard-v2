import Link from 'next/link'

interface PodcastCardProps {
  title: string
  slug: string
  description?: string | null
  media_url: string
  media_type: string
  duration?: string | null
  featured_image?: string | null
  created_at: string
  authorName?: string | null
}

export function PodcastCard({
  title,
  slug,
  description,
  media_type,
  duration,
  featured_image,
  created_at,
  authorName,
}: PodcastCardProps) {
  const date = new Date(created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Link
      href={`/podcasts/${slug}`}
      className="group block bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow no-underline"
    >
      {featured_image && (
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={featured_image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span className="font-semibold uppercase tracking-wider text-accent">
            {media_type === 'video' ? 'Video' : 'Podcast'}
          </span>
          <span>•</span>
          <time>{date}</time>
          {duration && <span>• {duration}</span>}
        </div>
        <h2 className="font-bold group-hover:text-accent transition-colors">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
        )}
        {authorName && (
          <p className="text-xs text-muted-foreground mt-2">{authorName}</p>
        )}
      </div>
    </Link>
  )
}
