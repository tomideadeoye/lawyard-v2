import { getAdminClient } from '@/lib/supabase/admin-auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await getAdminClient()

  const { data: article } = await supabase
    .from('articles')
    .select('*, author:profiles(full_name)')
    .eq('id', id)
    .single()

  if (!article) notFound()

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/pipeline" className="text-sm text-slate-500 hover:text-slate-700 mb-6 inline-block">
        ← Back to Pipeline
      </Link>

      <article className="prose prose-slate max-w-none">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase border ${
              article.article_type === 'corporate_post'
                ? 'bg-purple-50 text-purple-600 border-purple-200'
                : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              {article.article_type === 'corporate_post' ? 'Corporate Post' : 'Article'}
            </span>
            <span className="text-xs text-slate-400">{article.status}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{article.title}</h1>
          <p className="text-sm text-slate-500">
            By {article.author?.full_name || article.brand_name || 'Unknown'} · {new Date(article.created_at).toLocaleDateString()}
            {article.scheduled_date && <> · Scheduled: {new Date(article.scheduled_date).toLocaleDateString()}</>}
          </p>
        </div>

        {article.featured_image && (
          <img src={article.featured_image} alt={article.title} className="w-full rounded-lg mb-6 object-cover max-h-96" />
        )}

        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
          {article.content}
        </div>
      </article>
    </div>
  )
}
