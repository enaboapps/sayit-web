export type AacLayoutPreset = 'largeAccess16' | 'standard36' | 'dense48';
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

export const AAC_PRESETS: Record<AacLayoutPreset, {
  label: string;
  description: string;
  rows: number;
  columns: number;
}> = {
  largeAccess16: {
    label: 'Large access 16',
    description: '4 x 4 grid for larger targets and fewer visible words.',
    rows: 4,
    columns: 4,
  },
  standard36: {
    label: 'Standard 36',
    description: '6 x 6 grid with the full Universal Core word set.',
    rows: 6,
    columns: 6,
  },
  dense48: {
    label: 'Dense 48',
    description: '8 x 6 grid with room for core, navigation, and growth.',
    rows: 6,
    columns: 8,
  },
};

export const DEFAULT_AAC_PRESET: AacLayoutPreset = 'standard36';
