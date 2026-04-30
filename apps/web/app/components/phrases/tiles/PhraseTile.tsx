'use client';

import { motion } from 'framer-motion';
import { StopIcon } from '@heroicons/react/24/solid';
import { SymbolImage } from '../../symbols';
import { useTileGesture } from '@/lib/hooks/useTileGesture';

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
    <motion.div
      className={`relative bg-surface rounded-xl shadow-md cursor-pointer
        flex flex-col items-center justify-center min-h-[52px] aspect-square overflow-hidden
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        ${onEdit ? 'border-l-4 border-blue-400' : isSpeaking ? 'border-2 border-warning' : ''}
        ${className}`}
      onClick={handleClick}
      {...gesture.bind}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      whileTap={gesture.prefersReducedMotion ? undefined : { scale: 0.95 }}
      animate={gesture.prefersReducedMotion ? undefined : {
        scale: gesture.isPressed ? 0.95 : 1,
        backgroundColor: gesture.isPressed ? 'var(--surface-hover)' : 'var(--surface)',
      }}
      transition={{ duration: 0.15 }}
      role="button"
      tabIndex={0}
      aria-label={onEdit ? `Edit phrase: ${phrase.text}` : isSpeaking ? `Stop: ${phrase.text}` : `Speak phrase: ${phrase.text}`}
      aria-pressed={isSpeaking}
    >
      {isSpeaking && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-warning flex items-center justify-center animate-pulse">
          <StopIcon className="w-2.5 h-2.5 text-white" />
        </div>
      )}
      <div className="flex flex-col items-center justify-center w-full h-full min-h-0 p-2 gap-1">
        {phrase.symbolUrl && (
          <SymbolImage src={phrase.symbolUrl} alt={phrase.text} size="md" />
        )}
        <p
          className="text-foreground font-semibold line-clamp-2 leading-tight text-center w-full"
          style={{ fontSize: `${textSizePx}px` }}
        >
          {phrase.text}
        </p>
      </div>
    </motion.div>
  );
}
