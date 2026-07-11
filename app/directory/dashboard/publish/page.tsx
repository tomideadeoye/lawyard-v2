import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PublishTabs from './PublishTabs';

export default async function PublishPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, status, created_at')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: podcasts } = await supabase
    .from('podcasts')
    .select('id, title, status, created_at')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 animate-fade-in">
      <div className="border-b border-border pb-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Content Studio</h1>
        <p className="text-muted-foreground text-sm">Publish insights, articles, and podcasts to the Lawyard Directory.</p>
      </div>

      <PublishTabs articles={articles || []} podcasts={podcasts || []} />
    </div>
  );
}
