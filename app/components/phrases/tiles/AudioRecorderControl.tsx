'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ReactMediaRecorder } from 'react-media-recorder';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon as ArrowPathOutline,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';
import { Button } from '@/app/components/ui/Button';
import {
  COUNTDOWN_WARNING_MS,
  MAX_AUDIO_BYTES,
  MAX_AUDIO_DURATION_MS,
  isAllowedAudioMimeType,
} from '@/lib/audio/constants';

export interface RecordedAudio {
  blob: Blob;
  url: string;
  durationMs: number;
}

interface AudioRecorderControlProps {
  value: RecordedAudio | null;
  onChange: (recording: RecordedAudio | null) => void;
  maxDurationMs?: number;
  maxBytes?: number;
}

// Hero ring sizing. The viewBox stays 0-100 so stroke-dashoffset math works in
// pure circumference units (2π·r ≈ 282.74 for r=45).
const RING_RADIUS = 45;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatDuration(durationMs: number) {
  const totalSeconds = Math.ceil(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function mapRecordingError(error: string | undefined) {
  if (!error) return null;
  const lower = error.toLowerCase();
  if (lower.includes('permission') || lower.includes('denied')) {
    return 'Microphone access was denied. Allow access and try again.';
  }
  return 'Audio recording is not available in this browser.';
}

export default function AudioRecorderControl({
  value,
  onChange,
  maxDurationMs = MAX_AUDIO_DURATION_MS,
  maxBytes = MAX_AUDIO_BYTES,
}: AudioRecorderControlProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Wall-clock timestamps for the current recording. We keep these in refs
  // (not state) so that `onStop` — which fires asynchronously after the
  // encoder finalises — can compute the actual duration without depending on
  // a possibly-stale React closure over `elapsedMs`.
  const startedAtRef = useRef<number | null>(null);
  const stoppedAtRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  // Tracks the *currently-active* object URL we minted so cleanup is unambiguous
  // even when `value` changes between renders.
  const activeUrlRef = useRef<string | null>(null);
  // The progress arc is updated imperatively so we don't re-render the whole
  // component four times a second just to advance a stroke offset. Because we
  // mutate `style.strokeDashoffset` directly, we deliberately do NOT pass a
  // `strokeDashoffset` JSX attribute on the <circle> — otherwise React's
  // reconciliation would overwrite our imperative value every re-render.
  const progressCircleRef = useRef<SVGCircleElement | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const releaseActiveUrl = () => {
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
  };

  // Imperatively set the progress arc to a 0..1 fraction of the ring.
  // Safe to call when the ref isn't attached yet (initial render path).
  const setProgressFraction = (fraction: number) => {
    const node = progressCircleRef.current;
    if (!node) return;
    const clamped = Math.max(0, Math.min(1, fraction));
    node.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - clamped));
  };

  // One-shot unmount cleanup. Per-recording URL cleanup is handled by
  // releaseActiveUrl() when start()/onStop() rotates the value.
  useEffect(() => {
    return () => {
      stopTimer();
      previewAudioRef.current?.pause();
      releaseActiveUrl();
    };
  }, []);

  // Sync the progress arc to the current `value`-derived state whenever we're
  // not in the middle of a live recording. During recording, the interval is
  // the sole driver of the dashoffset.
  useLayoutEffect(() => {
    if (timerRef.current !== null) return;
    setProgressFraction(value ? 1 : 0);
  }, [value]);

  const playPreview = () => {
    if (!value) return;
    previewAudioRef.current?.pause();
    const audio = new Audio(value.url);
    previewAudioRef.current = audio;
    void audio.play();
  };

  const remainingMs = Math.max(0, maxDurationMs - elapsedMs);
  const showCountdown = remainingMs > 0 && remainingMs <= COUNTDOWN_WARNING_MS;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <ReactMediaRecorder
      audio
      onStop={(_blobUrl, blob) => {
        stopTimer();
        const startedAt = startedAtRef.current;
        const stoppedAt = stoppedAtRef.current ?? Date.now();
        const measuredMs = startedAt !== null ? Math.max(0, stoppedAt - startedAt) : 0;
        startedAtRef.current = null;
        stoppedAtRef.current = null;

        if (blob.size > maxBytes) {
          const mb = (maxBytes / (1024 * 1024)).toFixed(0);
          setLocalError(`Recording exceeds ${mb} MB limit. Try a shorter clip.`);
          onChange(null);
          setProgressFraction(0);
          return;
        }
        if (blob.type && !isAllowedAudioMimeType(blob.type)) {
          setLocalError('Your browser produced an audio format we don\'t support.');
          onChange(null);
          setProgressFraction(0);
          return;
        }
        const durationMs = Math.min(measuredMs, maxDurationMs);
        releaseActiveUrl();
        const url = URL.createObjectURL(blob);
        activeUrlRef.current = url;
        // Has-recording state: pin ring to full.
        setProgressFraction(1);
        onChange({ blob, url, durationMs });
      }}
      render={({ status, startRecording, stopRecording, error }) => {
        const isRecording = status === 'recording';
        const hasRecording = !isRecording && !!value;
        const displayError = localError ?? mapRecordingError(error);
        const inCountdown = isRecording && showCountdown;

        // Time-text color follows the same state palette as the ring.
        const timeColorClass = isRecording
          ? inCountdown
            ? 'text-warning'
            : 'text-error'
          : 'text-foreground';

        // Track (unfilled portion) goes amber in the last-10s countdown so the
        // remaining-time signal is visible at a glance.
        const trackColor = inCountdown
          ? 'var(--color-warning)'
          : 'var(--color-border)';

        // Filled arc + button color story.
        const arcColor = isRecording
          ? 'var(--color-error)'
          : hasRecording
            ? 'var(--color-primary-500)'
            : 'transparent';

        // Big-button styling per state.
        const buttonStateClasses = isRecording
          ? 'bg-error text-white shadow-lg'
          : hasRecording
            ? 'bg-surface text-primary-500 border-2 border-primary-500'
            : 'bg-primary-500 text-white shadow-lg';

        const start = () => {
          setLocalError(null);
          if (!navigator.mediaDevices?.getUserMedia) {
            setLocalError('Audio recording is not available in this browser.');
            return;
          }
          releaseActiveUrl();
          onChange(null);
          setElapsedMs(0);
          setProgressFraction(0);
          startedAtRef.current = Date.now();
          stoppedAtRef.current = null;
          startRecording();
          timerRef.current = setInterval(() => {
            if (startedAtRef.current === null) return;
            const nextElapsed = Date.now() - startedAtRef.current;
            setElapsedMs(Math.min(nextElapsed, maxDurationMs));
            setProgressFraction(nextElapsed / maxDurationMs);
            if (nextElapsed >= maxDurationMs) {
              stoppedAtRef.current = startedAtRef.current + maxDurationMs;
              stopRecording();
              stopTimer();
            }
          }, 250);
        };

        const stop = () => {
          if (startedAtRef.current !== null && stoppedAtRef.current === null) {
            stoppedAtRef.current = Date.now();
          }
          stopRecording();
          stopTimer();
        };

        const onPrimaryClick = () => {
          if (isRecording) {
            stop();
          } else {
            // Idle and has-recording both kick off a fresh recording. The
            // distinction lives in the icon/label and the existing recording
            // is released by start() → releaseActiveUrl() → onChange(null).
            start();
          }
        };

        const primaryLabel = isRecording
          ? 'Stop recording'
          : hasRecording
            ? 'Re-record (replaces current clip)'
            : 'Start recording';

        return (
          <div className="rounded-3xl border border-border bg-surface shadow-md hover:shadow-xl transition-shadow duration-300 p-8">
            <div className="flex flex-col items-center gap-5">
              {/* Ring + big button cluster */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg
                  viewBox="0 0 100 100"
                  className="absolute inset-0 -rotate-90"
                  width="96"
                  height="96"
                  aria-hidden="true"
                >
                  {/* Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={RING_RADIUS}
                    fill="none"
                    stroke={trackColor}
                    strokeWidth="3"
                    style={{ transition: 'stroke 200ms ease' }}
                  />
                  {/* Foreground arc — strokeDashoffset is owned by the
                      imperative path (interval / has-recording sync effect).
                      Do NOT add a JSX strokeDashoffset attr here. */}
                  <circle
                    ref={progressCircleRef}
                    cx="50"
                    cy="50"
                    r={RING_RADIUS}
                    fill="none"
                    stroke={arcColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    style={{
                      transition: prefersReducedMotion
                        ? 'none'
                        : 'stroke-dashoffset 250ms linear, stroke 200ms ease',
                    }}
                  />
                </svg>
                <motion.button
                  type="button"
                  onClick={onPrimaryClick}
                  aria-label={primaryLabel}
                  className={`relative z-10 w-[72px] h-[72px] min-h-[44px] min-w-[44px] rounded-full
                    flex items-center justify-center
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface
                    transition-colors duration-200 ${buttonStateClasses}`}
                  animate={
                    isRecording && !prefersReducedMotion
                      ? { scale: [1, 1.05, 1] }
                      : { scale: 1 }
                  }
                  transition={
                    isRecording && !prefersReducedMotion
                      ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 0.2 }
                  }
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                >
                  {isRecording ? (
                    <StopIcon className="w-7 h-7" aria-hidden="true" />
                  ) : hasRecording ? (
                    <ArrowPathOutline className="w-7 h-7" aria-hidden="true" />
                  ) : (
                    <MicrophoneIcon className="w-7 h-7" aria-hidden="true" />
                  )}
                </motion.button>
              </div>

              {/* Time */}
              <div className="text-center">
                <p
                  className={`text-2xl font-mono tabular-nums font-semibold ${timeColorClass} transition-colors duration-200`}
                  aria-live="off"
                >
                  {isRecording
                    ? formatDuration(elapsedMs)
                    : hasRecording
                      ? formatDuration(value!.durationMs)
                      : '0:00'}
                  <span className="text-text-tertiary"> / {formatDuration(maxDurationMs)}</span>
                </p>
              </div>

              {/* Footer actions — only when there's a clip to act on */}
              {hasRecording && (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button type="button" onClick={start} variant="secondary" size="sm">
                    <ArrowPathOutline className="w-4 h-4" />
                    <span>Re-record</span>
                  </Button>
                  <Button type="button" onClick={playPreview} variant="ghost" size="sm">
                    <PlayIcon className="w-4 h-4" />
                    <span>Preview</span>
                  </Button>
                </div>
              )}
            </div>

            {inCountdown && (
              <div
                className="mt-5 text-amber-600 text-sm bg-status-warning px-4 py-2 rounded-3xl text-center"
                role="status"
                aria-live="polite"
              >
                {Math.ceil(remainingMs / 1000)}s left — recording will stop automatically.
              </div>
            )}
            {displayError && (
              <div
                className="mt-5 text-red-500 text-sm bg-status-error px-4 py-3 rounded-3xl text-center"
                role="alert"
              >
                {displayError}
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
