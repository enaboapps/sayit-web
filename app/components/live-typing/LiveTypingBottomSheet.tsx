'use client';

import { useState } from 'react';
import { ClipboardIcon, CheckIcon, ArrowPathIcon, ShareIcon, StopIcon } from '@heroicons/react/24/outline';
import BottomSheet from '@/app/components/ui/BottomSheet';

interface LiveTypingBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isSharing: boolean;
  isCreating: boolean;
  shareableLink: string | null;
  onStartSharing: () => Promise<void>;
  onEndSession: () => Promise<void>;
}

export default function LiveTypingBottomSheet({
  isOpen,
  onClose,
  isSharing,
  isCreating,
  shareableLink,
  onStartSharing,
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
      snapPoints={[40]}
      initialSnap={0}
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
            <div className="bg-status-success p-3 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Live Typing Active</span>
            </div>

            <p className="text-text-secondary text-sm">
              Share this link with others to let them see what you're typing in real-time.
            </p>

            {/* Link display with copy button */}
            <div className="flex gap-2">
              <input
                type="text"
                value={shareableLink || ''}
                readOnly
                className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-foreground text-sm"
              />
              <button
                onClick={handleCopy}
                className={`min-w-[48px] min-h-[48px] px-4 rounded-xl transition-colors flex items-center justify-center ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                }`}
                aria-label="Copy link"
              >
                {copied ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <ClipboardIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* End session button */}
            <button
              onClick={handleEndSession}
              disabled={isEnding}
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
