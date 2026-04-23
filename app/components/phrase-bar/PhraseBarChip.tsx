'use client';

import { motion } from 'framer-motion';
import SymbolImage from '../symbols/SymbolImage';
import type { PhraseBarItem } from './types';

interface PhraseBarChipProps {
  item: PhraseBarItem;
  textSizePx: number;
  className?: string;
}

export default function PhraseBarChip({ item, textSizePx, className = '' }: PhraseBarChipProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      className={`flex flex-col items-center justify-center shrink-0 gap-1 rounded-2xl bg-surface px-3 py-2 border border-border shadow-sm ${className}`}
      initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.85 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      data-testid="phrase-bar-chip"
    >
      {item.symbolUrl && (
        <SymbolImage src={item.symbolUrl} alt={item.text} size="sm" />
      )}
      <p
        className="text-foreground font-semibold leading-tight text-center max-w-[12ch] line-clamp-2"
        style={{ fontSize: `${textSizePx}px` }}
      >
        {item.text}
      </p>
    </motion.div>
  );
}
