import { getAllLawyers } from '@/lib/admin/api';
import { verifyLawyer, rejectLawyer, updateLawyer } from '../actions';
import { EditLawyerDialog } from './edit-dialog';
import { LawyersFilters } from './lawyers-filters';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    verified: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: 'rgba(16, 185, 129, 0.2)' },
    pending: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' },
    rejected: { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'rgba(239, 68, 68, 0.2)' },
  };
  if (!['verified', 'pending', 'rejected'].includes(status)) return <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{status}</span>;
  const s = styles[status as keyof typeof styles]!;
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

export default async function LawyersPage(props: {
  searchParams?: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const sp = await props.searchParams;
  const status = sp?.status || 'all';
  const search = sp?.search || '';
  const page = parseInt(sp?.page || '1', 10);

  const result = await getAllLawyers({ status, search, page });
  const lawyers = result.data?.lawyers ?? [];
  const total = result.data?.total ?? 0;
  const error = result.error;
  const totalPages = Math.ceil(total / 50);

  return (<>
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-gradient">Lawyers Directory</h1>
            <p style={{ color: '#94A3B8', fontSize: '0.95rem', marginTop: '4px' }}>
              {total} lawyer{total !== 1 ? 's' : ''} registered
            </p>
          </div>
        </header>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#EF4444', fontSize: '0.85rem', marginBottom: '16px',
          }}>
            <span>⚠️</span>
            <div><strong>Error: </strong>{error.message}</div>
          </div>
        )}

        <LawyersFilters initialStatus={status} initialSearch={search} />

        {/* Table */}
        <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Specialties</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lawyers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                      {search || status !== 'all' ? 'No lawyers match your filters.' : 'No lawyers found.'}
                    </td>
                  </tr>
                ) : (
                  lawyers.map((l, i) => (
                    <tr key={l.id} style={{
                      borderBottom: '1px solid var(--card-border)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      transition: 'background 0.15s',
                    }}>
                      <td style={tdStyle}><span style={{ fontWeight: 600 }}>{l.name}</span></td>
                      <td style={{ ...tdStyle, color: '#94A3B8' }}>{l.role || '—'}</td>
                      <td style={{ ...tdStyle, color: '#94A3B8' }}>{l.location || '—'}</td>
                      <td style={tdStyle}><StatusBadge status={l.verification_status} /></td>
                      <td style={{ ...tdStyle, color: '#94A3B8', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.specialties?.map(s => s.name).filter(Boolean).join(', ') || '—'}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {l.verification_status === 'pending' && (
                            <>
                              <form action={verifyLawyer} style={{ display: 'inline' }}>
                                <input type="hidden" name="id" value={l.id} />
                                <button type="submit" className="btn btn-approve" style={{ padding: '5px 12px', fontSize: '0.75rem' }}>
                                  Verify
                                </button>
                              </form>
                              <form action={rejectLawyer} style={{ display: 'inline' }}>
                                <input type="hidden" name="id" value={l.id} />
                                <button type="submit" className="btn btn-reject" style={{ padding: '5px 12px', fontSize: '0.75rem' }}>
                                  Reject
                                </button>
                              </form>
                            </>
                          )}
                          {l.verification_status === 'verified' && (
                            <form action={rejectLawyer} style={{ display: 'inline' }}>
                              <input type="hidden" name="id" value={l.id} />
                              <button type="submit" className="btn btn-reject" style={{ padding: '5px 12px', fontSize: '0.75rem' }}>
                                Revoke
                              </button>
                            </form>
                          )}
                          {l.verification_status === 'rejected' && (
                            <form action={verifyLawyer} style={{ display: 'inline' }}>
                              <input type="hidden" name="id" value={l.id} />
                              <button type="submit" className="btn btn-approve" style={{ padding: '5px 12px', fontSize: '0.75rem' }}>
                                Reinstate
                              </button>
                            </form>
                          )}
                          <EditLawyerDialog lawyer={{ id: l.id, name: l.name, role: l.role || '', location: l.location || '' }} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', alignItems: 'center' }}>
            <span style={{ color: '#64748B', fontSize: '0.85rem' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {page > 1 && (
                <a href={`/lawyers?${new URLSearchParams({ ...(status !== 'all' && { status }), ...(search && { search }), page: String(page - 1) })}`}
                   className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '0.8rem', textDecoration: 'none' }}>
                  ← Prev
                </a>
              )}
              {page < totalPages && (
                <a href={`/lawyers?${new URLSearchParams({ ...(status !== 'all' && { status }), ...(search && { search }), page: String(page + 1) })}`}
                   className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '0.8rem', textDecoration: 'none' }}>
                  Next →
                </a>
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
