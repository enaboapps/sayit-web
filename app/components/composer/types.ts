import type { TonePreset } from '../typing/ToneSheet';

export type EnterKeyBehavior = 'newline' | 'speak' | 'clear' | 'speakAndClear';

export interface ReplySuggestionsConfig {
  history: string[];
  enabled: boolean;
  onSelect: (suggestion: string) => void;
}

export interface ComposerProps {
  text: string;
  onChange: (text: string) => void;
  onSpeak: (source?: 'speak' | 'speakAndClear') => void;
  onSpeakWithTone?: (toneTag: string, options?: { modelId?: string }) => void;
  onMessageCompleted?: (payload: { text: string; source: 'clear'; tabId?: string | null }) => void;
  onStop?: () => void;
  isSpeaking?: boolean;
  isAvailable?: boolean;
  className?: string;
  enableTabs?: boolean;
  enableLiveTyping?: boolean;
  enableFixText?: boolean;
  enableToneControl?: boolean;
  onAddAsPhrase?: (text: string) => void;
  replySuggestions?: ReplySuggestionsConfig;
}

export type TextareaScrollIntent = {
  selectionStart: number;
  selectionEnd: number;
  shouldScrollToEnd: boolean;
};

export type TextareaScrollSnapshot = {
  selectionStart: number;
  selectionEnd: number;
  wasAtEnd: boolean;
  wasNearBottom: boolean;
};
