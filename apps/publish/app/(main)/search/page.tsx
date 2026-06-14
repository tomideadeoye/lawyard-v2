import { createClient } from '@/lib/supabase/server'
import { ArticleCard } from '@/components/ui/article-card'
import SearchForm from './SearchForm'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const supabase = await createClient()

  let articles: any[] = []
  let query = ''

  if (q && q.trim()) {
    query = q.trim()
    const { data } = await supabase
      .from('articles')
      .select(`*, author:profiles(full_name, avatar_url)`)
      .eq('status', 'published')
      .neq('article_type', 'brand_press')
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    articles = data || []
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="mb-12">
        <h1 className="text-4xl font-black mb-3">Search</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Search articles across Lawyard.
        </p>
      </div>

      <SearchForm initialQuery={query} />

      {query && (
        <div className="mt-10">
          <p className="text-sm text-muted-foreground mb-8">
            {articles.length === 0
              ? `No results found for "${query}". Try different keywords.`
              : `Found ${articles.length} result${articles.length === 1 ? '' : 's'} for "${query}"`
            }
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                {...article}
                authorName={article.author?.[0]?.full_name}
                variant="grid"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
