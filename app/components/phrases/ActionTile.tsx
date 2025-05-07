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
      className={`aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors duration-200 ${className}`}
      aria-label={text}
    >
      <span className="text-gray-500 dark:text-gray-400 text-lg">{text}</span>
    </button>
  );
} 