'use client';

import { motion } from 'framer-motion';
import { ArrowRightCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useTileGesture } from '@/lib/hooks/useTileGesture';

interface NavigateTileProps {
  tile: {
    id: string;
    targetBoardId: string;
    /** Live target board name; null = target missing/deleted (broken state). */
    targetBoardName: string | null;
  };
  onTap: () => void;
  onEdit?: () => void;
  onLongPress?: () => void;
  className?: string;
  textSizePx: number;
}

const BROKEN_LABEL = 'Target removed';

/**
 * A tile whose tap navigates to another board.
 *
 * - Live label: receives `targetBoardName` from the polymorphic query result;
 *   when the target board is renamed, the parent re-renders with a new value.
 * - Broken state: when `targetBoardName === null` the tile renders disabled
 *   and tap is a no-op (the parent surfaces a toast).
 * - Edit affordance: long-press mirrors PhraseTile (500ms) when an `onLongPress`
 *   handler is supplied. Tap-to-edit takes precedence when `onEdit` is set
 *   (i.e. the board is in edit mode).
 */
export default function NavigateTile({
  tile,
  onTap,
  onEdit,
  onLongPress,
  className = '',
  textSizePx,
}: NavigateTileProps) {
  const isBroken = tile.targetBoardName === null;

  const gesture = useTileGesture({
    // Tap-to-edit replaces long-press in edit mode.
    onLongPress: onEdit ? undefined : onLongPress,
    // Broken tiles without an editor swallow gestures entirely.
    disabled: isBroken && !onEdit,
  });

  const handleClick = gesture.wrapClick(() => {
    if (onEdit) {
      onEdit();
      return;
    }
    if (isBroken) {
      // No-op on broken target. Parent surfaces a toast via its own listener
      // if desired; here we silently ignore so screen readers announce
      // aria-disabled instead of triggering navigation.
      return;
    }
    onTap();
  });

  const labelText = isBroken ? BROKEN_LABEL : (tile.targetBoardName ?? '');
  const ariaLabel = onEdit
    ? `Edit navigate tile: ${labelText}`
    : isBroken
      ? `${labelText} (tile is disabled because the target board no longer exists)`
      : `Go to board: ${labelText}`;

  return (
    <motion.div
      data-testid="navigate-tile"
      data-tile-kind="navigate"
      data-broken={isBroken ? 'true' : undefined}
      className={`relative rounded-xl shadow-md cursor-pointer
        flex flex-col items-center justify-center min-h-[52px] aspect-square overflow-hidden
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        ${onEdit
      ? 'bg-surface border-l-4 border-blue-400'
      : isBroken
        ? 'bg-surface border-2 border-dashed border-border opacity-60 cursor-not-allowed'
        : 'bg-surface border-2 border-primary-400'}
        ${className}`}
      onClick={handleClick}
      {...gesture.bind}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      whileTap={gesture.prefersReducedMotion || isBroken ? undefined : { scale: 0.95 }}
      animate={gesture.prefersReducedMotion ? undefined : {
        scale: gesture.isPressed ? 0.95 : 1,
      }}
      transition={{ duration: 0.15 }}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-disabled={isBroken && !onEdit}
    >
      <div className="absolute top-1 right-1">
        {isBroken
          ? <ExclamationTriangleIcon className="w-4 h-4 text-warning" aria-hidden="true" />
          : <ArrowRightCircleIcon className="w-4 h-4 text-primary-500" aria-hidden="true" />}
      </div>
      <div className="flex flex-col items-center justify-center w-full h-full min-h-0 p-2 gap-1">
        <p
          className={`font-semibold line-clamp-2 leading-tight text-center w-full ${
            isBroken ? 'text-text-secondary italic' : 'text-foreground'
          }`}
          style={{ fontSize: `${textSizePx}px` }}
        >
          {labelText}
        </p>
      </div>
    </motion.div>
  );
}
