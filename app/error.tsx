'use client';

import { useEffect } from 'react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh text-center p-6 bg-background">
      <div className="max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-3">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          We encountered an unexpected error. This is usually a temporary issue — 
          please try again. If the problem persists, contact support.
        </p>

        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-semibold hover:opacity-90 transition-all active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Try again
        </button>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="text-sm text-muted-foreground cursor-pointer font-medium">
              Error details
            </summary>
            <pre className="mt-2 text-xs text-destructive bg-destructive/5 p-4 rounded-xl overflow-auto max-h-48 border border-destructive/10">
              {error.name}: {error.message}
              {'\n'}
              {error.digest && <>Digest: {error.digest}{'\n'}</>}
              {error.stack && error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
