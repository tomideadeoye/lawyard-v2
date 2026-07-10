import { createClient } from '@/lib/supabase/server'
import { getPublishedArticles } from '@/lib/api/articles'
import { ArticleCard } from '@/components/ui/article-card'
import Link from 'next/link'
import config from '@/lib/corporate-posts.json'

export const metadata = {
  title: 'Corporate Posts – Lawyard',
  description: 'Paid press releases and brand announcements on Lawyard — Nigeria\'s leading legal media platform.',
}

export default async function CorporatePostsPage() {
  const supabase = await createClient()
  const articles = await getPublishedArticles(supabase, { limit: 50 })

  const corporatePostArticles = articles.filter(a => a.article_type === 'corporate_post')

  return (
    <div className="max-w-5xl mx-auto px-6 py-24">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black mb-3">Corporate Posts</h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Paid press releases and brand announcements from the legal ecosystem.
          </p>
          <div className="flex gap-4 mt-4">
            {config.tiers.map(t => (
              <span key={t.id} className="text-xs text-muted-foreground">
                {t.name} starts at <strong>{t.formatted_price}</strong>
              </span>
            ))}
          </div>
        </div>
        <Link
          href="/corporate-posts/submit"
          className="bg-accent text-accent-foreground px-6 py-3 rounded-xl font-bold hover:bg-accent/90 shrink-0"
        >
          Submit Now
        </Link>
      </div>

      {corporatePostArticles.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-lg mb-4">No Corporate Post articles yet.</p>
          <Link
            href="/corporate-posts/submit"
            className="text-[#a77c5c] font-bold hover:underline"
          >
            Be the first to submit →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {corporatePostArticles.map((article) => (
            <ArticleCard
              key={article.id}
              {...article}
              authorName={article.author?.[0]?.full_name}
            />
          ))}
        </div>
      )}
    </div>
  )
}
