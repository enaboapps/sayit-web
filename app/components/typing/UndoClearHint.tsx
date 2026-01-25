'use client';

import { cn } from '@/lib/utils';

type UndoClearHintProps = {
  remainingMs: number;
  onUndo: () => void;
  className?: string;
};

export default function UndoClearHint({ remainingMs, onUndo, className }: UndoClearHintProps) {
  const seconds = Math.max(1, Math.ceil(remainingMs / 1000));

  return (
    <div className={cn('flex items-center gap-2 text-xs text-text-tertiary', className)}>
      <span>Text cleared</span>
      <button
        type="button"
        onClick={onUndo}
        className="text-primary-500 hover:text-primary-400 font-semibold"
      >
        Undo
      </button>
      <span>({seconds}s)</span>
    </div>
  );
}
