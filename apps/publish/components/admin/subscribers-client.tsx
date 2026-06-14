'use client';

import { useState } from 'react';
import { toggleSubscriberStatus, exportSubscribersToCSV, sendNewsletter } from '@/app/admin/subscribers/actions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SubscribersClientPage({ subscribers }: { subscribers: any[] }) {
  const [data, setData] = useState(subscribers);

  const handleExport = async () => {
    const result = await exportSubscribersToCSV();
    if (result.success && result.csv) {
      const blob = new Blob([result.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'subscribers.csv';
      a.click();
    }
  };

  const chartData = data.reduce((acc: any, sub: any) => {
    const month = new Date(sub.created_at).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const formattedChartData = Object.entries(chartData).map(([month, count]) => ({
    month,
    count
  }));

  const total = data.length;
  const active = data.filter((s: any) => s.active).length;
  const inactive = total - active;

  return (<> 

        <header style={{ marginBottom: '32px' }}>
          <h1 className="text-gradient">Newsletter Subscribers</h1>
        </header>

        <section className="stats-grid" style={{ marginBottom: '32px' }}>
          <div className="stat-card">
            <span className="stat-label">Total Subscribers</span>
            <span className="stat-value">{total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Active</span>
            <span className="stat-value" style={{ color: '#10B981' }}>{active}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Inactive</span>
            <span className="stat-value" style={{ color: '#64748B' }}>{inactive}</span>
          </div>
        </section>

        {/* Broadcast Form */}
        <section className="section-card" style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '16px' }}>Send Newsletter</h2>
          <BroadcastForm />
        </section>

        <section className="section-card" style={{ marginBottom: '32px', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="section-card">
          <div className="section-header-row" style={{ marginBottom: '20px' }}>
            <h2>Subscribers List</h2>
            <button onClick={handleExport} className="btn">Export CSV</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px' }}>Email</th>
                <th style={{ padding: '12px' }}>Subscribed Date</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((sub: any) => (
                <tr key={sub.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '12px' }}>{sub.email}</td>
                  <td style={{ padding: '12px' }}>{new Date(sub.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge-${sub.active ? 'active' : 'inactive'}`}>
                      {sub.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <form action={toggleSubscriberStatus}>
                      <input type="hidden" name="id" value={sub.id} />
                      <input type="hidden" name="active" value={String(sub.active)} />
                      <button type="submit" className="btn-ghost">Toggle Status</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
  </>);
}

function BroadcastForm() {
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent?: number; failed?: number } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult(null);

    const formData = new FormData();
    formData.set('subject', subject);
    formData.set('html', html);

    const res = await sendNewsletter(formData) as any;
    if (res.success) {
      setResult({ sent: res.sent, failed: res.failed });
      if (res.failed === 0) { setSubject(''); setHtml(''); }
    } else {
      alert(res.error || 'Failed to send');
    }
    setSending(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input
        type="text"
        value={subject}
        onChange={e => setSubject(e.target.value)}
        placeholder="Email subject"
        required
        style={{
          padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--card-border)',
          background: 'var(--card)', color: 'var(--foreground)', fontSize: '0.9rem',
        }}
      />
      <textarea
        value={html}
        onChange={e => setHtml(e.target.value)}
        placeholder="HTML body"
        rows={8}
        required
        style={{
          padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--card-border)',
          background: 'var(--card)', color: 'var(--foreground)', fontSize: '0.85rem',
          fontFamily: 'monospace', resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button type="submit" disabled={sending} className="btn" style={{ padding: '10px 24px' }}>
          {sending ? 'Sending...' : 'Send to All Active Subscribers'}
        </button>
        {result && (
          <span style={{ fontSize: '0.85rem', color: result.failed ? '#F59E0B' : '#10B981' }}>
            Sent: {result.sent}{result.failed ? `, Failed: ${result.failed}` : ''}
          </span>
        )}
      </div>
    </form>
  );
}
