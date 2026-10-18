import Link from 'next/link'
import { getArticles } from '@/lib/directory/api'
import { ArticleCard } from '@/components/ui/article-card'
import { TERMS } from '@/lib/constants'

export const metadata = {
  title: 'Legal Insights — Lawyard Directory',
  description: 'Articles, analysis, and commentary published by the lawyers and law firms in the Lawyard directory.',
}

export const dynamic = 'force-dynamic'

interface ArticleRow {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image: string | null
  category: string[] | null
  article_type: string | null
  created_at: string
  author?: { full_name: string | null }[] | { full_name: string | null } | null
}

export default async function DirectoryInsightsPage() {
  const articles = (await getArticles({ limit: 30 })) as unknown as ArticleRow[]

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-black mb-3">Legal Insights</h1>
        <p className="text-muted-foreground text-lg">
          Articles and analysis published by {TERMS.lawyer.lowerPlural} and {TERMS.firm.lowerPlural} in the directory.
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <div className="text-5xl">📰</div>
          <p className="text-lg text-muted-foreground">No articles published yet.</p>
          <Link href="/dashboard/publish" className="inline-block text-sm font-semibold text-primary hover:underline">
            Publish the first article &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {articles.map((article) => {
            const author = Array.isArray(article.author) ? article.author[0] : article.author
            const category = Array.isArray(article.category) ? article.category[0] : article.category
            return (
              <ArticleCard
                key={article.id}
                title={article.title}
                slug={article.slug}
                excerpt={article.excerpt}
                featured_image={article.featured_image}
                category={category}
                article_type={article.article_type}
                created_at={article.created_at}
                authorName={author?.full_name}
                variant="list"
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
