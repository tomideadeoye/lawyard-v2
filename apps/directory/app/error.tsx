'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
      <h2 className="text-2xl font-bold mb-4">Service Temporarily Unavailable</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        We're having trouble connecting to our services. Please try again in a few moments.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
