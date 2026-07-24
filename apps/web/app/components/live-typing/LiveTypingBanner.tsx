'use client';

import { PauseIcon, PlayIcon } from '@heroicons/react/24/solid';

interface LiveTypingBannerProps {
  isPaused: boolean;
  isTransitioning: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onOpenDetails: () => void;
}

export default function LiveTypingBanner({
  isPaused,
  isTransitioning,
  onPause,
  onResume,
  onEnd,
  onOpenDetails,
}: LiveTypingBannerProps) {
  return (
    <div
      className={`flex shrink-0 items-center gap-2 border-b px-2 py-2 sm:px-4 ${
        isPaused
          ? 'border-amber-500/50 bg-status-warning'
          : 'border-green-500/40 bg-status-success'
      }`}
    >
      <button
        type="button"
        onClick={onOpenDetails}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-control)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        aria-label={`Live Typing ${isPaused ? 'paused' : 'active'} — view session details`}
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
          {!isPaused && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 motion-safe:animate-ping" />
          )}
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              isPaused ? 'bg-amber-500' : 'bg-green-500'
            }`}
          />
        </span>
        <span className="min-w-0" role="status" aria-live="polite">
          <span
            className={`block truncate text-sm font-semibold ${
              isPaused
                ? 'text-status-warning-foreground'
                : 'text-status-success-foreground'
            }`}
          >
            Live Typing {isPaused ? 'paused' : 'active'}
          </span>
          <span className="hidden truncate text-xs text-text-secondary sm:block">
            {isPaused
              ? 'Your typing is private until you resume'
              : 'Others can see what you type'}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={isPaused ? onResume : onPause}
        disabled={isTransitioning}
        className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-wait disabled:opacity-50"
        aria-label={isPaused ? 'Resume Live Typing' : 'Pause Live Typing'}
      >
        {isPaused ? (
          <PlayIcon className="h-4 w-4" aria-hidden="true" />
        ) : (
          <PauseIcon className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
      </button>

      <button
        type="button"
        onClick={onEnd}
        disabled={isTransitioning}
        className="min-h-11 shrink-0 rounded-[var(--radius-control)] bg-error px-3 text-xs font-semibold text-white transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-wait disabled:opacity-50"
        aria-label="End live typing"
      >
        End
      </button>
    </div>
  );
}
