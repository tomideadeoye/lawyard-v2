import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ArticleCardProps {
  title: string
  slug: string
  excerpt?: string | null
  featured_image?: string | null
  category?: string | null
  article_type?: string | null
  brand_name?: string | null
  tier?: string | null
  created_at: string
  authorName?: string | null
  variant?: 'grid' | 'list'
  className?: string
}

export function ArticleCard({
  title,
  slug,
  excerpt,
  featured_image,
  category,
  article_type,
  brand_name,
  tier,
  created_at,
  authorName,
  variant = 'grid',
  className,
}: ArticleCardProps) {
  const date = new Date(created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  if (variant === 'list') {
    return (
      <Link
        href={`/insights/${slug}`}
        className={cn('group block no-underline', className)}
      >
        <article className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 items-start border-b border-border pb-10">
          <div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <span className="font-semibold text-accent uppercase tracking-wider">
                {category || 'Article'}
              </span>
              {article_type === 'corporate_post' && (
                <span className="font-semibold text-accent uppercase tracking-wider border border-accent px-1.5 py-0.5 rounded text-[10px]">
                  Corporate Post
                </span>
              )}
              {tier && (
                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                  {tier}
                </span>
              )}
              <time>{date}</time>
            </div>
            <h2 className="text-xl font-bold group-hover:text-accent transition-colors mb-2">
              {title}
            </h2>
            {excerpt && (
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                {excerpt}
              </p>
            )}
            {authorName && (
              <p className="text-xs text-muted-foreground mt-3">By {authorName}</p>
            )}
          </div>
          {featured_image && (
            <div className="aspect-[16/9] rounded-xl overflow-hidden bg-muted">
              <img
                src={featured_image}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          )}
        </article>
      </Link>
    )
  }

  return (
    <Link
      href={`/insights/${slug}`}
      className={cn('group block no-underline', className)}
    >
      <article className="flex flex-col gap-4 p-6 bg-card border border-border/60 rounded-xl hover:border-accent/50 hover:shadow-lg transition-all h-full">
        {featured_image && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={featured_image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">
              {category || 'Article'}
            </p>
            {article_type === 'corporate_post' && (
              <span className="text-[10px] font-semibold text-accent border border-accent px-1.5 py-0.5 rounded">
                Corporate Post
              </span>
            )}
            {brand_name && (
              <span className="text-[10px] text-muted-foreground mb-2">
                {brand_name}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold group-hover:text-primary transition-colors leading-snug">
            {title}
          </h3>
          {excerpt && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {excerpt}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto pt-3 border-t border-border/50">
          <span>{authorName || 'Lawyard Staff'}</span>
          <span>•</span>
          <time>{date}</time>
        </div>
      </article>
    </Link>
  )
}
