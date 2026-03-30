'use client';

import { useEffect, useState } from 'react';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';

export default function InstallBanner() {
  const { mode, isVisible, dismiss, promptInstall } = useInstallPrompt();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Defer rendering until after mount to prevent hydration mismatch.
  // useInstallPrompt checks navigator.userAgent which differs server vs client.
  if (!hasMounted || !isVisible) {
    return null;
  }

  const isIOS = mode === 'ios';

  return (
    <div
      className="sticky top-0 z-30 border-b border-primary-900 bg-surface px-4 py-3 text-sm text-primary-100"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-4xl items-start gap-3">
        <ArrowDownTrayIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">
            Install SayIt! for faster offline access.
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {isIOS
              ? 'On iPhone or iPad, tap Share and choose Add to Home Screen.'
              : 'Install the app to open it from your home screen and keep text communication close at hand.'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isIOS && (
            <button
              type="button"
              onClick={() => void promptInstall()}
              className="rounded-full bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-600"
            >
              Install
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full p-1.5 text-text-secondary transition-colors hover:bg-surface hover:text-foreground"
            aria-label="Dismiss install banner"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
