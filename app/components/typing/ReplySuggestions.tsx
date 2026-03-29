'use client';

import { ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useReplySuggestions } from '@/lib/hooks/useReplySuggestions';
import { useSubscription } from '@/app/hooks/useSubscription';
import { useAuth } from '@/app/contexts/AuthContext';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { MIN_HISTORY_ENTRIES } from '@/lib/reply-suggestions-constants';

interface ReplySuggestionsProps {
  history: string[];
  enabled: boolean;
  onSelectSuggestion: (suggestion: string) => void;
  variant?: 'card' | 'inline';
  contextLabel?: string;
  className?: string;
}

export default function ReplySuggestions({
  history,
  enabled,
  onSelectSuggestion,
  variant = 'card',
  contextLabel = 'Based on your recent completed messages',
  className = '',
}: ReplySuggestionsProps) {
  const { user, loading: authLoading } = useAuth();
  const { isActive: hasSubscription, loading: subscriptionLoading } = useSubscription();
  const { isOnline } = useOnlineStatus();
  const {
    suggestions,
    isLoading,
    error,
    refresh,
  } = useReplySuggestions({
    history,
    enabled: enabled && isOnline && !authLoading && !!user && hasSubscription,
  });

  if (authLoading || subscriptionLoading || !enabled || !user || !hasSubscription) {
    return null;
  }

  if (!isOnline) {
    if (variant === 'inline') {
      return (
        <p className={`text-xs text-amber-500 ${className}`}>
          Reply suggestions require internet and will return when you reconnect.
        </p>
      );
    }

    return (
      <div className={`rounded-2xl border border-border bg-surface px-3 py-2.5 shadow-sm ${className}`}>
        <div className="mb-1 flex items-center gap-1.5">
          <SparklesIcon className="h-4 w-4 text-primary-500" />
          <p className="text-xs font-semibold text-foreground">Reply suggestions</p>
        </div>
        <p className="text-sm text-amber-500">
          Reply suggestions require internet and will return when you reconnect.
        </p>
      </div>
    );
  }

  const hasEnoughHistory = history.length >= MIN_HISTORY_ENTRIES;
  if (!hasEnoughHistory && !isLoading) {
    return null;
  }

  const chips = (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {isLoading
        ? [0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-8 w-full animate-pulse rounded-xl bg-surface-hover sm:w-[calc(50%-0.25rem)]"
          />
        ))
        : suggestions.map((suggestion, index) => (
          <button
            key={`${index}-${suggestion}`}
            type="button"
            onClick={() => onSelectSuggestion(suggestion)}
            className="rounded-xl bg-surface-hover px-3 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-primary-950 hover:text-primary-500"
          >
            {suggestion}
          </button>
        ))}
    </div>
  );

  if (variant === 'inline') {
    if (!isLoading && suggestions.length === 0) return null;
    return chips;
  }

  return (
    <div className={`rounded-2xl border border-border bg-surface px-3 py-2.5 shadow-sm ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <SparklesIcon className="h-4 w-4 text-primary-500" />
          <div>
            <p className="text-xs font-semibold text-foreground">Reply suggestions</p>
            <p className="text-xs text-text-secondary">{contextLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={isLoading}
          className="rounded-full p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
          aria-label="Refresh reply suggestions"
        >
          <ArrowPathIcon className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {chips}

      {!isLoading && !error && suggestions.length === 0 && (
        <p className="text-sm text-text-secondary">
          Speak a few messages to start getting next-reply suggestions.
        </p>
      )}

      {!isLoading && error && (
        <p className="text-sm text-red-400">
          Suggestions are temporarily unavailable.
        </p>
      )}
    </div>
  );
}
