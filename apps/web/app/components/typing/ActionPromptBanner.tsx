'use client';

import { ArrowUturnLeftIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

type ActionPromptVariant = 'doubleEnter' | 'undo';

type ActionPromptBannerProps = {
  variant: ActionPromptVariant;
  actionLabel?: string;
  remainingMs: number;
  onUndo?: () => void;
  className?: string;
};

export default function ActionPromptBanner({
  variant,
  actionLabel,
  remainingMs,
  onUndo,
  className,
}: ActionPromptBannerProps) {
  const seconds = Math.max(1, Math.ceil(remainingMs / 1000));
  const isUndo = variant === 'undo';
  const title = isUndo ? 'Text cleared' : 'Double-Enter ready';
  const subtitle = isUndo
    ? 'Undo is available for a short time'
    : `Press Enter again to ${actionLabel ?? 'act'}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 rounded-2xl border px-3 py-2 shadow-lg',
        isUndo
          ? 'bg-surface-hover border-green-500/40'
          : 'bg-surface-hover border-primary-500/40',
        className
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full',
          isUndo ? 'bg-green-500/10 text-green-500' : 'bg-primary-500/10 text-primary-500'
        )}
      >
        {isUndo ? <ArrowUturnLeftIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs text-text-secondary">{subtitle}</div>
      </div>
      <span className="rounded-full bg-surface px-2 py-1 text-xs text-text-secondary shadow-inner">
        {seconds}s
      </span>
      {isUndo && (
        <button
          type="button"
          onClick={onUndo}
          className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-green-600"
        >
          Undo
        </button>
      )}
    </div>
  );
}
