import { getAdminClient } from '@/lib/supabase/admin-auth';
import { approveAndPublishArticle, approveAndPublishCorporatePost, approveAndPublishPodcast, rejectContent } from './actions';

export default async function PipelinePage() {
  const { supabase } = await getAdminClient();

  const [articlesResult, podcastsResult] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, status, article_type, brand_name, scheduled_date, created_at, author:profiles(full_name)')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false }),
    supabase
      .from('podcasts')
      .select('id, title, slug, description, status, media_type, scheduled_date, created_at, author:profiles(full_name)')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false }),
  ]);

  const pendingArticles = articlesResult.data ?? [];
  const pendingPodcasts = podcastsResult.data ?? [];
  const totalCount = pendingArticles.length + pendingPodcasts.length;

  return (
    <>
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-gradient">Editorial Pipeline</h1>
          <p style={{ color: '#94A3B8', fontSize: '0.95rem', marginTop: '4px' }}>
            {totalCount} item{totalCount !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
      </header>

      {totalCount === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">✨</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Pipeline Clear</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            No content awaiting review. New submissions from the directory and corporate posts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingArticles.map((item: any) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase border ${
                      item.article_type === 'corporate_post'
                        ? 'bg-purple-50 text-purple-600 border-purple-200'
                        : 'bg-blue-50 text-blue-600 border-blue-200'
                    }`}>
                      {item.article_type === 'corporate_post' ? 'Corporate Post' : 'Article'}
                    </span>
                    {item.scheduled_date && (
                      <span className="text-xs text-amber-600 font-medium">
                        📅 {new Date(item.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-base mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{item.excerpt}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>By {item.author?.full_name || item.brand_name || 'Unknown'}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                <form action={item.article_type === 'corporate_post' ? approveAndPublishCorporatePost : approveAndPublishArticle} className="inline-block">
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="btn bg-emerald-500 text-white text-[13px] px-4 py-1.5 rounded-md hover:brightness-110 transition">
                    ✓ Approve & Publish to WordPress
                  </button>
                </form>
                <form action={rejectContent} className="inline-block">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="type" value="article" />
                  <button type="submit" className="btn bg-red-50 text-red-600 text-[13px] px-4 py-1.5 rounded-md border border-red-200 hover:bg-red-100 transition">
                    ✕ Reject
                  </button>
                </form>
              </div>
            </div>
          ))}

          {pendingPodcasts.map((item: any) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase border bg-emerald-50 text-emerald-600 border-emerald-200">
                      {item.media_type === 'video' ? 'Video Podcast' : 'Audio Podcast'}
                    </span>
                    {item.scheduled_date && (
                      <span className="text-xs text-amber-600 font-medium">
                        📅 {new Date(item.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-base mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>By {item.author?.full_name || 'Unknown'}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                <form action={approveAndPublishPodcast} className="inline-block">
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="btn bg-emerald-500 text-white text-[13px] px-4 py-1.5 rounded-md hover:brightness-110 transition">
                    ✓ Approve & Publish
                  </button>
                </form>
                <form action={rejectContent} className="inline-block">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="type" value="podcast" />
                  <button type="submit" className="btn bg-red-50 text-red-600 text-[13px] px-4 py-1.5 rounded-md border border-red-200 hover:bg-red-100 transition">
                    ✕ Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
