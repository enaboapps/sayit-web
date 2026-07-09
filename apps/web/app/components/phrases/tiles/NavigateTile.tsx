'use client';

import { ArrowRightCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useTileGesture } from '@/lib/hooks/useTileGesture';
import AACTileFrame from './AACTileFrame';

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
    <AACTileFrame
      kind="navigate"
      state={onEdit ? 'editing' : isBroken ? 'broken' : 'idle'}
      label={labelText}
      accessibleLabel={ariaLabel}
      textSizePx={textSizePx}
      icon={<ArrowRightCircleIcon className="h-4 w-4 text-primary-400" />}
      statusIcon={isBroken ? <ExclamationTriangleIcon className="h-4 w-4 text-warning" /> : undefined}
      onActivate={handleClick}
      className={className}
      interactionProps={{
        ...gesture.bind,
        whileTap: gesture.prefersReducedMotion || isBroken ? undefined : { scale: 0.95 },
        animate: gesture.prefersReducedMotion ? undefined : { scale: gesture.isPressed ? 0.95 : 1 },
        transition: { duration: 0.15 },
      }}
    />
  );
}
