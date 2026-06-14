import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .eq('category', id)
    .eq('status', 'published');

  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      <Link href="/knowledge" className="text-primary font-bold">← Back to Knowledge Base</Link>
      <h1 className="text-4xl font-black mt-8 mb-12 capitalize">{id.replace('-', ' ')}</h1>
      <div className="space-y-6">
        {articles?.map(a => (
          <Link key={a.id} href={`/knowledge/${a.slug}`} className="block premium-card hover:border-accent transition-all p-6">
            <h2 className="text-xl font-bold">{a.title}</h2>
            <p className="text-muted-foreground mt-2">{a.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}