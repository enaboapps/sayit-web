'use client';

import { useState } from 'react';
import {
  ArrowPathIcon,
  CheckIcon,
  ClipboardIcon,
  PauseIcon,
  PlayIcon,
  ShareIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import BottomSheet from '@/app/components/ui/BottomSheet';

interface LiveTypingBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isSharing: boolean;
  isCreating: boolean;
  isPaused: boolean;
  isTransitioning: boolean;
  error: string | null;
  shareableLink: string | null;
  onStartSharing: () => Promise<void>;
  onPauseSession: () => Promise<void>;
  onResumeSession: () => Promise<void>;
  onEndSession: () => Promise<void>;
}

export default function LiveTypingBottomSheet({
  isOpen,
  onClose,
  isSharing,
  isCreating,
  isPaused,
  isTransitioning,
  error,
  shareableLink,
  onStartSharing,
  onPauseSession,
  onResumeSession,
  onEndSession,
}: LiveTypingBottomSheetProps) {
  const [copied, setCopied] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const handleCopy = async () => {
    if (!shareableLink) return;

    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleStartSharing = async () => {
    try {
      await onStartSharing();
    } catch (err) {
      console.error('Failed to start live typing:', err);
    }
  };

  const handleEndSession = async () => {
    setIsEnding(true);
    try {
      await onEndSession();
      onClose();
    } catch (err) {
      console.error('Failed to end live typing session:', err);
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Live Typing Session"
      snapPoints={isSharing ? [75, 90] : [40]}
      initialSnap={isSharing ? 1 : 0}
    >
      <div className="p-4 space-y-4">
        {!isSharing ? (
          /* Not active - show start button */
          <div className="text-center py-4">
            <ShareIcon className="w-12 h-12 mx-auto text-text-secondary mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-2">Live Typing</h3>
            <p className="text-text-secondary text-sm mb-6">
              Let others see what you're typing in real-time. The session expires in 24 hours.
            </p>

            <button
              onClick={handleStartSharing}
              disabled={isCreating}
              className={`w-full min-h-[48px] px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                isCreating
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isCreating ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  <span>Creating Session...</span>
                </>
              ) : (
                <>
                  <ShareIcon className="w-5 h-5" />
                  <span>Start Live Typing</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Currently active - show link and controls */
          <div className="space-y-4">
            <div
              role="status"
              aria-live="polite"
              className={`flex items-center gap-2 rounded-[var(--radius-control)] border p-3 ${
                isPaused
                  ? 'border-amber-500/50 bg-status-warning text-status-warning-foreground'
                  : 'border-green-500/50 bg-status-success text-status-success-foreground'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  isPaused ? 'bg-amber-500' : 'bg-green-500 motion-safe:animate-pulse'
                }`}
              />
              <span className="text-sm font-medium">
                Live Typing {isPaused ? 'Paused' : 'Active'}
              </span>
            </div>

            <p className="text-text-secondary text-sm">
              {isPaused
                ? 'The last shared message remains visible. Your typing is private until you resume.'
                : 'Share this link with others to let them see what you’re typing in real-time.'}
            </p>

            {error && (
              <div
                role="alert"
                className="rounded-[var(--radius-control)] border border-red-500/50 bg-status-error px-4 py-3 text-sm text-status-error-foreground"
              >
                {error}
              </div>
            )}

            {shareableLink ? (
              <figure className="flex flex-col items-center gap-2">
                <div className="w-full max-w-[14rem] rounded-[var(--radius-card)] border border-border bg-white p-3 shadow-[var(--shadow-control)]">
                  <QRCodeSVG
                    value={shareableLink}
                    size={224}
                    level="M"
                    marginSize={4}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    title="QR code for Live Typing share link"
                    className="h-auto w-full"
                  />
                </div>
                <figcaption className="text-center text-sm text-text-secondary">
                  Scan to open this Live Typing session on another device.
                </figcaption>
              </figure>
            ) : (
              <div
                role="status"
                aria-live="polite"
                className="rounded-[var(--radius-control)] border border-border bg-surface-hover px-4 py-3 text-center text-sm text-text-secondary"
              >
                Preparing share link…
              </div>
            )}

            {/* Link display with copy button */}
            <div className="flex gap-2">
              <input
                type="text"
                value={shareableLink || ''}
                readOnly
                aria-label="Live Typing share link"
                className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-foreground text-sm"
              />
              <button
                onClick={handleCopy}
                disabled={!shareableLink}
                className={`min-w-[48px] min-h-[48px] px-4 rounded-xl transition-colors flex items-center justify-center ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                } disabled:cursor-not-allowed disabled:opacity-50`}
                aria-label={copied ? 'Live Typing link copied' : 'Copy Live Typing link'}
              >
                {copied ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <ClipboardIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={isPaused ? onResumeSession : onPauseSession}
              disabled={isTransitioning || isEnding}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface-hover px-6 py-3 font-semibold text-foreground transition-colors hover:border-primary-500 hover:bg-primary-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-wait disabled:opacity-50"
            >
              {isTransitioning ? (
                <ArrowPathIcon className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" />
              ) : isPaused ? (
                <PlayIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <PauseIcon className="h-5 w-5" aria-hidden="true" />
              )}
              <span>
                {isTransitioning
                  ? (isPaused ? 'Resuming…' : 'Pausing…')
                  : (isPaused ? 'Resume Live Typing' : 'Pause Live Typing')}
              </span>
            </button>

            {/* End session button */}
            <button
              onClick={handleEndSession}
              disabled={isEnding || isTransitioning}
              className="w-full min-h-[48px] px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
            >
              {isEnding ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  <span>Ending Session...</span>
                </>
              ) : (
                <>
                  <StopIcon className="w-5 h-5" />
                  <span>End Live Typing</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
