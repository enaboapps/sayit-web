'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Symbol } from '@/lib/models/Symbol';
import { Button } from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import SymbolImage from './SymbolImage';
import symbolsManager from '@/lib/services/SymbolsManager';

interface SymbolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSymbolSelect: (symbol: Symbol) => void;
}

export default function SymbolSearchModal({ isOpen, onClose, onSymbolSelect }: SymbolSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchSymbols = async () => {
      if (!searchTerm) {
        setSymbols([]);
        return;
      }

      setLoading(true);
      try {
        const results = await symbolsManager.search(searchTerm);
        setSymbols(results);
      } catch (error) {
        console.error('Error searching symbols:', error);
        setSymbols([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchSymbols, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Select a Symbol</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-900 dark:text-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Input
            type="text"
            label="Search symbols"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to search..."
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Powered by{' '}
            <a 
              href="https://globalsymbols.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-900 dark:text-gray-100 hover:underline"
            >
              Global Symbols
            </a>
          </p>
        </div>

        {/* Symbols Grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 dark:text-gray-400">Searching symbols...</div>
            </div>
          ) : symbols.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No symbols found' : 'Start typing to search symbols'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {symbols.map((symbol, index) => (
                <Button
                  key={`symbol-${index}-${Math.random().toString(36).substring(2, 11)}`}
                  variant="outline"
                  className="flex flex-col items-center p-4 h-auto bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                  onClick={async () => {
                    onSymbolSelect(symbol);
                    onClose();
                    await symbolsManager.handleSelectedSymbol(symbol);
                  }}
                >
                  {symbol.url && (
                    <SymbolImage
                      url={symbol.url}
                      alt={symbol.name || 'Symbol'}
                      size="md"
                      className="mb-2"
                    />
                  )}
                  <span className="text-sm text-center text-gray-900 dark:text-gray-100 font-medium">{symbol.name}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 