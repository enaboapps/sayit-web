'use client';

import { ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useReplySuggestions } from '@/lib/hooks/useReplySuggestions';
import { useSubscription } from '@/app/hooks/useSubscription';

interface ReplySuggestionsProps {
  history: string[];
  enabled: boolean;
  refreshToken: number;
  onSelectSuggestion: (suggestion: string) => void;
  className?: string;
}

export default function ReplySuggestions({
  history,
  enabled,
  refreshToken,
  onSelectSuggestion,
  className = '',
}: ReplySuggestionsProps) {
  const { isActive: hasSubscription, loading: subscriptionLoading } = useSubscription();
  const {
    suggestions,
    isLoading,
    error,
    refresh,
  } = useReplySuggestions({
    history,
    enabled: enabled && hasSubscription,
    refreshToken,
  });

  if (subscriptionLoading || !enabled || !hasSubscription) {
    return null;
  }

  const hasEnoughHistory = history.length >= 3;
  if (!hasEnoughHistory && !isLoading) {
    return null;
  }

  return (
    <div className={`rounded-3xl border border-border bg-surface px-4 py-3 shadow-md ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-primary-500" />
          <div>
            <p className="text-sm font-semibold text-foreground">Reply suggestions</p>
            <p className="text-xs text-text-secondary">Based on your recent completed messages</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={isLoading}
          className="rounded-full p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
          aria-label="Refresh reply suggestions"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading && (
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-10 w-full animate-pulse rounded-2xl bg-surface-hover sm:w-[calc(50%-0.25rem)]"
            />
          ))}
        </div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSelectSuggestion(suggestion)}
              className="rounded-2xl bg-surface-hover px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-primary-950 hover:text-primary-500"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

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
