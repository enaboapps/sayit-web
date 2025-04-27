'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Symbol } from '@/lib/models/Symbol';
import { Button } from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Image from 'next/image';
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
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-black">Select a Symbol</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-black"
          >
            <XMarkIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <Input
            type="text"
            label="Search symbols"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to search..."
          />
          <p className="mt-2 text-sm text-gray-500">
            Powered by{' '}
            <a 
              href="https://globalsymbols.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-black hover:underline"
            >
              Global Symbols
            </a>
          </p>
        </div>

        {/* Symbols Grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Searching symbols...</div>
            </div>
          ) : symbols.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">
                {searchTerm ? 'No symbols found' : 'Start typing to search symbols'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {symbols.map((symbol, index) => (
                <Button
                  key={`symbol-${index}-${Math.random().toString(36).substring(2, 11)}`}
                  variant="outline"
                  className="flex flex-col items-center p-4 h-auto"
                  onClick={async () => {
                    onSymbolSelect(symbol);
                    onClose();
                    await symbolsManager.handleSelectedSymbol(symbol);
                  }}
                >
                  <div className="w-16 h-16 relative mb-2">
                    {symbol.url && (
                      <Image
                        src={symbol.url}
                        alt={symbol.name || 'Symbol'}
                        fill
                        className="object-contain"
                        unoptimized={symbol.url.startsWith('blob:')}
                      />
                    )}
                  </div>
                  <span className="text-sm text-center">{symbol.name}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 