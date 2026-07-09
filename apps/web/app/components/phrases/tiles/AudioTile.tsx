'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ExclamationTriangleIcon, SpeakerWaveIcon, StopIcon } from '@heroicons/react/24/solid';
import { useTileGesture } from '@/lib/hooks/useTileGesture';
import AACTileFrame from './AACTileFrame';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isBroken = tile.audioUrl === null;

  const gesture = useTileGesture({
    onLongPress: onEdit ? undefined : onLongPress,
    disabled: isBroken && !onEdit,
  });

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, []);

  // Tear down any in-flight audio on unmount.
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // If the underlying audioUrl changes (e.g. the user edited the tile), stop
  // any currently-playing clip and forget the old <audio> element.
  useEffect(() => {
    stopAudio();
    audioRef.current = null;
  }, [stopAudio, tile.audioUrl]);

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

  const handleClick = gesture.wrapClick(() => {
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
  });

  const ariaLabel = onEdit
    ? `Edit audio tile: ${tile.audioLabel}`
    : isBroken
      ? `${tile.audioLabel} (audio is unavailable)`
      : isPlaying
        ? `Stop audio tile: ${tile.audioLabel}`
        : `Play audio tile: ${tile.audioLabel}`;

  return (
    <AACTileFrame
      kind="audio"
      state={onEdit ? 'editing' : isBroken ? 'broken' : isPlaying ? 'active' : 'idle'}
      label={tile.audioLabel}
      accessibleLabel={ariaLabel}
      textSizePx={textSizePx}
      icon={<SpeakerWaveIcon className={`h-4 w-4 ${isBroken ? 'text-text-tertiary' : 'text-blue-300'}`} />}
      statusIcon={isBroken
        ? <ExclamationTriangleIcon className="h-4 w-4 text-warning" />
        : isPlaying
          ? <StopIcon className="h-4 w-4 text-warning" />
          : undefined}
      symbol={<SpeakerWaveIcon className={`h-7 w-7 ${isBroken ? 'text-text-tertiary' : 'text-blue-300'}`} />}
      onActivate={handleClick}
      pressed={isPlaying}
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
