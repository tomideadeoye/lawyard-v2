'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard] route error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
      <h2 className="text-2xl font-bold mb-4">This page didn&apos;t load</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Your details are safe — nothing was submitted. Try again, and if it keeps failing, reload the dashboard.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/70 mb-6">
          Reference: <code>{error.digest}</code>
        </p>
      )}
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
