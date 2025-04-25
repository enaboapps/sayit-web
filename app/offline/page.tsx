'use client';

import { useCallback } from 'react';

export default function OfflinePage() {
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">You're offline</h1>
      <p className="text-center mb-4">
        Please check your internet connection and try again.
      </p>
      <button
        onClick={handleRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Retry
      </button>
    </div>
  );
} 