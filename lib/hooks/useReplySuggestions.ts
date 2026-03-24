'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type UseReplySuggestionsOptions = {
  history: string[];
  enabled: boolean;
  refreshToken?: number;
};

type UseReplySuggestionsResult = {
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const MIN_HISTORY_ENTRIES = 3;

export function useReplySuggestions({
  history,
  enabled,
  refreshToken = 0,
}: UseReplySuggestionsOptions): UseReplySuggestionsResult {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedHistory = useMemo(
    () => history.map((entry) => entry.trim()).filter(Boolean),
    [history]
  );

  const fetchSuggestions = useCallback(async () => {
    if (!enabled || trimmedHistory.length < MIN_HISTORY_ENTRIES) {
      setSuggestions([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reply-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history: trimmedHistory }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          setSuggestions([]);
          setError(null);
          return;
        }

        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      const nextSuggestions = Array.isArray(data?.suggestions)
        ? data.suggestions.filter((value: unknown): value is string => typeof value === 'string')
        : [];

      setSuggestions(nextSuggestions);
    } catch (err) {
      console.error('Failed to fetch reply suggestions:', err);
      setSuggestions([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, trimmedHistory]);

  useEffect(() => {
    if (!enabled || trimmedHistory.length < MIN_HISTORY_ENTRIES) {
      setSuggestions([]);
      setError(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      void fetchSuggestions();
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [enabled, fetchSuggestions, refreshToken, trimmedHistory.length]);

  return {
    suggestions,
    isLoading,
    error,
    refresh: fetchSuggestions,
  };
}
