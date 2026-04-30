'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MIN_HISTORY_ENTRIES } from '@/lib/reply-suggestions-constants';

type UseReplySuggestionsOptions = {
  history: string[];
  enabled: boolean;
};

type UseReplySuggestionsResult = {
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};
const AUTO_REFRESH_DEBOUNCE_MS = 800;

export function useReplySuggestions({
  history,
  enabled,
}: UseReplySuggestionsOptions): UseReplySuggestionsResult {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const trimmedHistory = useMemo(
    () => history.map((entry) => entry.trim()).filter(Boolean),
    [history]
  );
  const historyKey = useMemo(() => trimmedHistory.join('\n'), [trimmedHistory]);

  const fetchSuggestions = useCallback(async () => {
    if (!enabled || trimmedHistory.length < MIN_HISTORY_ENTRIES) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setSuggestions([]);
      setError(null);
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reply-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history: trimmedHistory }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setSuggestions([]);
          setError(null);
          return;
        }

        const error = await response.text();
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
        setError(error);
        return;
      }

      const data = await response.json();
      const nextSuggestions = Array.isArray(data?.suggestions)
        ? data.suggestions.filter((value: unknown): value is string => typeof value === 'string')
        : [];
      setSuggestions(nextSuggestions);
    } catch (err) {
      if (abortController.signal.aborted) {
        return;
      }
      console.error('Failed to fetch reply suggestions:', err);
      setSuggestions([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [enabled, trimmedHistory]);

  useEffect(() => {
    if (!enabled || trimmedHistory.length < MIN_HISTORY_ENTRIES) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setSuggestions([]);
      setError(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      void fetchSuggestions();
    }, AUTO_REFRESH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [enabled, fetchSuggestions, historyKey, trimmedHistory.length]);

  useEffect(() => () => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    refresh: fetchSuggestions,
  };
}
