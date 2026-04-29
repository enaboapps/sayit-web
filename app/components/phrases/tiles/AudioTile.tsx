'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, SpeakerWaveIcon, StopIcon } from '@heroicons/react/24/solid';

interface AudioTileProps {
  tile: {
    id: string;
    audioLabel: string;
    audioUrl: string | null;
  };
  onEdit?: () => void;
  onLongPress?: () => void;
  className?: string;
  textSizePx: number;
}

export default function AudioTile({
  tile,
  onEdit,
  onLongPress,
  className = '',
  textSizePx,
}: AudioTileProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isBroken = tile.audioUrl === null;

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    stopAudio();
    audioRef.current = null;
  }, [stopAudio, tile.audioUrl]);

  const handleTouchStart = useCallback(() => {
    if (isBroken && !onEdit) return;
    isLongPress.current = false;
    setIsPressed(true);

    if (onLongPress && !onEdit) {
      longPressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        setIsPressed(false);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
        onLongPress();
      }, 500);
    }
  }, [isBroken, onEdit, onLongPress]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const playAudio = () => {
    if (!tile.audioUrl) return;

    const audio = new Audio(tile.audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    void audio.play().catch(() => {
      setIsPlaying(false);
    });
  };

  const handleClick = () => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    if (onEdit) {
      onEdit();
      return;
    }
    if (isBroken) return;
    if (isPlaying) {
      stopAudio();
      return;
    }
    playAudio();
  };

  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ariaLabel = onEdit
    ? `Edit audio tile: ${tile.audioLabel}`
    : isBroken
      ? `${tile.audioLabel} (audio is unavailable)`
      : isPlaying
        ? `Stop audio tile: ${tile.audioLabel}`
        : `Play audio tile: ${tile.audioLabel}`;

  return (
    <motion.div
      data-testid="audio-tile"
      data-tile-kind="audio"
      data-broken={isBroken ? 'true' : undefined}
      className={`relative rounded-xl shadow-md cursor-pointer
        flex flex-col items-center justify-center min-h-[52px] aspect-square overflow-hidden
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        ${onEdit
      ? 'bg-surface border-l-4 border-blue-400'
      : isBroken
        ? 'bg-surface border-2 border-dashed border-border opacity-60 cursor-not-allowed'
        : isPlaying
          ? 'bg-surface border-2 border-warning'
          : 'bg-surface border-2 border-primary-400'}
        ${className}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      whileTap={prefersReducedMotion || isBroken ? undefined : { scale: 0.95 }}
      animate={prefersReducedMotion ? undefined : {
        scale: isPressed ? 0.95 : 1,
      }}
      transition={{ duration: 0.15 }}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-disabled={isBroken && !onEdit}
      aria-pressed={isPlaying}
    >
      <div className="absolute top-1 right-1">
        {isBroken ? (
          <ExclamationTriangleIcon className="w-4 h-4 text-warning" aria-hidden="true" />
        ) : isPlaying ? (
          <StopIcon className="w-4 h-4 text-warning" aria-hidden="true" />
        ) : (
          <SpeakerWaveIcon className="w-4 h-4 text-primary-500" aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-col items-center justify-center w-full h-full min-h-0 p-2 gap-1">
        <SpeakerWaveIcon
          className={`w-7 h-7 ${isBroken ? 'text-text-tertiary' : 'text-primary-500'}`}
          aria-hidden="true"
        />
        <p
          className={`font-semibold line-clamp-2 leading-tight text-center w-full ${
            isBroken ? 'text-text-secondary italic' : 'text-foreground'
          }`}
          style={{ fontSize: `${textSizePx}px` }}
        >
          {tile.audioLabel}
        </p>
      </div>
    </motion.div>
  );
}
