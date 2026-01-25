'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type UndoEntry = {
  tabId: string;
  text: string;
};

type UseUndoClearOptions = {
  timeoutMs: number;
  onRestore: (entry: UndoEntry) => void;
};

type ClearWithUndoOptions = {
  tabId: string;
  text: string;
  onClear: () => void;
};

type UseUndoClearResult = {
  clearWithUndo: (options: ClearWithUndoOptions) => void;
  undo: () => void;
  resetUndo: () => void;
  canUndo: boolean;
  remainingMs: number;
  entry: UndoEntry | null;
};

export function useUndoClear({ timeoutMs, onRestore }: UseUndoClearOptions): UseUndoClearResult {
  const [entry, setEntry] = useState<UndoEntry | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const expiryRef = useRef<number | null>(null);

  const resetUndo = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    expiryRef.current = null;
    setEntry(null);
    setRemainingMs(0);
  }, []);

  const startTimer = useCallback((expiresAt: number) => {
    expiryRef.current = expiresAt;
    setRemainingMs(Math.max(0, expiresAt - Date.now()));
    intervalRef.current = window.setInterval(() => {
      if (!expiryRef.current) return;
      const nextRemaining = Math.max(0, expiryRef.current - Date.now());
      setRemainingMs(nextRemaining);
    }, 100);
    timeoutRef.current = window.setTimeout(() => {
      resetUndo();
    }, Math.max(0, expiresAt - Date.now()));
  }, [resetUndo]);

  const clearWithUndo = useCallback(({ tabId, text, onClear }: ClearWithUndoOptions) => {
    onClear();

    if (!text.trim()) {
      resetUndo();
      return;
    }

    setEntry({ tabId, text });
    startTimer(Date.now() + timeoutMs);
  }, [resetUndo, startTimer, timeoutMs]);

  const undo = useCallback(() => {
    if (!entry) return;
    onRestore(entry);
    resetUndo();
  }, [entry, onRestore, resetUndo]);

  useEffect(() => () => resetUndo(), [resetUndo]);

  return {
    clearWithUndo,
    undo,
    resetUndo,
    canUndo: Boolean(entry) && remainingMs > 0,
    remainingMs,
    entry,
  };
}
