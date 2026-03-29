'use client';

import { useCallback } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';

export default function OfflinePage() {
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="bg-surface rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-surface-hover rounded-3xl flex items-center justify-center">
            <ArrowPathIcon className="w-10 h-10 text-primary-500" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">You're Offline</h1>
        <p className="text-text-secondary mb-8">
          You can still use text communication and browser speech from the home screen. Boards, AI features,
          and cloud sync need an internet connection.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            asChild
            className="w-full gap-2"
          >
            <Link href="/">
              <span>Go to Home</span>
            </Link>
          </Button>
          <Button
            onClick={handleRetry}
            variant="outline"
            className="w-full gap-2"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span>Retry Connection</span>
          </Button>
        </div>
      </div>
    </div>
  );
} 
