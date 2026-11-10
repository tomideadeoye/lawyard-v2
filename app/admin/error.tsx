'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin] route error:', error);
  }, [error]);

  return (
    <div style={{ maxWidth: '640px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>This admin screen failed to load</h2>
      <p style={{ color: '#94A3B8', marginBottom: '24px' }}>
        The error is logged. Nothing was changed — reloading is safe.
      </p>
      {error.digest && (
        <p style={{ color: '#64748B', fontSize: '0.75rem', marginBottom: '24px' }}>
          Reference: <code>{error.digest}</code>
        </p>
      )}
      <button
        onClick={() => reset()}
        className="btn btn-primary"
        style={{ padding: '10px 18px' }}
      >
        Try again
      </button>
    </div>
  );
}
