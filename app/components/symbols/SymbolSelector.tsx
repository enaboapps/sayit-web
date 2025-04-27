'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Symbol } from '@/lib/models/Symbol';
import { Button } from '@/app/components/ui/Button';
import Image from 'next/image';
import SymbolSearchModal from './SymbolSearchModal';

interface SymbolSelectorProps {
  symbol: Symbol | null;
  onSymbolSelect: (symbol: Symbol | null) => void;
}

export default function SymbolSelector({ symbol, onSymbolSelect }: SymbolSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsModalOpen(true)}
        className="w-full justify-start h-14 transition-all duration-200 hover:bg-gray-50"
      >
        {symbol ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg overflow-hidden relative shadow-sm">
                <Image
                  src={symbol.url ?? ''}
                  alt={`Symbol ${symbol.id}`}
                  fill
                  className="object-contain p-1.5"
                  unoptimized={symbol.url?.startsWith('blob:')}
                />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium text-gray-900">{symbol.name}</span>
                <span className="text-sm text-gray-500">Click to change</span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onSymbolSelect(null);
              }}
              className="hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-2xl">+</span>
            </div>
            <span className="text-gray-600">Select a symbol</span>
          </div>
        )}
      </Button>

      <SymbolSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSymbolSelect={(selectedSymbol) => {
          onSymbolSelect(selectedSymbol);
          setIsModalOpen(false);
        }}
      />
    </>
  );
} 