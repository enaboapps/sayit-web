'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import SymbolImage from './SymbolImage';

export interface SymbolResult {
  id: number;
  imageUrl: string;
  name: string;
}

interface SymbolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (symbol: SymbolResult) => void;
  initialQuery?: string;
}

export default function SymbolSearchModal({ isOpen, onClose, onSelect, initialQuery = '' }: SymbolSearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SymbolResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setResults([]);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialQuery]);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/symbol-search?query=${encodeURIComponent(searchQuery.trim())}&limit=50`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data.symbols ?? []);
    } catch {
      setError('Failed to search symbols. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[75] flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              role="dialog"
              aria-modal="true"
              aria-label="Search symbols"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Search Symbols</h2>
                <button
                  onClick={onClose}
                  className="p-2 min-h-[44px] min-w-[44px] rounded-full hover:bg-surface-hover transition-colors flex items-center justify-center"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-6 h-6 text-text-secondary" />
                </button>
              </div>

              {/* Search input */}
              <div className="px-4 py-3 border-b border-border">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a symbol..."
                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-foreground text-base placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoading && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-lg bg-surface-hover animate-pulse" />
                    ))}
                  </div>
                )}

                {error && (
                  <p className="text-center text-red-400 text-sm py-8">{error}</p>
                )}

                {!isLoading && !error && results.length === 0 && query.trim() && (
                  <p className="text-center text-text-tertiary text-sm py-8">No symbols found</p>
                )}

                {!isLoading && !error && results.length === 0 && !query.trim() && (
                  <p className="text-center text-text-tertiary text-sm py-8">Type to search for symbols</p>
                )}

                {!isLoading && !error && results.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {results.map((symbol) => (
                      <button
                        key={symbol.id}
                        onClick={() => onSelect(symbol)}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-surface-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        aria-label={`Select symbol: ${symbol.name}`}
                      >
                        <SymbolImage src={symbol.imageUrl} alt={symbol.name} size="lg" />
                        <span className="text-xs text-text-secondary line-clamp-1 w-full text-center">
                          {symbol.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Attribution */}
              <div className="px-4 py-2 border-t border-border text-center">
                <span className="text-xs text-text-tertiary">
                  Powered by{' '}
                  <a
                    href="https://globalsymbols.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 hover:underline"
                  >
                    Global Symbols
                  </a>
                </span>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
