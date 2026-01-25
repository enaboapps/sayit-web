'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type UseDoubleEnterOptions = {
  enabled: boolean;
  timeoutMs: number;
  onSingleEnter: () => void;
  onDoubleEnter: () => void;
};

type UseDoubleEnterResult = {
  handleEnter: () => boolean;
  resetPending: () => void;
  isPending: boolean;
  remainingMs: number;
};

export function useDoubleEnter({
  enabled,
  timeoutMs,
  onSingleEnter,
  onDoubleEnter,
}: UseDoubleEnterOptions): UseDoubleEnterResult {
  const pendingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);

  const resetPending = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startRef.current = null;
    pendingRef.current = false;
    setIsPending(false);
    setRemainingMs(0);
  }, []);

  const triggerSingle = useCallback(() => {
    resetPending();
    onSingleEnter();
  }, [onSingleEnter, resetPending]);

  const triggerDouble = useCallback(() => {
    resetPending();
    onDoubleEnter();
  }, [onDoubleEnter, resetPending]);

  const handleEnter = useCallback(() => {
    if (!enabled) {
      onSingleEnter();
      return true;
    }

    if (pendingRef.current) {
      triggerDouble();
      return true;
    }

    pendingRef.current = true;
    setIsPending(true);
    startRef.current = Date.now();
    setRemainingMs(timeoutMs);
    intervalRef.current = window.setInterval(() => {
      if (!startRef.current) return;
      const elapsed = Date.now() - startRef.current;
      const nextRemaining = Math.max(0, timeoutMs - elapsed);
      setRemainingMs(nextRemaining);
    }, 100);
    timeoutRef.current = window.setTimeout(() => {
      triggerSingle();
    }, timeoutMs);
    return true;
  }, [enabled, onSingleEnter, timeoutMs, triggerDouble, triggerSingle]);

  useEffect(() => () => resetPending(), [resetPending]);

  useEffect(() => {
    if (!enabled) {
      resetPending();
    }
  }, [enabled, resetPending]);

  return { handleEnter, resetPending, isPending, remainingMs };
}
