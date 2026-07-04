'use client';

interface LiveTypingBannerProps {
  /** Ends the live typing session immediately. */
  onEnd: () => void;
  /** Reopens the live typing sheet (share link, session details). */
  onOpenDetails: () => void;
}

export default function LiveTypingBanner({ onEnd, onOpenDetails }: LiveTypingBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex shrink-0 items-center gap-3 border-b border-green-500/40 bg-status-success px-4 py-2"
    >
      <button
        type="button"
        onClick={onOpenDetails}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        aria-label="Live Typing active — view session details"
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-green-400">Live Typing active</span>
          <span className="block truncate text-xs text-text-secondary">
            Others can see what you type
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onEnd}
        className="shrink-0 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-green-600 transition-colors"
        aria-label="End live typing"
      >
        End
      </button>
    </div>
  );
}
