'use client';

interface ActionTileProps {
  text: string;
  onClick: () => void;
  className?: string;
}

export default function ActionTile({ text, onClick, className = '' }: ActionTileProps) {
  return (
    <button
      onClick={onClick}
      className={`aspect-square flex items-center justify-center bg-surface hover:bg-surface-hover active:ring-2 active:ring-orange active:scale-[0.98] rounded-lg border-2 border-dashed border-border transition-all duration-200 ${className}`}
      aria-label={text}
    >
      <span className="text-text-secondary text-lg">{text}</span>
    </button>
  );
} 