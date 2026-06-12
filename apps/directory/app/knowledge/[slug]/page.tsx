import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  
  // 1. Try to fetch article
  const { data: article } = await supabase
    .from('articles')
    .select('*, author:profiles(full_name)')
    .eq('slug', slug)
    .single();

  if (article) {
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

  // 2. Try to fetch podcast
  const { data: podcast } = await supabase
    .from('podcasts')
    .select('*, author:profiles(full_name)')
    .eq('slug', slug)
    .single();

  if (!podcast) notFound();

  // Helper to parse/embed video links (YouTube)
  const getEmbedUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
        let videoId = '';
        if (parsed.hostname.includes('youtu.be')) {
          videoId = parsed.pathname.substring(1);
        } else {
          videoId = parsed.searchParams.get('v') || '';
        }
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (_) {}
    return null;
  };

  const embedUrl = getEmbedUrl(podcast.media_url);

  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <header className="mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4">
          🎙️ {podcast.media_type === 'video' ? 'Video' : 'Audio'} Podcast
        </div>
        <h1 className="text-5xl font-black mb-4">{podcast.title}</h1>
        <p className="text-muted-foreground">Hosted by {podcast.author?.full_name} • {new Date(podcast.created_at).toLocaleDateString()}</p>
      </header>

      {/* Embed Player */}
      <div className="mb-12">
        {podcast.media_type === 'video' && embedUrl ? (
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-border/40">
            <iframe
              src={embedUrl}
              title={podcast.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : podcast.media_type === 'audio' ? (
          <div className="bg-card/40 border border-border/40 p-8 rounded-2xl backdrop-blur-md shadow-xl flex flex-col gap-4">
            <p className="text-sm font-semibold text-muted-foreground">Listen to this episode:</p>
            <audio controls src={podcast.media_url} className="w-full mt-2" />
          </div>
        ) : (
          <div className="bg-card/40 border border-border/40 p-8 rounded-2xl backdrop-blur-md shadow-xl text-center">
            <p className="text-muted-foreground mb-4">This media is hosted externally.</p>
            <a
              href={podcast.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/95 transition-all shadow-lg"
            >
              Watch / Listen Externally
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </div>
        )}
      </div>

      <div className="prose prose-lg dark:prose-invert leading-relaxed">
        <h3 className="text-lg font-bold uppercase tracking-wider text-accent mb-2">Description</h3>
        <p>{podcast.description || 'No description provided.'}</p>
      </div>
    </div>
  );
}