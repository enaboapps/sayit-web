'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Symbol } from '@/lib/models/Symbol';
import symbolsManager from '@/lib/services/SymbolsManager';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface SymbolSearchProps {
  onSymbolSelect: (symbol: Symbol) => void
}

export default function SymbolSearch({ onSymbolSelect }: SymbolSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSymbols([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await symbolsManager.search(searchTerm);
      setSymbols(results);
      setSelectedIndex(-1);
      
      // Pre-fetch image URLs
      const urls: Record<string, string> = {};
      for (const symbol of results) {
        try {
          const url = await symbol.getImageURL();
          urls[symbol.id] = url;
        } catch {
          // Skip if image URL can't be fetched
        }
      }
      setImageUrls(urls);
    } catch {
      setSymbols([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, symbols.length - 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setSearchTerm('');
      setSymbols([]);
    }
  };

  const handleSymbolClick = async (symbol: Symbol) => {
    try {
      setIsLoading(true);
      await symbolsManager.handleSelectedSymbol(symbol);
      onSymbolSelect(symbol);
    } catch {
      // Silently fail - the user can try again
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < symbols.length) {
      handleSymbolClick(symbols[selectedIndex]);
    }
  }, [selectedIndex, symbols]);

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(handleSearch, 300);
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm, handleSearch]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Search for symbols..."
            className="w-full px-4 py-3 pl-10 pr-10 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSymbols([]);
              }}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        {isLoading && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </div>
        )}
        {!isLoading && symbols.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
              {symbols.map((symbol, index) => (
                <button
                  key={symbol.id}
                  onClick={() => handleSymbolClick(symbol)}
                  className={`p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 ${
                    index === selectedIndex ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="relative aspect-square">
                    {imageUrls[symbol.id] && (
                      <Image
                        src={imageUrls[symbol.id]}
                        alt={symbol.name ?? ''}
                        fill
                        className="object-contain"
                        unoptimized={imageUrls[symbol.id].startsWith('blob:')}
                      />
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 text-center truncate">
                    {symbol.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
