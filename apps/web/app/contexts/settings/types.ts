import type { TTSProviderType } from '@/lib/tts-provider';

export type TextSize = number;
export type EnterKeyBehavior = 'newline' | 'speak' | 'clear' | 'speakAndClear';
export type TypingDockMode = 'expanded' | 'fullscreen' | 'minimized';
export type MessageCaptureMode = 'disabled' | 'clearOnly' | 'speakOnly' | 'speakAndClearOnly' | 'speakAny';
export type TTSModelPreference = 'fast' | 'high_quality';

export const DOUBLE_ENTER_TIMEOUT_MIN_MS = 1000;
export const DOUBLE_ENTER_TIMEOUT_MAX_MS = 10000;

export interface Settings {
  textSize: TextSize;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  speechVoice: string;
  enterKeyBehavior: EnterKeyBehavior;
  doubleEnterEnabled: boolean;
  doubleEnterAction: EnterKeyBehavior;
  doubleEnterTimeoutMs: number;
  ttsProvider: TTSProviderType;
  ttsVoiceId: string;
  ttsStability: number;
  ttsSimilarityBoost: number;
  ttsModelPreference: TTSModelPreference;
  aiReplySuggestionsEnabled: boolean;
  messageCaptureMode: MessageCaptureMode;
  usePhraseBar: boolean;
  speakPhrasesOnTap: boolean;
}

export interface UIPreferences {
  typingAreaVisible: boolean;
  typingAreaExpanded: boolean;
  selectedBoardId: string | null;
  typingShareFontSize: number;
  activeTypingTabId: string | null;
  typingDockMode: TypingDockMode;
}

export type AllSettings = Settings & UIPreferences;

export interface SettingsContextType {
  settings: Settings;
  uiPreferences: UIPreferences;
  isLoading: boolean;
  isSyncing: boolean;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  updateUIPreference: <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => void;
}

export const defaultSettings: Settings = {
  textSize: 16,
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 1.0,
  speechVoice: '',
  enterKeyBehavior: 'newline',
  doubleEnterEnabled: false,
  doubleEnterAction: 'speak',
  doubleEnterTimeoutMs: 1000,
  ttsProvider: 'browser',
  ttsVoiceId: '',
  ttsStability: 0.5,
  ttsSimilarityBoost: 0.5,
  ttsModelPreference: 'fast',
  aiReplySuggestionsEnabled: true,
  messageCaptureMode: 'speakOnly',
  usePhraseBar: false,
  speakPhrasesOnTap: false,
};

export const defaultUIPreferences: UIPreferences = {
  typingAreaVisible: true,
  typingAreaExpanded: false,
  selectedBoardId: null,
  typingShareFontSize: 18,
  activeTypingTabId: null,
  typingDockMode: 'expanded',
};

export const defaultAllSettings: AllSettings = {
  ...defaultSettings,
  ...defaultUIPreferences,
};

export function normalizeTextSize(value: number | string): number {
  if (typeof value === 'number') {
    return value;
  }

  const enumMap: Record<string, number> = {
    small: 12,
    medium: 16,
    large: 24,
    xlarge: 32,
  };

  return enumMap[value] ?? defaultSettings.textSize;
}

export function normalizeDoubleEnterTimeout(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return defaultSettings.doubleEnterTimeoutMs;
  }

  return Math.max(
    DOUBLE_ENTER_TIMEOUT_MIN_MS,
    Math.min(DOUBLE_ENTER_TIMEOUT_MAX_MS, value as number)
  );
}

export function isTypingDockMode(value: unknown): value is TypingDockMode {
  return value === 'expanded' || value === 'fullscreen' || value === 'minimized';
}

export function pickSettings(allSettings: AllSettings): Settings {
  return {
    textSize: allSettings.textSize,
    speechRate: allSettings.speechRate,
    speechPitch: allSettings.speechPitch,
    speechVolume: allSettings.speechVolume,
    speechVoice: allSettings.speechVoice,
    enterKeyBehavior: allSettings.enterKeyBehavior,
    doubleEnterEnabled: allSettings.doubleEnterEnabled,
    doubleEnterAction: allSettings.doubleEnterAction,
    doubleEnterTimeoutMs: normalizeDoubleEnterTimeout(allSettings.doubleEnterTimeoutMs),
    ttsProvider: allSettings.ttsProvider,
    ttsVoiceId: allSettings.ttsVoiceId,
    ttsStability: allSettings.ttsStability,
    ttsSimilarityBoost: allSettings.ttsSimilarityBoost,
    ttsModelPreference: allSettings.ttsModelPreference,
    aiReplySuggestionsEnabled: allSettings.aiReplySuggestionsEnabled,
    messageCaptureMode: allSettings.messageCaptureMode,
    usePhraseBar: allSettings.usePhraseBar,
    speakPhrasesOnTap: allSettings.speakPhrasesOnTap,
  };
}

export function pickUIPreferences(allSettings: AllSettings): UIPreferences {
  return {
    typingAreaVisible: allSettings.typingAreaVisible,
    typingAreaExpanded: allSettings.typingAreaExpanded,
    selectedBoardId: allSettings.selectedBoardId,
    typingShareFontSize: allSettings.typingShareFontSize,
    activeTypingTabId: allSettings.activeTypingTabId,
    typingDockMode: allSettings.typingDockMode,
  };
}
