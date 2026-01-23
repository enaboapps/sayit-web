'use client';

import { motion } from 'framer-motion';

interface ActionTileProps {
  text: string;
  onClick: () => void;
  className?: string;
}

export default function ActionTile({ text, onClick, className = '' }: ActionTileProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex items-center justify-center bg-surface hover:bg-surface-hover rounded-2xl border-2 border-dashed border-border min-h-[80px] ${className}`}
      aria-label={text}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      <span className="text-text-secondary text-base sm:text-lg font-medium">{text}</span>
    </motion.button>
  );
} 