// Tile-level metadata types still exist on `boardTiles` (set by the OBF
// importer and visible on legacy AAC starter boards). The named-preset layer
// that used to live here was removed when "AAC core board" stopped being a
// SayIt-built feature — OBF/OBZ import is now the canonical path for getting
// an AAC vocabulary onto a fixed-grid board. See plan
// `i-think-we-ll-need-quizzical-moore.md` for the migration story.
export type AacLayoutMode = 'free' | 'fixedGrid';
export type TileRole = 'core' | 'fringe' | 'navigation' | 'control' | 'quickPhrase' | 'audio';
export type WordClass =
  | 'pronoun'
  | 'verb'
  | 'descriptor'
  | 'preposition'
  | 'question'
  | 'social'
  | 'noun'
  | 'other';
