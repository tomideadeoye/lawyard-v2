import { createClient } from '@/lib/supabase/server'
import { getPublishedArticles, formatDate } from '@/lib/api/articles'
import { ArticleCard } from '@/components/ui/article-card'
import Link from 'next/link'

export const metadata = {
  title: 'Insights – Lawyard',
  description: 'Legal news, opinions, features, and analysis from Nigeria\'s leading legal media platform.',
}

const CATEGORIES = [
  { name: 'All', slug: null },
  { name: 'News', slug: 'news' },
  { name: 'Opinions', slug: 'opinions' },
  { name: 'Features', slug: 'features' },
  { name: 'Spotlight', slug: 'lawyard-spotlight' },
  { name: 'Sports Law', slug: 'sports-law' },
  { name: 'Judgements', slug: 'judgements' },
]

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()
  const articles = await getPublishedArticles(supabase, {
    category: category || undefined,
    excludeType: 'corporate_post',
  })

  return (
    <div className="max-w-5xl mx-auto px-6 py-24">
      <div className="mb-12">
        <h1 className="text-4xl font-black mb-3">Insights</h1>
        <p className="text-muted-foreground text-lg">
          Legal news, opinions, features, and analysis.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORIES.map((cat) => {
          const active = cat.slug === null ? !category : category === cat.slug
          return (
            <Link
              key={cat.name}
              href={cat.slug ? `/insights?category=${cat.slug}` : '/insights'}
              className={`text-sm px-4 py-2 rounded-lg border transition-colors no-underline ${
                active
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'border-border text-muted-foreground hover:border-accent hover:text-foreground'
              }`}
            >
              {cat.name}
            </Link>
          )
        })}
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-lg">No articles yet.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              {...article}
              authorName={article.author?.[0]?.full_name}
              variant="list"
            />
          ))}
        </div>
      )}
    </div>
  )
}
