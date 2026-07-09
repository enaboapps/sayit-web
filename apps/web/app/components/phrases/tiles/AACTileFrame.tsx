'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

export type AACTileKind = 'phrase' | 'navigate' | 'audio';
export type AACTileState = 'idle' | 'active' | 'editing' | 'broken' | 'disabled';

export interface AACTileFrameProps {
  kind: AACTileKind;
  state?: AACTileState;
  label: string;
  accessibleLabel: string;
  textSizePx: number;
  icon?: ReactNode;
  statusIcon?: ReactNode;
  symbol?: ReactNode;
  onActivate?: () => void;
  pressed?: boolean;
  className?: string;
  interactionProps?: Omit<HTMLMotionProps<'div'>, 'children' | 'className' | 'onClick' | 'onKeyDown'>;
}

const KIND_CLASSES: Record<AACTileKind, string> = {
  phrase: 'border-border',
  navigate: 'border-primary-500/70',
  audio: 'border-blue-400/70',
};

const STATE_CLASSES: Record<AACTileState, string> = {
  idle: '',
  active: 'border-warning ring-2 ring-warning/30',
  editing: 'border-blue-400 ring-2 ring-blue-400/25',
  broken: 'border-dashed border-warning/70 opacity-70',
  disabled: 'border-dashed opacity-50',
};

export default function AACTileFrame({
  kind,
  state = 'idle',
  label,
  accessibleLabel,
  textSizePx,
  icon,
  statusIcon,
  symbol,
  onActivate,
  pressed,
  className = '',
  interactionProps,
}: AACTileFrameProps) {
  const disabled = state === 'disabled' || state === 'broken';

  const activate = () => {
    if (!disabled) onActivate?.();
  };

  return (
    <motion.div
      data-testid="aac-tile-frame"
      data-tile-kind={kind}
      data-tile-state={state}
      {...interactionProps}
      className={`relative flex aspect-square min-h-[52px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[var(--radius-control)] border-2 bg-surface shadow-[var(--shadow-control)] transition-[background-color,border-color,box-shadow,opacity] duration-[var(--motion-duration-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${KIND_CLASSES[kind]} ${STATE_CLASSES[state]} ${className}`}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={accessibleLabel}
      aria-disabled={disabled || undefined}
      aria-pressed={pressed}
    >
      {icon && (
        <span className="absolute left-2 top-2 text-text-tertiary" aria-hidden="true">
          {icon}
        </span>
      )}
      {statusIcon && (
        <span className="absolute right-2 top-2" aria-hidden="true">
          {statusIcon}
        </span>
      )}
      <span className="sr-only">{kind} tile</span>
      <div className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-1 p-2">
        {symbol}
        <p
          className={`w-full line-clamp-2 text-center font-semibold leading-tight ${state === 'broken' || state === 'disabled' ? 'italic text-text-secondary' : 'text-foreground'}`}
          style={{ fontSize: `${textSizePx}px` }}
        >
          {label}
        </p>
      </div>
    </motion.div>
  );
}
