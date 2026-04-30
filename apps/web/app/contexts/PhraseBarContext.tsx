'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PhraseBarItem } from '@/app/components/phrase-bar/types';

const STORAGE_KEY = 'phraseBarItems';

interface PhraseBarContextValue {
  items: PhraseBarItem[];
  addItem: (item: Omit<PhraseBarItem, 'id'>) => void;
  removeLast: () => void;
  clear: () => void;
  joinedText: string;
}

const PhraseBarContext = createContext<PhraseBarContextValue | undefined>(undefined);

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (e.g. older jsdom).
  return `phrasebar-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readFromSessionStorage(): PhraseBarItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is PhraseBarItem =>
        entry &&
        typeof entry === 'object' &&
        typeof entry.id === 'string' &&
        typeof entry.text === 'string' &&
        (entry.symbolUrl === undefined || typeof entry.symbolUrl === 'string')
    );
  } catch {
    return [];
  }
}

function writeToSessionStorage(items: PhraseBarItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // sessionStorage can throw in private-mode / full quota — ignore.
  }
}

export function PhraseBarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PhraseBarItem[]>([]);
  const hydrated = useRef(false);

  // Rehydrate from sessionStorage once on mount (client only).
  useEffect(() => {
    setItems(readFromSessionStorage());
    hydrated.current = true;
  }, []);

  // Persist after hydration. Skip the first render so we don't clobber
  // stored items with an empty default before rehydration completes.
  useEffect(() => {
    if (!hydrated.current) return;
    writeToSessionStorage(items);
  }, [items]);

  const addItem = useCallback((item: Omit<PhraseBarItem, 'id'>) => {
    setItems((prev) => [...prev, { ...item, id: generateId() }]);
  }, []);

  const removeLast = useCallback(() => {
    setItems((prev) => (prev.length === 0 ? prev : prev.slice(0, -1)));
  }, []);

  const clear = useCallback(() => {
    setItems((prev) => (prev.length === 0 ? prev : []));
  }, []);

  const joinedText = useMemo(() => items.map((item) => item.text).join(' '), [items]);

  const value = useMemo<PhraseBarContextValue>(
    () => ({ items, addItem, removeLast, clear, joinedText }),
    [items, addItem, removeLast, clear, joinedText]
  );

  return <PhraseBarContext.Provider value={value}>{children}</PhraseBarContext.Provider>;
}

export function usePhraseBar(): PhraseBarContextValue {
  const ctx = useContext(PhraseBarContext);
  if (ctx === undefined) {
    throw new Error('usePhraseBar must be used within a PhraseBarProvider');
  }
  return ctx;
}
