'use client';

import { Symbol } from '@/lib/models/Symbol';
import { Button } from '@/app/components/ui/Button';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import SymbolSearchModal from './SymbolSearchModal';
import SymbolImage from './SymbolImage';

interface SymbolSelectorProps {
  symbol: Symbol | null;
  onSymbolSelect: (symbol: Symbol | null) => void;
  className?: string;
}

export default function SymbolSelector({ symbol, onSymbolSelect, className = '' }: SymbolSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchImageUrl = async () => {
      if (!symbol) {
        setUrl(null);
        return;
      }
      try {
        const imageUrl = await symbol.getImageURL();
        setUrl(imageUrl);
      } catch {
        setImageError(true);
      }
    };
    fetchImageUrl();
  }, [symbol]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSymbolSelect(null);
  };

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsModalOpen(true)}
        className="w-full justify-start h-auto p-3 bg-white bg-surface border-gray-200 border-border hover:bg-gray-50 hover:bg-surface-hover/50"
      >
        <motion.div
          className="inline-flex items-center w-full"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center gap-3 w-full">
            {url && !imageError ? (
              <SymbolImage url={url} alt={symbol?.name || 'Selected symbol'} size="sm" />
            ) : (
              <div className="w-12 h-12 bg-gray-100 bg-surface-hover rounded-lg flex items-center justify-center border border-gray-200 border-border">
                <span className="text-gray-400 text-text-secondary text-sm">+</span>
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900 text-foreground">
                {symbol ? 'Change symbol' : 'Select a symbol'}
              </p>
            </div>
            {symbol && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="h-8 w-8 text-gray-500 text-text-secondary hover:text-gray-900 hover:text-foreground hover:bg-gray-100 hover:bg-surface-hover"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </Button>

      <SymbolSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSymbolSelect={(selectedSymbol: Symbol) => {
          onSymbolSelect(selectedSymbol);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
} 