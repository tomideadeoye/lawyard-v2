import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PublishArticleForm from '@/components/directory/forms/PublishArticleForm';
import PublishPodcastForm from '@/components/directory/forms/PublishPodcastForm';

export default async function PublishPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/directory/login');

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-fade-in">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Content Studio</h1>
        <p className="text-muted-foreground text-sm">Publish insights, articles, and podcasts to the Lawyard Directory.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Article Form */}
        <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">✍️ Publish Article</CardTitle>
            <CardDescription>Share your insights with the legal community.</CardDescription>
          </CardHeader>
          <CardContent>
            <PublishArticleForm />
          </CardContent>
        </Card>

        {/* Podcast Form */}
        <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">🎙️ Publish Podcast</CardTitle>
            <CardDescription>Upload audio or video discussion links.</CardDescription>
          </CardHeader>
          <CardContent>
            <PublishPodcastForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}