'use client';

import { useState } from 'react';
import { XMarkIcon, ClipboardIcon, CheckIcon, ArrowPathIcon, ShareIcon } from '@heroicons/react/24/outline';

interface LiveTypingLinkModalProps {
  shareableLink: string | null;
  isCreating: boolean;
  onStartSharing: () => Promise<void>;
  onClose: () => void;
  onEndSession: () => Promise<void>;
}

export default function LiveTypingLinkModal({
  shareableLink,
  isCreating,
  onStartSharing,
  onClose,
  onEndSession,
}: LiveTypingLinkModalProps) {
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

  const handleEndSession = async () => {
    setIsEnding(true);
    try {
      await onEndSession();
    } catch (err) {
      console.error('Failed to end live typing session:', err);
      setIsEnding(false);
    }
  };

  const handleStartSharing = async () => {
    try {
      await onStartSharing();
    } catch (err) {
      console.error('Failed to start live typing:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-50">
      <div className="rounded-lg shadow-xl max-w-md w-full p-6 bg-surface">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">Live Typing</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {!shareableLink ? (
          <>
            <div className="mb-6 text-center">
              <ShareIcon className="w-12 h-12 mx-auto text-text-secondary mb-3" />
              <p className="text-text-secondary">
                Let others see what you're typing in real-time. The session expires in 24 hours.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-background hover:bg-surface-hover text-foreground border border-border rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleStartSharing}
                disabled={isCreating}
                className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isCreating ? (
                  <span className="flex items-center justify-center gap-2">
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Start Live Typing'
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-text-secondary mb-4">
                Share this link with others so they can see what you're typing in real-time. The session will expire in 24 hours.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareableLink}
                  readOnly
                  className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground text-sm"
                />
                <button
                  onClick={handleCopy}
                  className={`px-4 py-3 rounded-lg transition-colors ${
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
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-background hover:bg-surface-hover text-foreground border border-border rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleEndSession}
                disabled={isEnding}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isEnding ? 'Ending...' : 'End Live Typing'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
