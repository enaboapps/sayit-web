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

/**
 * In-memory board navigation stack.
 *
 * Records the chain of source boards a user reached the current board *from*
 * via navigate-tile taps. The current board is NOT in the stack; the stack
 * holds the boards we'd return to in order, most-recent on top.
 *
 * Reset semantics (per spec):
 * - `push(sourceBoardId)`: called by NavigateTile right before switching the
 *   selected board to its target.
 * - `pop()`: called by the board-header back button. Returns the popped id
 *   so the caller can switch the selected board to it.
 * - `clear()`: called by `usePhraseBoardData.handleSelectBoard` whenever a
 *   board is picked through any non-tile path (sidebar, dropdown, swipe).
 *
 * Not persisted — survives in-tab navigation only. A reload starts fresh.
 */
interface BoardNavStackContextValue {
  stack: string[];
  canPop: boolean;
  push: (sourceBoardId: string) => void;
  pop: () => string | null;
  clear: () => void;
}

const BoardNavStackContext = createContext<BoardNavStackContextValue | undefined>(undefined);

export function BoardNavStackProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<string[]>([]);
  // Mirror state in a ref so synchronous calls (e.g. two rapid back-taps in
  // the same render frame) read up-to-date data instead of a stale closure
  // capture.
  const stackRef = useRef<string[]>([]);
  useEffect(() => {
    stackRef.current = stack;
  }, [stack]);

  const push = useCallback((sourceBoardId: string) => {
    // Cap stack depth to guard against runaway A↔B↔A cycles.
    const MAX_DEPTH = 32;
    const next = [...stackRef.current, sourceBoardId];
    const trimmed = next.length > MAX_DEPTH ? next.slice(next.length - MAX_DEPTH) : next;
    stackRef.current = trimmed;
    setStack(trimmed);
  }, []);

  const pop = useCallback((): string | null => {
    if (stackRef.current.length === 0) return null;
    const popped = stackRef.current[stackRef.current.length - 1];
    const next = stackRef.current.slice(0, -1);
    stackRef.current = next;
    setStack(next);
    return popped;
  }, []);

  const clear = useCallback(() => {
    if (stackRef.current.length === 0) return;
    stackRef.current = [];
    setStack([]);
  }, []);

  const value = useMemo<BoardNavStackContextValue>(
    () => ({
      stack,
      canPop: stack.length > 0,
      push,
      pop,
      clear,
    }),
    [stack, push, pop, clear]
  );

  return (
    <BoardNavStackContext.Provider value={value}>
      {children}
    </BoardNavStackContext.Provider>
  );
}

export function useBoardNavStack(): BoardNavStackContextValue {
  const ctx = useContext(BoardNavStackContext);
  if (ctx === undefined) {
    throw new Error('useBoardNavStack must be used within a BoardNavStackProvider');
  }
  return ctx;
}

/** Safe variant — returns null when used outside a provider. */
export function useBoardNavStackOptional(): BoardNavStackContextValue | null {
  return useContext(BoardNavStackContext) ?? null;
}
