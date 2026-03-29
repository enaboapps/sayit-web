'use client';

import { useEffect, useState } from 'react';
import { CheckCircleIcon, WifiIcon } from '@heroicons/react/24/outline';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

export default function ConnectivityBanner() {
  const { isOnline, wasOffline, clearRecoveredState } = useOnlineStatus();
  const [showRecovered, setShowRecovered] = useState(false);

  useEffect(() => {
    if (!isOnline || !wasOffline) {
      setShowRecovered(false);
      return;
    }

    setShowRecovered(true);

    const timeout = window.setTimeout(() => {
      setShowRecovered(false);
      clearRecoveredState();
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [clearRecoveredState, isOnline, wasOffline]);

  if (isOnline && !showRecovered) {
    return null;
  }

  const isOfflineBanner = !isOnline;

  return (
    <div
      className={`sticky top-0 z-40 border-b px-4 py-3 text-sm ${
        isOfflineBanner
          ? 'border-amber-900 bg-amber-500/10 text-amber-200'
          : 'border-emerald-900 bg-emerald-500/10 text-emerald-200'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-4xl items-start gap-3">
        {isOfflineBanner ? (
          <WifiIcon className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
        )}
        <p>
          {isOfflineBanner
            ? "You're offline. Text communication and browser speech still work."
            : 'Connection restored. Online features are available again.'}
        </p>
      </div>
    </div>
  );
}
