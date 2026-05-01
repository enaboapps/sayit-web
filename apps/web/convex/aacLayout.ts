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

export const AAC_PRESETS: Record<AacLayoutPreset, { rows: number; columns: number }> = {
  largeAccess16: { rows: 4, columns: 4 },
  standard36: { rows: 6, columns: 6 },
  dense48: { rows: 6, columns: 8 },
};

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
