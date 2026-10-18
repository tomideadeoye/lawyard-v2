import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function CorporatePostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('article_type', 'corporate_post')
    .eq('status', 'published')
    .single()

  if (!article) notFound()

  const date = new Date(article.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <article className="max-w-3xl mx-auto px-6 py-24">
      <Link href="/corporate-posts" className="text-sm text-muted-foreground hover:text-accent mb-8 inline-block">
        ← Back to Corporate Posts
      </Link>

      {article.featured_image && (
        <img src={article.featured_image} alt={article.title} className="w-full rounded-2xl mb-8 object-cover max-h-96" />
      )}

      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
        {article.brand_name && (
          <span className="font-bold text-accent uppercase tracking-wider">{article.brand_name}</span>
        )}
        {article.tier && (
          <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-semibold uppercase">
            {article.tier}
          </span>
        )}
        <time>{date}</time>
      </div>

      <h1 className="text-4xl font-black mb-6">{article.title}</h1>

      {article.excerpt && (
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{article.excerpt}</p>
      )}

      <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed">
        {article.content}
      </div>
    </article>
  )
}
