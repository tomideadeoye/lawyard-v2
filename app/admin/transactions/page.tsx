import { getTransactions } from '@/lib/admin/api'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    success: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: 'rgba(16, 185, 129, 0.2)' },
    pending: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' },
    failed: { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'rgba(239, 68, 68, 0.2)' },
  }
  const s = map[status]
  if (!s) return <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{status}</span>
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
      textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontWeight: 600,
  color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px', whiteSpace: 'nowrap',
}

export default async function TransactionsPage() {
  const result = await getTransactions()
  const transactions = result.data ?? []
  const error = result.error

  return (
    <>
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-gradient">Transactions</h1>
          <p style={{ color: '#94A3B8', fontSize: '0.95rem', marginTop: '4px' }}>
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
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

      <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={thStyle}>Reference</th>
                <th style={thStyle}>Plan</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Currency</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Article ID</th>
                <th style={thStyle}>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>No transactions found.</td></tr>
              ) : (
                transactions.map((tx, i) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--card-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ ...tdStyle, fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem' }}>{tx.reference}</td>
                    <td style={{ ...tdStyle, color: '#94A3B8' }}>{tx.plan_name}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      ₦{Number(tx.amount).toLocaleString()}
                    </td>
                    <td style={{ ...tdStyle, color: '#94A3B8' }}>{tx.currency}</td>
                    <td style={tdStyle}><StatusBadge status={tx.status} /></td>
                    <td style={{ ...tdStyle, color: '#94A3B8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.metadata?.contact_email || tx.metadata?.contact_name || '—'}
                    </td>
                    <td style={{ ...tdStyle, color: '#94A3B8', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {tx.metadata?.article_id ? tx.metadata.article_id.slice(0, 8) + '…' : '—'}
                    </td>
                    <td style={{ ...tdStyle, color: '#94A3B8' }}>{formatDate(tx.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
