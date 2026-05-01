import type { Doc } from './_generated/dataModel';

export type AacLayoutPreset = 'largeAccess16' | 'standard36' | 'dense48';
export type AacWordClass =
  | 'pronoun'
  | 'verb'
  | 'descriptor'
  | 'preposition'
  | 'question'
  | 'social'
  | 'noun'
  | 'other';

export const AAC_LAYOUT_VERSION = 1;
export const AAC_SOURCE_TEMPLATE = 'sayitCoreV1' as const;

// Canonical preset dimensions. The UI module `lib/aacLayout.ts` keeps a
// parallel map with display labels — `tests/lib/aacLayout.test.ts` asserts
// that the two stay in sync so adding/resizing a preset breaks the test if
// only one side gets touched.
export const AAC_PRESETS: Record<AacLayoutPreset, { rows: number; columns: number }> = {
  largeAccess16: { rows: 4, columns: 4 },
  standard36: { rows: 6, columns: 6 },
  dense48: { rows: 6, columns: 8 },
};

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

export const PROJECT_CORE_ATTRIBUTION =
  'Universal Core vocabulary words are based on Project Core, licensed CC BY-SA 4.0.';

export const SAYIT_CORE_WORDS: Array<{ text: string; wordClass: AacWordClass }> = [
  { text: 'all', wordClass: 'descriptor' },
  { text: 'can', wordClass: 'verb' },
  { text: 'different', wordClass: 'descriptor' },
  { text: 'do', wordClass: 'verb' },
  { text: 'finished', wordClass: 'descriptor' },
  { text: 'get', wordClass: 'verb' },
  { text: 'go', wordClass: 'verb' },
  { text: 'good', wordClass: 'descriptor' },
  { text: 'he', wordClass: 'pronoun' },
  { text: 'help', wordClass: 'verb' },
  { text: 'here', wordClass: 'preposition' },
  { text: 'I', wordClass: 'pronoun' },
  { text: 'in', wordClass: 'preposition' },
  { text: 'it', wordClass: 'pronoun' },
  { text: 'like', wordClass: 'verb' },
  { text: 'look', wordClass: 'verb' },
  { text: 'make', wordClass: 'verb' },
  { text: 'more', wordClass: 'descriptor' },
  { text: 'not', wordClass: 'descriptor' },
  { text: 'on', wordClass: 'preposition' },
  { text: 'open', wordClass: 'verb' },
  { text: 'put', wordClass: 'verb' },
  { text: 'same', wordClass: 'descriptor' },
  { text: 'she', wordClass: 'pronoun' },
  { text: 'some', wordClass: 'descriptor' },
  { text: 'stop', wordClass: 'verb' },
  { text: 'that', wordClass: 'pronoun' },
  { text: 'turn', wordClass: 'verb' },
  { text: 'up', wordClass: 'preposition' },
  { text: 'want', wordClass: 'verb' },
  { text: 'what', wordClass: 'question' },
  { text: 'when', wordClass: 'question' },
  { text: 'where', wordClass: 'question' },
  { text: 'who', wordClass: 'question' },
  { text: 'why', wordClass: 'question' },
  { text: 'you', wordClass: 'pronoun' },
];

const LARGE_ACCESS_WORDS = new Set([
  'I',
  'you',
  'want',
  'go',
  'stop',
  'more',
  'help',
  'not',
  'like',
  'look',
  'get',
  'put',
  'open',
  'finished',
  'what',
  'where',
]);

export function getCoreWordsForPreset(preset: AacLayoutPreset) {
  if (preset === 'largeAccess16') {
    return SAYIT_CORE_WORDS.filter((word) => LARGE_ACCESS_WORDS.has(word.text));
  }

  return SAYIT_CORE_WORDS;
}

export function getPresetDimensions(preset: AacLayoutPreset) {
  return AAC_PRESETS[preset];
}
