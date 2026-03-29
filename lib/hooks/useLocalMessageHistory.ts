'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'localTypingHistory';
const MAX_HISTORY_ENTRIES = 10;

export interface LocalMessageHistoryEntry {
  id: string;
  text: string;
  source: 'speak' | 'speakAndClear' | 'clear';
  tabId?: string | null;
  completedAt: number;
}

interface RecordLocalMessagePayload {
  text: string;
  source: 'speak' | 'speakAndClear' | 'clear';
  tabId?: string | null;
}

function parseStoredHistory(value: string | null): LocalMessageHistoryEntry[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as LocalMessageHistoryEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry): entry is LocalMessageHistoryEntry => (
        !!entry
        && typeof entry.id === 'string'
        && typeof entry.text === 'string'
        && typeof entry.source === 'string'
        && typeof entry.completedAt === 'number'
      ))
      .slice(0, MAX_HISTORY_ENTRIES);
  } catch (error) {
    console.error('Failed to parse local typing history:', error);
    return [];
  }
}

export function useLocalMessageHistory() {
  const [messages, setMessages] = useState<LocalMessageHistoryEntry[]>([]);
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setMessages(parseStoredHistory(window.localStorage.getItem(STORAGE_KEY)));
    setHasHydratedStorage(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !hasHydratedStorage) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [hasHydratedStorage, messages]);

  const recordMessage = useCallback((payload: RecordLocalMessagePayload) => {
    const trimmedText = payload.text.trim();
    if (!trimmedText) {
      return;
    }

    setMessages((current) => {
      const nextEntry: LocalMessageHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: trimmedText,
        source: payload.source,
        tabId: payload.tabId,
        completedAt: Date.now(),
      };

      const deduped = current.filter((entry) => (
        entry.text !== trimmedText
        || entry.tabId !== payload.tabId
      ));

      return [nextEntry, ...deduped].slice(0, MAX_HISTORY_ENTRIES);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    recordMessage,
    clearHistory,
  };
}
