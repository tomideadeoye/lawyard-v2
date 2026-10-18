import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPublishingQuota } from '@/app/directory/actions/publishing';
import { verifyPayment } from '@/app/directory/actions/payments';
import PublishTabs from './PublishTabs';

interface PublishPageProps {
  searchParams: Promise<{ reference?: string; payment?: string; trxref?: string }>;
}

export default async function PublishPage({ searchParams }: PublishPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const sp = await searchParams;
  // Returning from an extra-post checkout — verify and grant the credit.
  if (sp.payment === 'extra_post' && (sp.reference || sp.trxref)) {
    await verifyPayment((sp.reference || sp.trxref)!);
  }

  const [articlesRes, podcastsRes, quota] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, status, created_at')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('podcasts')
      .select('id, title, status, created_at')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    getPublishingQuota(user.id),
  ]);

  const articles = articlesRes.data || [];
  const podcasts = podcastsRes.data || [];

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 animate-fade-in">
      <div className="border-b border-border pb-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Content Studio</h1>
        <p className="text-muted-foreground text-sm">Publish insights, articles, and podcasts to the Lawyard Directory.</p>
      </div>

      <PublishTabs articles={articles} podcasts={podcasts} quota={quota} />
    </div>
  );
}
