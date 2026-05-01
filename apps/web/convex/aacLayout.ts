import type { Doc } from './_generated/dataModel';

// Layout version stamped on every fixed-grid board so we can evolve the
// cell/tile invariants without losing track of which schema version a board
// was created under. Bumped only on breaking changes to fixed-grid layout
// semantics. Used by the OBF/OBZ importer; named-preset machinery that used
// to live alongside has been removed (see plan
// `i-think-we-ll-need-quizzical-moore.md`).
export const FIXED_GRID_LAYOUT_VERSION = 1;

/**
 * Find the next empty cell (row-major scan) on a fixed-grid board, given the
 * tiles already placed there. Returns `null` for free-mode boards (callers
 * spread the result so a null collapses to no cell metadata). Throws when
 * every cell is occupied — fixed-grid boards have a hard capacity ceiling
 * and the caller can't paper over that.
 *
 * Lives in convex/aacLayout.ts because both `boardTiles.ts` and
 * `phraseBoards.ts` need it; previously each had its own copy.
 */
export function nextFixedGridCell(
  board: Doc<'phraseBoards'>,
  tiles: Doc<'boardTiles'>[]
): { cellRow: number; cellColumn: number; cellRowSpan: 1; cellColumnSpan: 1 } | null {
  if (
    board.layoutMode !== 'fixedGrid' ||
    typeof board.gridRows !== 'number' ||
    typeof board.gridColumns !== 'number'
  ) {
    return null;
  }

  const occupied = new Set<string>();
  for (const tile of tiles) {
    if (typeof tile.cellRow === 'number' && typeof tile.cellColumn === 'number') {
      occupied.add(`${tile.cellRow}:${tile.cellColumn}`);
    }
  }

  for (let row = 0; row < board.gridRows; row++) {
    for (let column = 0; column < board.gridColumns; column++) {
      if (!occupied.has(`${row}:${column}`)) {
        return { cellRow: row, cellColumn: column, cellRowSpan: 1, cellColumnSpan: 1 };
      }
    }
  }

  throw new Error('No empty fixed-grid cells are available on this board');
}
