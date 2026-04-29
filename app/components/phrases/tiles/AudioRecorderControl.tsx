'use client';

import { useEffect, useRef, useState } from 'react';
import { ReactMediaRecorder } from 'react-media-recorder';
import { MicrophoneIcon, PlayIcon, StopIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/components/ui/Button';

export interface RecordedAudio {
  blob: Blob;
  url: string;
  durationMs: number;
}

interface AudioRecorderControlProps {
  value: RecordedAudio | null;
  onChange: (recording: RecordedAudio | null) => void;
  maxDurationMs?: number;
}

const DEFAULT_MAX_DURATION_MS = 60_000;

function formatDuration(durationMs: number) {
  const totalSeconds = Math.ceil(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function mapRecordingError(error: string | undefined) {
  if (!error) return null;
  if (error.toLowerCase().includes('permission') || error.toLowerCase().includes('denied')) {
    return 'Microphone access was denied. Allow access and try again.';
  }
  return 'Audio recording is not available in this browser.';
}

export default function AudioRecorderControl({
  value,
  onChange,
  maxDurationMs = DEFAULT_MAX_DURATION_MS,
}: AudioRecorderControlProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      if (value?.url) {
        URL.revokeObjectURL(value.url);
      }
    };
  }, [value?.url]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const playPreview = () => {
    if (!value) return;
    previewAudioRef.current?.pause();
    const audio = new Audio(value.url);
    previewAudioRef.current = audio;
    void audio.play();
  };

  return (
    <ReactMediaRecorder
      audio
      onStop={(_blobUrl, blob) => {
        stopTimer();
        const durationMs = Math.min(elapsedMs || maxDurationMs, maxDurationMs);
        const url = URL.createObjectURL(blob);
        onChange({ blob, url, durationMs });
      }}
      render={({ status, startRecording, stopRecording, error }) => {
        const isRecording = status === 'recording';
        const displayError = localError ?? mapRecordingError(error);

        const start = () => {
          setLocalError(null);
          if (!navigator.mediaDevices?.getUserMedia) {
            setLocalError('Audio recording is not available in this browser.');
            return;
          }
          if (value?.url) URL.revokeObjectURL(value.url);
          onChange(null);
          setElapsedMs(0);
          startedAtRef.current = Date.now();
          startRecording();
          timerRef.current = setInterval(() => {
            if (startedAtRef.current === null) return;
            const nextElapsed = Date.now() - startedAtRef.current;
            setElapsedMs(Math.min(nextElapsed, maxDurationMs));
            if (nextElapsed >= maxDurationMs) {
              stopRecording();
              stopTimer();
            }
          }, 250);
        };

        const stop = () => {
          stopRecording();
          stopTimer();
        };

        return (
          <div className="rounded-3xl border border-border bg-surface-hover p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Recording</p>
                <p className="text-sm text-text-secondary">
                  {isRecording ? formatDuration(elapsedMs) : value ? formatDuration(value.durationMs) : '0:00'}
                  <span className="text-text-tertiary"> / 1:00</span>
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {isRecording ? (
                  <Button type="button" onClick={stop} variant="secondary">
                    <StopIcon className="w-4 h-4" />
                    <span>Stop</span>
                  </Button>
                ) : (
                  <Button type="button" onClick={start} variant={value ? 'secondary' : 'default'}>
                    {value ? <ArrowPathIcon className="w-4 h-4" /> : <MicrophoneIcon className="w-4 h-4" />}
                    <span>{value ? 'Re-record' : 'Record'}</span>
                  </Button>
                )}
                {value && !isRecording && (
                  <Button type="button" onClick={playPreview} variant="ghost">
                    <PlayIcon className="w-4 h-4" />
                    <span>Preview</span>
                  </Button>
                )}
              </div>
            </div>
            {displayError && (
              <div className="mt-3 text-red-500 text-sm bg-status-error px-4 py-3 rounded-3xl">
                {displayError}
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
