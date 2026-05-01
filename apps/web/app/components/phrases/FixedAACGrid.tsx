'use client';

import { useMemo, useState } from 'react';
import BoardTileRenderer from './tiles/BoardTileRenderer';
import type { BoardTileSummary, PhraseSummary } from './types';

const WORD_CLASS_ACCENTS: Record<string, string> = {
  pronoun: 'ring-1 ring-slate-300/70',
  verb: 'ring-1 ring-red-300/70',
  descriptor: 'ring-1 ring-sky-300/70',
  preposition: 'ring-1 ring-emerald-300/70',
  question: 'ring-1 ring-amber-300/70',
  social: 'ring-1 ring-violet-300/70',
  noun: 'ring-1 ring-orange-300/70',
  other: 'ring-1 ring-border',
};

interface FixedAACGridProps {
  tiles: BoardTileSummary[];
  rows: number;
  columns: number;
  activePhraseId: string | null;
  isSpeaking: boolean;
  isEditMode: boolean;
  canEdit: boolean;
  textSizePx: number;
  onPhrasePress: (phrase: PhraseSummary) => void;
  onPhraseStop: () => void;
  onPhraseEdit: (phrase: PhraseSummary) => void;
  onNavigateTap: (tile: Extract<BoardTileSummary, { kind: 'navigate' }>) => void;
  onNavigateEdit: (tile: Extract<BoardTileSummary, { kind: 'navigate' }>) => void;
  onAudioEdit: (tile: Extract<BoardTileSummary, { kind: 'audio' }>) => void;
  onMoveTileToCell?: (tileId: string, row: number, column: number) => void;
}

function tileCell(tile: BoardTileSummary, columns: number) {
  if (typeof tile.cellRow === 'number' && typeof tile.cellColumn === 'number') {
    return { row: tile.cellRow, column: tile.cellColumn };
  }

  return {
    row: Math.floor(tile.position / columns),
    column: tile.position % columns,
  };
}

export default function FixedAACGrid({
  tiles,
  rows,
  columns,
  activePhraseId,
  isSpeaking,
  isEditMode,
  canEdit,
  textSizePx,
  onPhrasePress,
  onPhraseStop,
  onPhraseEdit,
  onNavigateTap,
  onNavigateEdit,
  onAudioEdit,
  onMoveTileToCell,
}: FixedAACGridProps) {
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const minCellPx = Math.max(76, Math.ceil(textSizePx * 4.25));
  const gridWidthPx = columns * minCellPx + (columns - 1) * 10;

  const tileByCell = useMemo(() => {
    const map = new Map<string, BoardTileSummary>();
    for (const tile of tiles) {
      const { row, column } = tileCell(tile, columns);
      if (row < 0 || column < 0 || row >= rows || column >= columns) {
        // Surface the silent drop in dev so a user reporting "my tile
        // disappeared" has a breadcrumb. Skipped in production to avoid
        // noisy warnings from valid migration / import cases where cell
        // metadata is being filled in lazily.
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn(
            `[FixedAACGrid] Tile ${tile.id} has out-of-bounds cell (${row}, ${column}) for ${rows}x${columns} grid; skipping.`
          );
        }
        continue;
      }
      map.set(`${row}:${column}`, tile);
    }
    return map;
  }, [columns, rows, tiles]);

  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const key = `${row}:${column}`;
      const tile = tileByCell.get(key);

      if (!tile) {
        const canMoveHere = isEditMode && canEdit && selectedTileId && onMoveTileToCell;
        cells.push(
          <button
            key={key}
            type="button"
            disabled={!canMoveHere}
            onClick={() => selectedTileId && onMoveTileToCell?.(selectedTileId, row, column)}
            className={`aspect-square min-h-[64px] rounded-xl border border-dashed border-border bg-surface/40 ${
              canMoveHere ? 'hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500' : ''
            }`}
            aria-label={canMoveHere ? `Move selected tile to row ${row + 1}, column ${column + 1}` : `Empty cell row ${row + 1}, column ${column + 1}`}
          />
        );
        continue;
      }

      const isPhraseSpeaking = tile.kind === 'phrase'
        && activePhraseId === tile.phrase.id
        && isSpeaking;
      const accent = tile.wordClass ? WORD_CLASS_ACCENTS[tile.wordClass] ?? WORD_CLASS_ACCENTS.other : '';
      const isSelected = selectedTileId === tile.id;
      const tileContent = (
        <BoardTileRenderer
          tile={tile}
          textSizePx={textSizePx}
          onPhrasePress={onPhrasePress}
          onPhraseStop={onPhraseStop}
          onPhraseEdit={onPhraseEdit}
          isPhraseSpeaking={isPhraseSpeaking}
          onNavigateTap={onNavigateTap}
          onNavigateEdit={onNavigateEdit}
          onAudioEdit={onAudioEdit}
          isEditMode={false}
          className={`${accent} ${tile.isLocked ? 'after:absolute after:left-2 after:top-2 after:h-2 after:w-2 after:rounded-full after:bg-primary-500 after:content-[""]' : ''}`}
        />
      );

      cells.push(
        <div key={key} className={`relative ${isSelected ? 'rounded-xl ring-2 ring-primary-500 ring-offset-2' : ''}`}>
          {isEditMode && canEdit ? (
            <div
              role="button"
              tabIndex={0}
              className="block w-full text-left"
              onClick={() => setSelectedTileId((current) => current === tile.id ? null : tile.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedTileId((current) => current === tile.id ? null : tile.id);
                }
              }}
              aria-label={`Select tile in row ${row + 1}, column ${column + 1} to move`}
            >
              {tileContent}
            </div>
          ) : (
            tileContent
          )}
        </div>
      );
    }
  }

  return (
    <div className="w-full overflow-auto p-2" data-testid="fixed-aac-grid-wrapper">
      <div
        data-testid="fixed-aac-grid"
        className="grid gap-2.5"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(${minCellPx}px, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(${minCellPx}px, 1fr))`,
          minWidth: `${gridWidthPx}px`,
        }}
      >
        {cells}
      </div>
    </div>
  );
}
