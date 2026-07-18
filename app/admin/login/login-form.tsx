'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginWithMagicLink } from './actions';
import TurnstileWidget from '@/components/directory/auth/TurnstileWidget';

export default function AdminLoginForm() {
  const [isPending, startTransition] = useTransition();
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || searchParams.get('error');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('redirectTo', `${window.location.origin}/auth/callback`);

    startTransition(async () => {
      try {
        const res = await loginWithMagicLink(formData);
        if (res && res.success) {
          setMagicLinkSent(true);
        }
      } catch (err: any) {
        if (err && err.digest && err.digest.startsWith('NEXT_REDIRECT')) {
          throw err;
        }
        setError(err instanceof Error ? err.message : 'Failed to send magic link');
      }
    });
  };

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      {/* Alert Messages */}
      {(message || error) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px', borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#EF4444', fontSize: '0.85rem', marginBottom: '20px',
          fontWeight: 500
        }}>
          <span>⚠️</span>
          <div>
            {error || (message === 'unauthorized' || message === 'Unauthorized. Admin role required.' ? 'Unauthorized access. Administrator role is required.' : message)}
          </div>
        </div>
      )}

      <div className="glass-card" style={{ background: 'rgba(22, 22, 23, 0.6)', backdropFilter: 'blur(16px)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px', textAlign: 'center' }}>
          Admin Authentication
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '24px', textAlign: 'center' }}>
          Enter your administrator email to receive a secure sign-in magic link.
        </p>

        {magicLinkSent ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✉️</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '8px' }}>Check your inbox</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.5 }}>
              We have sent a magic link to your email. Click it to access the admin dashboard.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="email" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled={isPending}
                placeholder="admin@lawyard.org"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
              />
            </div>

            <input type="hidden" name="captchaToken" value={turnstileToken || ''} />
            <TurnstileWidget onToken={setTurnstileToken} />
            <button
              type="submit"
              disabled={isPending || !turnstileToken}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontWeight: 600, fontSize: '0.95rem', marginTop: '6px' }}
            >
              {isPending ? 'Sending Link...' : 'Request Access Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
