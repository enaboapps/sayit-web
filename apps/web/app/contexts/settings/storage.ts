import {
  defaultAllSettings,
  defaultSettings,
  defaultUIPreferences,
  isTypingDockMode,
  normalizeDoubleEnterTimeout,
  normalizeTextSize,
  pickSettings,
  type AllSettings,
  type TypingDockMode,
  type UIPreferences,
} from './types';

function safeParseObject(value: string | null): Record<string, unknown> {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function parseBooleanSafely(value: string | null, fallback: boolean): boolean {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'boolean' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function parseTypingShareFontSize(value: string | null): number {
  const parsedFontSize = value
    ? parseInt(value, 10)
    : defaultUIPreferences.typingShareFontSize;

  return !isNaN(parsedFontSize)
    ? Math.max(12, Math.min(64, parsedFontSize))
    : defaultUIPreferences.typingShareFontSize;
}

function normalizeStoredSettings(parsedSettings: Record<string, unknown>) {
  const normalized = { ...parsedSettings };

  if (normalized.textSize !== undefined) {
    normalized.textSize = normalizeTextSize(normalized.textSize as number | string);
  }

  if (normalized.doubleEnterTimeoutMs !== undefined) {
    normalized.doubleEnterTimeoutMs = normalizeDoubleEnterTimeout(
      normalized.doubleEnterTimeoutMs as number | undefined
    );
  }

  return normalized;
}

function loadUIPreferencesFromStorage(storage: Storage): UIPreferences {
  const typingDockMode = storage.getItem('typingDockMode');
  const parsedTypingDockMode: TypingDockMode = isTypingDockMode(typingDockMode)
    ? typingDockMode
    : defaultUIPreferences.typingDockMode;

  return {
    typingAreaVisible: parseBooleanSafely(
      storage.getItem('typingAreaVisible'),
      defaultUIPreferences.typingAreaVisible
    ),
    typingAreaExpanded: parseBooleanSafely(
      storage.getItem('typingAreaExpanded'),
      defaultUIPreferences.typingAreaExpanded
    ),
    selectedBoardId: storage.getItem('selectedBoardId') || defaultUIPreferences.selectedBoardId,
    typingShareFontSize: parseTypingShareFontSize(storage.getItem('typing-share-font-size')),
    activeTypingTabId: storage.getItem('activeTypingTabId') || defaultUIPreferences.activeTypingTabId,
    typingDockMode: parsedTypingDockMode,
  };
}

export function loadSettingsFromLocalStorage(storage?: Storage): AllSettings {
  if (typeof window === 'undefined' && !storage) {
    return defaultAllSettings;
  }

  const localStorageRef = storage ?? window.localStorage;
  const parsedSettings = normalizeStoredSettings(
    safeParseObject(localStorageRef.getItem('settings'))
  );

  return {
    ...defaultSettings,
    ...parsedSettings,
    ...loadUIPreferencesFromStorage(localStorageRef),
  } as AllSettings;
}

export function saveSettingsToLocalStorage(allSettings: AllSettings, storage?: Storage) {
  if (typeof window === 'undefined' && !storage) return;

  const localStorageRef = storage ?? window.localStorage;
  const settings = pickSettings(allSettings);

  localStorageRef.setItem('settings', JSON.stringify(settings));
  localStorageRef.setItem('typingAreaVisible', JSON.stringify(allSettings.typingAreaVisible));
  localStorageRef.setItem('typingAreaExpanded', JSON.stringify(allSettings.typingAreaExpanded));

  if (allSettings.selectedBoardId) {
    localStorageRef.setItem('selectedBoardId', allSettings.selectedBoardId);
  } else {
    localStorageRef.removeItem('selectedBoardId');
  }

  localStorageRef.setItem('typing-share-font-size', allSettings.typingShareFontSize.toString());

  if (allSettings.activeTypingTabId) {
    localStorageRef.setItem('activeTypingTabId', allSettings.activeTypingTabId);
  } else {
    localStorageRef.removeItem('activeTypingTabId');
  }

  localStorageRef.setItem('typingDockMode', allSettings.typingDockMode);
}
