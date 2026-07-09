'use client';

import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { StopIcon } from '@heroicons/react/24/solid';
import { SymbolImage } from '../../symbols';
import { useTileGesture } from '@/lib/hooks/useTileGesture';
import AACTileFrame from './AACTileFrame';

interface PhraseTileProps {
  phrase: {
    id?: string;
    text: string;
    symbolUrl?: string;
  };
  onPress: () => void;
  onStop?: () => void;
  onEdit?: () => void;
  onLongPress?: () => void;
  isSpeaking?: boolean;
  className?: string;
  textSizePx: number;
}

export default function PhraseTile({
  phrase,
  onPress,
  onStop,
  onEdit,
  onLongPress,
  isSpeaking = false,
  className = '',
  textSizePx,
}: PhraseTileProps) {
  // Tap-to-edit takes precedence over long-press: when onEdit is wired in
  // (the board is in edit mode), suppress long-press detection entirely.
  const gesture = useTileGesture({
    onLongPress: onEdit ? undefined : onLongPress,
  });

  const handleClick = gesture.wrapClick(() => {
    if (onEdit) {
      onEdit();
    } else if (isSpeaking && onStop) {
      onStop();
    } else {
      onPress();
    }
  });

  return (
    <AACTileFrame
      kind="phrase"
      state={onEdit ? 'editing' : isSpeaking ? 'active' : 'idle'}
      label={phrase.text}
      accessibleLabel={onEdit ? `Edit phrase: ${phrase.text}` : isSpeaking ? `Stop: ${phrase.text}` : `Speak phrase: ${phrase.text}`}
      textSizePx={textSizePx}
      icon={<ChatBubbleBottomCenterTextIcon className="h-4 w-4" />}
      statusIcon={isSpeaking ? <StopIcon className="h-4 w-4 text-warning" /> : undefined}
      symbol={phrase.symbolUrl ? <SymbolImage src={phrase.symbolUrl} alt={phrase.text} size="md" /> : undefined}
      onActivate={handleClick}
      pressed={isSpeaking}
      className={className}
      interactionProps={{
        ...gesture.bind,
        whileTap: gesture.prefersReducedMotion ? undefined : { scale: 0.95 },
        animate: gesture.prefersReducedMotion ? undefined : { scale: gesture.isPressed ? 0.95 : 1 },
        transition: { duration: 0.15 },
      }}
    />
  );
}
