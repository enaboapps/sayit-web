'use client';

import { use } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useSettings } from '@/app/contexts/SettingsContext';
import AnimatedLoading from '@/app/components/phrases/AnimatedLoading';
import { ExclamationTriangleIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function TypingShareViewPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params);
  const session = useQuery(api.typingSessions.getTypingSession, { sessionKey: key });
  const { uiPreferences, updateUIPreference } = useSettings();
  const loading = session === undefined;
  const sessionMissing = session === null;
  const fontSize = uiPreferences.typingShareFontSize;

  const increaseFontSize = () => {
    updateUIPreference('typingShareFontSize', Math.min(fontSize + 4, 64));
  };

  const decreaseFontSize = () => {
    updateUIPreference('typingShareFontSize', Math.max(fontSize - 4, 12));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AnimatedLoading />
      </div>
    );
  }

  if (sessionMissing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="mx-auto w-20 h-20 bg-status-error rounded-3xl flex items-center justify-center mb-6">
            <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Session Unavailable</h1>
          <p className="text-text-secondary">This typing session does not exist or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-surface rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300">
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-foreground">Live Typing</h1>
            <p className="text-text-secondary mt-2">
              You are viewing a live typing session. Updates appear in real-time.
            </p>
          </div>

          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            <div className="bg-background rounded-3xl shadow-md p-8 min-h-[20rem]">
              {session?.content !== undefined && session?.content !== null ? (
                <p
                  className="text-foreground whitespace-pre-wrap break-words"
                  style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
                >
                  {session.content || (
                    <span className="text-text-tertiary italic">Text cleared</span>
                  )}
                </p>
              ) : (
                <p className="text-text-tertiary italic" style={{ fontSize: `${fontSize}px` }}>
                  No content yet. Waiting for the sender to start typing...
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-3 bg-status-success px-4 py-2 rounded-3xl">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-500">Connected</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-text-secondary">Font Size</span>
                <button
                  onClick={decreaseFontSize}
                  className="w-10 h-10 flex items-center justify-center bg-surface-hover hover:bg-surface-hover text-text-secondary hover:text-primary-500 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                  aria-label="Decrease font size"
                  disabled={fontSize <= 12}
                >
                  <MinusIcon className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold text-foreground min-w-[3rem] text-center">
                  {fontSize}px
                </span>
                <button
                  onClick={increaseFontSize}
                  className="w-10 h-10 flex items-center justify-center bg-surface-hover hover:bg-surface-hover text-text-secondary hover:text-primary-500 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                  aria-label="Increase font size"
                  disabled={fontSize >= 64}
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
