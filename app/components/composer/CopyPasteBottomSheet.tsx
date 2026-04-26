'use client';

import { useState } from 'react';
import {
  ClipboardIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import BottomSheet from '@/app/components/ui/BottomSheet';

const COPY_CONFIRM_MS = 2000;

interface CopyPasteBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentText: string;
  onPaste: (clipboardText: string) => void;
}

export default function CopyPasteBottomSheet({
  isOpen,
  onClose,
  currentText,
  onPaste,
}: CopyPasteBottomSheetProps) {
  const [copied, setCopied] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  const copyDisabled = !currentText.trim();

  const handleCopy = async () => {
    if (copyDisabled) return;

    try {
      await navigator.clipboard.writeText(currentText);
      setCopied(true);
      // Show the ✓ for a beat, then close the sheet so the action feels resolved.
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, COPY_CONFIRM_MS);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handlePaste = async () => {
    setPasteError(null);

    if (!navigator.clipboard?.readText) {
      setPasteError('This browser doesn\'t support pasting from clipboard.');
      return;
    }

    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) {
        setPasteError('Clipboard is empty.');
        return;
      }
      onPaste(clipboardText);
      onClose();
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      setPasteError('Couldn\'t read clipboard — check browser permissions.');
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Copy & paste"
      snapPoints={[40]}
      initialSnap={0}
    >
      <div className="p-4 space-y-3">
        {/* Copy all text */}
        <button
          type="button"
          onClick={handleCopy}
          disabled={copyDisabled}
          className={`w-full min-h-[64px] px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-primary-500 hover:bg-primary-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Copy all text"
        >
          {copied ? (
            <>
              <CheckIcon className="w-6 h-6" data-testid="copy-success" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <ClipboardIcon className="w-6 h-6" />
              <span>Copy all text</span>
            </>
          )}
        </button>

        {/* Paste from clipboard */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handlePaste}
            className="w-full min-h-[64px] px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 bg-pink-700 hover:bg-pink-600 text-white"
            aria-label="Paste from clipboard"
          >
            <ClipboardDocumentIcon className="w-6 h-6" />
            <span>Paste from clipboard</span>
          </button>
          {pasteError && (
            <p className="text-sm text-red-400 px-1" role="alert">
              {pasteError}
            </p>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
