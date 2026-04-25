'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
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

  const push = useCallback((sourceBoardId: string) => {
    setStack((prev) => {
      // Cap stack depth to guard against runaway A↔B↔A cycles.
      const MAX_DEPTH = 32;
      const next = [...prev, sourceBoardId];
      return next.length > MAX_DEPTH ? next.slice(next.length - MAX_DEPTH) : next;
    });
  }, []);

  // Read current `stack` directly so callers reliably get the popped id back
  // (avoids the strict-mode/concurrent-updater pitfall of mutating an outer
  // variable from inside a setState updater).
  const pop = useCallback((): string | null => {
    if (stack.length === 0) return null;
    const popped = stack[stack.length - 1];
    setStack((prev) => prev.slice(0, -1));
    return popped;
  }, [stack]);

  const clear = useCallback(() => {
    setStack((prev) => (prev.length === 0 ? prev : []));
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
