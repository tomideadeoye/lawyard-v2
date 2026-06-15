import { getAllArticles, getAllPodcasts, getBrandPressArticles } from '@/lib/admin/api';
import { toggleArticleStatus, deleteArticle, togglePodcastStatus, deletePodcast, approveBrandPress, rejectBrandPress } from '../actions';
import { CreateContentDialog } from './create-dialog';
import { ContentFilter } from './content-filter';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    published: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: 'rgba(16, 185, 129, 0.2)' },
    draft: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' },
    archived: { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748B', border: 'rgba(100, 116, 139, 0.2)' },
  };
  if (!['published', 'draft', 'archived'].includes(status)) return <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{status}</span>;
  const s = map[status as keyof typeof map]!;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

function AuthorName(author: unknown): string {
  if (!author) return '—';
  if (Array.isArray(author)) return (author[0] as any)?.full_name || '—';
  return (author as any)?.full_name || '—';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function ContentPage(props: {
  searchParams?: Promise<{ tab?: string; status?: string; page?: string }>;
}) {
  const sp = await props.searchParams;
  const tab = sp?.tab || 'articles';
  const status = sp?.status || 'all';
  const page = parseInt(sp?.page || '1', 10);

  const isArticles = tab === 'articles';
  const isBrandPress = tab === 'brand-press';

  const articlesResult = isArticles ? await getAllArticles({ status, page }) : null;
  const podcastsResult = tab === 'podcasts' ? await getAllPodcasts({ status, page }) : null;
  const brandPressResult = isBrandPress ? await getBrandPressArticles() : null;

  const articles = articlesResult?.data?.articles ?? [];
  const podcasts = podcastsResult?.data?.podcasts ?? [];
  const brandPressArticles = brandPressResult?.data ?? [];
  const error = articlesResult?.error || podcastsResult?.error || brandPressResult?.error;

  const activeCount = isArticles ? (articlesResult?.data?.total ?? 0) : isBrandPress ? brandPressArticles.length : (podcastsResult?.data?.total ?? 0);

  return (<>
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-gradient">Content Manager</h1>
            <p style={{ color: '#94A3B8', fontSize: '0.95rem', marginTop: '4px' }}>
              {activeCount} {isArticles ? 'article' : 'podcast'}{activeCount !== 1 ? 's' : ''}
            </p>
          </div>
          <CreateContentDialog />
        </header>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#EF4444', fontSize: '0.85rem',
          }}>
            <span>⚠️</span> <div><strong>Error: </strong>{error.message}</div>
          </div>
        )}

        {/* Tabs + Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px' }}>
            <a href="/content?tab=articles"
              style={{
                padding: '8px 20px', borderRadius: '8px', textDecoration: 'none',
                fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s',
                background: isArticles ? 'var(--card)' : 'transparent',
                color: isArticles ? 'var(--foreground)' : '#94A3B8',
                border: isArticles ? '1px solid var(--card-border)' : '1px solid transparent',
              }}
            >
              📄 Articles
            </a>
            <a href="/content?tab=podcasts"
              style={{
                padding: '8px 20px', borderRadius: '8px', textDecoration: 'none',
                fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s',
                background: tab === 'podcasts' ? 'var(--card)' : 'transparent',
                color: tab === 'podcasts' ? 'var(--foreground)' : '#94A3B8',
                border: tab === 'podcasts' ? '1px solid var(--card-border)' : '1px solid transparent',
              }}
            >
              🎙️ Podcasts
            </a>
            <a href="/content?tab=brand-press"
              style={{
                padding: '8px 20px', borderRadius: '8px', textDecoration: 'none',
                fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s',
                background: isBrandPress ? 'var(--card)' : 'transparent',
                color: isBrandPress ? 'var(--foreground)' : '#94A3B8',
                border: isBrandPress ? '1px solid var(--card-border)' : '1px solid transparent',
              }}
            >
              📢 Brand Press
            </a>
          </div>

          {!isBrandPress && <ContentFilter tab={tab} status={status} />}
        </div>

        {/* Brand Press Table */}
        {isBrandPress && (
          <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Brand</th>
                    <th style={thStyle}>Tier</th>
                    <th style={thStyle}>Payment</th>
                    <th style={thStyle}>Schedule</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Created</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brandPressArticles.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No Brand Press submissions.</td></tr>
                  ) : (
                    brandPressArticles.map((bp, i) => (
                      <tr key={bp.id} style={{ borderBottom: '1px solid var(--card-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ ...tdStyle, fontWeight: 600, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bp.title}</td>
                        <td style={{ ...tdStyle, color: '#94A3B8' }}>{bp.brand_name || '—'}</td>
                        <td style={tdStyle}>
                          <span style={{
                            background: bp.tier === 'pro' ? 'rgba(234, 179, 8, 0.1)' : bp.tier === 'core' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                            color: bp.tier === 'pro' ? '#EAB308' : bp.tier === 'core' ? '#3B82F6' : '#6B7280',
                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                          }}>
                            {bp.tier || '—'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            background: bp.payment_status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: bp.payment_status === 'paid' ? '#10B981' : '#F59E0B',
                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                          }}>
                            {bp.payment_status}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: '#94A3B8' }}>{bp.scheduled_date ? new Date(bp.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                        <td style={tdStyle}><StatusBadge status={bp.status} /></td>
                        <td style={{ ...tdStyle, color: '#94A3B8' }}>{formatDate(bp.created_at)}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {bp.status === 'pending_review' && (
                              <>
                                <form action={approveBrandPress} style={{ display: 'inline' }}>
                                  <input type="hidden" name="id" value={bp.id} />
                                  <input type="hidden" name="scheduled_date" value="" />
                                  <button type="submit" className="btn btn-approve" style={{ padding: '5px 10px', fontSize: '0.7rem' }}>Approve</button>
                                </form>
                                <form action={rejectBrandPress} style={{ display: 'inline' }}>
                                  <input type="hidden" name="id" value={bp.id} />
                                  <button type="submit" className="btn btn-reject" style={{ padding: '5px 10px', fontSize: '0.7rem' }}>Reject</button>
                                </form>
                              </>
                            )}
                            {bp.status === 'published' && (
                              <form action={rejectBrandPress} style={{ display: 'inline' }}>
                                <input type="hidden" name="id" value={bp.id} />
                                <button type="submit" className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '0.7rem', color: '#F59E0B' }}>Archive</button>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Articles / Podcasts Table */}
        {!isBrandPress && (
        <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin">
            {isArticles ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Author</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Created</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No articles found.</td></tr>
                  ) : (
                    articles.map((a, i) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid var(--card-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ ...tdStyle, fontWeight: 600, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</td>
                        <td style={{ ...tdStyle, color: '#94A3B8' }}>{AuthorName(a.author)}</td>
                        <td style={{ ...tdStyle, color: '#94A3B8' }}>{a.category || '—'}</td>
                        <td style={tdStyle}><StatusBadge status={a.status} /></td>
                        <td style={{ ...tdStyle, color: '#94A3B8' }}>{formatDate(a.created_at)}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {a.status !== 'published' && (
                              <form action={toggleArticleStatus} style={{ display: 'inline' }}>
                                <input type="hidden" name="id" value={a.id} />
                                <input type="hidden" name="status" value="published" />
                                <button type="submit" className="btn btn-approve" style={{ padding: '5px 10px', fontSize: '0.7rem' }}>Publish</button>
                              </form>
                            )}
                            {a.status === 'published' && (
                              <form action={toggleArticleStatus} style={{ display: 'inline' }}>
                                <input type="hidden" name="id" value={a.id} />
                                <input type="hidden" name="status" value="archived" />
                                <button type="submit" className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '0.7rem', color: '#F59E0B' }}>Archive</button>
                              </form>
                            )}
                            <form action={deleteArticle} style={{ display: 'inline' }}>
                              <input type="hidden" name="id" value={a.id} />
                              <button type="submit" className="btn btn-reject" style={{ padding: '5px 10px', fontSize: '0.7rem' }}
                                onClick={(e) => { if (!confirm('Delete this article?')) e.preventDefault(); }}
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Media Type</th>
                    <th style={thStyle}>Author</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Created</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {podcasts.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No podcasts found.</td></tr>
                  ) : (
                    podcasts.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--card-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ ...tdStyle, fontWeight: 600, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</td>
                        <td style={{ ...tdStyle, color: '#94A3B8' }}>
                          {p.media_type === 'video' ? '📺 Video' : '🎙️ Audio'}
                        </td>
                        <td style={{ ...tdStyle, color: '#94A3B8' }}>{AuthorName(p.author)}</td>
                        <td style={tdStyle}><StatusBadge status={p.status} /></td>
                        <td style={{ ...tdStyle, color: '#94A3B8' }}>{formatDate(p.created_at)}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {p.status !== 'published' && (
                              <form action={togglePodcastStatus} style={{ display: 'inline' }}>
                                <input type="hidden" name="id" value={p.id} />
                                <input type="hidden" name="status" value="published" />
                                <button type="submit" className="btn btn-approve" style={{ padding: '5px 10px', fontSize: '0.7rem' }}>Publish</button>
                              </form>
                            )}
                            {p.status === 'published' && (
                              <form action={togglePodcastStatus} style={{ display: 'inline' }}>
                                <input type="hidden" name="id" value={p.id} />
                                <input type="hidden" name="status" value="archived" />
                                <button type="submit" className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '0.7rem', color: '#F59E0B' }}>Archive</button>
                              </form>
                            )}
                            <form action={deletePodcast} style={{ display: 'inline' }}>
                              <input type="hidden" name="id" value={p.id} />
                              <button type="submit" className="btn btn-reject" style={{ padding: '5px 10px', fontSize: '0.7rem' }}
                                onClick={(e) => { if (!confirm('Delete this podcast?')) e.preventDefault(); }}
                              >
                                Delete
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
  </>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontWeight: 600,
  color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px', whiteSpace: 'nowrap',
};
