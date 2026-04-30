'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_GAP_PX = 8;
const DEFAULT_MIN_COLUMNS = 2;
const DEFAULT_MAX_COLUMNS = 8;
const BASE_MIN_TILE_PX = 96;
const TEXT_SIZE_TILE_MULTIPLIER = 4.5;

export function computePhraseGridColumns({
  containerWidth,
  gapPx,
  textSizePx,
  minColumns,
  maxColumns,
}: {
  containerWidth: number;
  gapPx: number;
  textSizePx: number;
  minColumns: number;
  maxColumns: number;
}): number {
  if (containerWidth <= 0) {
    return minColumns;
  }

  const textAwareMinTilePx = Math.max(
    BASE_MIN_TILE_PX,
    Math.ceil(textSizePx * TEXT_SIZE_TILE_MULTIPLIER)
  );
  const rawColumns = Math.floor((containerWidth + gapPx) / (textAwareMinTilePx + gapPx));

  return Math.max(minColumns, Math.min(maxColumns, rawColumns));
}

interface PhraseGridProps {
  children: React.ReactNode;
  className?: string;
  textSizePx: number;
  minColumns?: number;
  maxColumns?: number;
}

export default function PhraseGrid({
  children,
  className = '',
  textSizePx,
  minColumns = DEFAULT_MIN_COLUMNS,
  maxColumns = DEFAULT_MAX_COLUMNS,
}: PhraseGridProps) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const gridElement = gridRef.current;
    if (!gridElement || typeof ResizeObserver === 'undefined') {
      return;
    }

    const updateWidth = (width: number) => {
      setContainerWidth((currentWidth) => currentWidth === width ? currentWidth : width);
    };

    updateWidth(gridElement.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width;
      if (typeof nextWidth === 'number') {
        updateWidth(nextWidth);
      }
    });

    observer.observe(gridElement);

    return () => observer.disconnect();
  }, []);

  const columns = computePhraseGridColumns({
    containerWidth,
    gapPx: DEFAULT_GAP_PX,
    textSizePx,
    minColumns,
    maxColumns,
  });

  return (
    <div
      ref={gridRef}
      className={`grid gap-2 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}
