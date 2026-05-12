import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: article } = await supabase
    .from('articles')
    .select('*, author:profiles(full_name)')
    .eq('slug', slug)
    .single();

  if (!article) notFound();

  return (
    <article className="max-w-3xl mx-auto px-6 py-24">
      <header className="mb-12">
        <h1 className="text-5xl font-black mb-4">{article.title}</h1>
        <p className="text-muted-foreground">By {article.author?.full_name} • {new Date(article.created_at).toLocaleDateString()}</p>
      </header>
      <div className="prose prose-lg dark:prose-invert leading-relaxed">
        {article.content}
      </div>
    </article>
  );
}