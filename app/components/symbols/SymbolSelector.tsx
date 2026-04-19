'use client';

import { useState, useCallback } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import SymbolImage from './SymbolImage';
import SymbolSearchModal, { type SymbolResult } from './SymbolSearchModal';

interface SymbolSelectorProps {
  symbolUrl?: string | null;
  symbolStorageId?: string | null;
  onSymbolChange: (symbol: { storageId: Id<'_storage'>; url: string } | null) => void;
  phraseText?: string;
}

export default function SymbolSelector({ symbolUrl, onSymbolChange, phraseText = '' }: SymbolSelectorProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const generateUploadUrl = useMutation(api.symbols.generateUploadUrl);

  const handleSelect = useCallback(async (symbol: SymbolResult) => {
    setIsSearchOpen(false);
    setIsUploading(true);
    setUploadError(null);

    try {
      // Download image via proxy
      const proxyResponse = await fetch(`/api/symbol-proxy?url=${encodeURIComponent(symbol.imageUrl)}`);
      if (!proxyResponse.ok) throw new Error('Failed to download symbol image');
      const blob = await proxyResponse.blob();

      // Upload to Convex storage
      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'image/png' },
        body: blob,
      });
      if (!uploadResponse.ok) throw new Error('Failed to upload symbol');
      const { storageId } = await uploadResponse.json();

      onSymbolChange({ storageId, url: symbol.imageUrl });
    } catch (err) {
      console.error('Error uploading symbol:', err);
      setUploadError('Failed to upload symbol. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [generateUploadUrl, onSymbolChange]);

  const handleClear = useCallback(() => {
    onSymbolChange(null);
  }, [onSymbolChange]);

  return (
    <>
      <div className="flex items-center gap-3">
        {symbolUrl ? (
          <div className="relative">
            <SymbolImage src={symbolUrl} alt="Selected symbol" size="lg" />
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
              aria-label="Remove symbol"
            >
              <XMarkIcon className="w-3 h-3 text-white" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            disabled={isUploading}
            className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:bg-surface-hover transition-colors disabled:opacity-50"
            aria-label="Add symbol"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <PlusIcon className="w-6 h-6 text-text-tertiary" />
            )}
          </button>
        )}
        <div className="text-sm">
          {uploadError ? (
            <span className="text-red-400">{uploadError}</span>
          ) : symbolUrl ? (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="text-primary-500 hover:underline"
            >
              Change symbol
            </button>
          ) : (
            <span className="text-text-secondary">{isUploading ? 'Uploading...' : 'Add a symbol (optional)'}</span>
          )}
        </div>
      </div>

      <SymbolSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={handleSelect}
        initialQuery={phraseText}
      />
    </>
  );
}
