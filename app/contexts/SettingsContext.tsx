'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { TTSProviderType } from '@/lib/tts-provider';
import { useAuth } from './AuthContext';

type TextSize = number;
type EnterKeyBehavior = 'newline' | 'speak' | 'clear' | 'speakAndClear';
type TypingDockMode = 'compact' | 'expanded' | 'fullscreen';

interface Settings {
  textSize: TextSize;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  speechVoice: string;
  enterKeyBehavior: EnterKeyBehavior;
  ttsProvider: TTSProviderType;
  ttsVoiceId: string;
  ttsStability: number;
  ttsSimilarityBoost: number;
}

interface UIPreferences {
  typingAreaVisible: boolean;
  typingAreaExpanded: boolean;
  selectedBoardId: string | null;
  typingShareFontSize: number;
  activeTypingTabId: string | null;
  typingDockMode: TypingDockMode;
}

type AllSettings = Settings & UIPreferences;

interface SettingsContextType {
  settings: Settings;
  uiPreferences: UIPreferences;
  isLoading: boolean;
  isSyncing: boolean;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  updateUIPreference: <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => void;
}

const defaultSettings: Settings = {
  textSize: 16,
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 1.0,
  speechVoice: '',
  enterKeyBehavior: 'newline',
  ttsProvider: 'browser',
  ttsVoiceId: '',
  ttsStability: 0.5,
  ttsSimilarityBoost: 0.5,
};

const defaultUIPreferences: UIPreferences = {
  typingAreaVisible: true,
  typingAreaExpanded: false,
  selectedBoardId: null,
  typingShareFontSize: 18,
  activeTypingTabId: null,
  typingDockMode: 'compact',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Helper to convert textSize from old enum to number
function normalizeTextSize(value: number | string): number {
  if (typeof value === 'number') {
    return value;
  }
  const enumMap: Record<string, number> = {
    small: 12,
    medium: 16,
    large: 24,
    xlarge: 32,
  };
  return enumMap[value] ?? 16;
}

// Helper function to load settings from localStorage
function loadFromLocalStorage(): AllSettings {
  if (typeof window === 'undefined') {
    return { ...defaultSettings, ...defaultUIPreferences };
  }

  // Load main settings
  const savedSettings = localStorage.getItem('settings');
  const parsedSettings = savedSettings ? JSON.parse(savedSettings) : {};

  // Normalize textSize from old enum format if needed
  if (parsedSettings.textSize !== undefined) {
    parsedSettings.textSize = normalizeTextSize(parsedSettings.textSize);
  }

  const settings = { ...defaultSettings, ...parsedSettings };

  // Load UI preferences from various localStorage keys
  const typingAreaVisible = localStorage.getItem('typingAreaVisible');
  const typingAreaExpanded = localStorage.getItem('typingAreaExpanded');
  const selectedBoardId = localStorage.getItem('selectedBoardId');
  const typingShareFontSize = localStorage.getItem('typing-share-font-size');
  const activeTypingTabId = localStorage.getItem('activeTypingTabId');
  const typingDockMode = localStorage.getItem('typingDockMode');

  const parsedFontSize = typingShareFontSize ? parseInt(typingShareFontSize, 10) : defaultUIPreferences.typingShareFontSize;
  const validFontSize = !isNaN(parsedFontSize)
    ? Math.max(12, Math.min(64, parsedFontSize))
    : defaultUIPreferences.typingShareFontSize;

  // Helper to safely parse JSON booleans
  const parseBooleanSafely = (value: string | null, fallback: boolean): boolean => {
    if (!value) return fallback;
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'boolean' ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  // Parse typing dock mode
  const validTypingDockModes = ['compact', 'expanded', 'fullscreen'];
  const parsedTypingDockMode = typingDockMode && validTypingDockModes.includes(typingDockMode)
    ? typingDockMode as TypingDockMode
    : defaultUIPreferences.typingDockMode;

  const uiPreferences: UIPreferences = {
    typingAreaVisible: parseBooleanSafely(typingAreaVisible, defaultUIPreferences.typingAreaVisible),
    typingAreaExpanded: parseBooleanSafely(typingAreaExpanded, defaultUIPreferences.typingAreaExpanded),
    selectedBoardId: selectedBoardId || defaultUIPreferences.selectedBoardId,
    typingShareFontSize: validFontSize,
    activeTypingTabId: activeTypingTabId || defaultUIPreferences.activeTypingTabId,
    typingDockMode: parsedTypingDockMode,
  };

  return { ...settings, ...uiPreferences };
}

// Helper function to save to localStorage
function saveToLocalStorage(allSettings: AllSettings) {
  if (typeof window === 'undefined') return;

  // Save main settings
  const settings: Settings = {
    textSize: allSettings.textSize,
    speechRate: allSettings.speechRate,
    speechPitch: allSettings.speechPitch,
    speechVolume: allSettings.speechVolume,
    speechVoice: allSettings.speechVoice,
    enterKeyBehavior: allSettings.enterKeyBehavior,
    ttsProvider: allSettings.ttsProvider,
    ttsVoiceId: allSettings.ttsVoiceId,
    ttsStability: allSettings.ttsStability,
    ttsSimilarityBoost: allSettings.ttsSimilarityBoost,
  };
  localStorage.setItem('settings', JSON.stringify(settings));

  // Save UI preferences to their respective keys (for backward compatibility)
  localStorage.setItem('typingAreaVisible', JSON.stringify(allSettings.typingAreaVisible));
  localStorage.setItem('typingAreaExpanded', JSON.stringify(allSettings.typingAreaExpanded));
  if (allSettings.selectedBoardId) {
    localStorage.setItem('selectedBoardId', allSettings.selectedBoardId);
  } else {
    localStorage.removeItem('selectedBoardId');
  }
  localStorage.setItem('typing-share-font-size', allSettings.typingShareFontSize.toString());
  if (allSettings.activeTypingTabId) {
    localStorage.setItem('activeTypingTabId', allSettings.activeTypingTabId);
  } else {
    localStorage.removeItem('activeTypingTabId');
  }
  localStorage.setItem('typingDockMode', allSettings.typingDockMode);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [allSettings, setAllSettings] = useState<AllSettings>(() => loadFromLocalStorage());
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasMigrated, setHasMigrated] = useState(false);

  // Convex hooks - only query when authenticated
  const convexSettings = useQuery(api.userSettings.getUserSettings, user ? {} : 'skip');
  const initializeSettings = useMutation(api.userSettings.initializeSettings);
  const updateSettingsMutation = useMutation(api.userSettings.updateSettings);

  // Effect: Sync with Convex on mount/sign-in
  useEffect(() => {
    if (!user) {
      // Guest user - no Convex sync needed
      setIsLoading(false);
      setHasMigrated(false);
      return;
    }

    if (convexSettings === undefined) {
      // Still loading from Convex
      setIsLoading(true);
      return;
    }

    if (convexSettings === null && !hasMigrated) {
      // No settings in Convex - migrate from localStorage
      setIsLoading(true);
      const localSettings = loadFromLocalStorage();

      initializeSettings({
        textSize: localSettings.textSize,
        speechRate: localSettings.speechRate,
        speechPitch: localSettings.speechPitch,
        speechVolume: localSettings.speechVolume,
        speechVoice: localSettings.speechVoice,
        enterKeyBehavior: localSettings.enterKeyBehavior,
        ttsProvider: localSettings.ttsProvider,
        ttsVoiceId: localSettings.ttsVoiceId,
        ttsStability: localSettings.ttsStability,
        ttsSimilarityBoost: localSettings.ttsSimilarityBoost,
        typingAreaVisible: localSettings.typingAreaVisible,
        typingAreaExpanded: localSettings.typingAreaExpanded,
        selectedBoardId: localSettings.selectedBoardId ?? undefined,
        typingShareFontSize: localSettings.typingShareFontSize,
        activeTypingTabId: localSettings.activeTypingTabId ?? undefined,
        typingDockMode: localSettings.typingDockMode,
      })
        .then(() => {
          console.log('Settings migrated to Convex successfully');
          setHasMigrated(true);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Failed to migrate settings to Convex:', error);
          setIsLoading(false);
        });
    } else if (convexSettings) {
      // Settings exist in Convex - update from server
      const serverSettings: AllSettings = {
        textSize: normalizeTextSize(convexSettings.textSize),
        speechRate: convexSettings.speechRate,
        speechPitch: convexSettings.speechPitch,
        speechVolume: convexSettings.speechVolume,
        speechVoice: convexSettings.speechVoice,
        enterKeyBehavior: convexSettings.enterKeyBehavior,
        ttsProvider: convexSettings.ttsProvider,
        ttsVoiceId: convexSettings.ttsVoiceId,
        ttsStability: convexSettings.ttsStability,
        ttsSimilarityBoost: convexSettings.ttsSimilarityBoost,
        typingAreaVisible: convexSettings.typingAreaVisible,
        typingAreaExpanded: convexSettings.typingAreaExpanded,
        selectedBoardId: convexSettings.selectedBoardId ?? null,
        typingShareFontSize: convexSettings.typingShareFontSize,
        activeTypingTabId: convexSettings.activeTypingTabId ?? null,
        typingDockMode: (convexSettings.typingDockMode as TypingDockMode) ?? defaultUIPreferences.typingDockMode,
      };

      setAllSettings(serverSettings);
      saveToLocalStorage(serverSettings);
      setIsLoading(false);
      setHasMigrated(true);
    }
  }, [user, convexSettings, hasMigrated, initializeSettings]);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    console.log(`Updating setting ${key} to:`, value);

    // Use functional update to avoid depending on allSettings
    setAllSettings((prev) => {
      const newAllSettings = { ...prev, [key]: value };

      // 2. Update localStorage immediately (for offline support)
      saveToLocalStorage(newAllSettings);

      return newAllSettings;
    });

    // 3. If authenticated, sync to Convex in background
    if (user) {
      setIsSyncing(true);
      updateSettingsMutation({
        [key]: value,
        lastSyncedAt: Date.now(),
      })
        .then(() => {
          setIsSyncing(false);
        })
        .catch((error) => {
          console.error('Failed to sync setting to Convex:', error);
          setIsSyncing(false);
          // Don't revert - keep optimistic update
        });
    }
  }, [user, updateSettingsMutation]);

  const updateUIPreference = useCallback(<K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => {
    console.log(`Updating UI preference ${key} to:`, value);

    // Use functional update to avoid depending on allSettings
    setAllSettings((prev) => {
      const newAllSettings = { ...prev, [key]: value };

      // 2. Update localStorage immediately (for offline support)
      saveToLocalStorage(newAllSettings);

      return newAllSettings;
    });

    // 3. If authenticated, sync to Convex in background
    if (user) {
      setIsSyncing(true);
      // Convert null to undefined for Convex (v.optional only accepts undefined, not null)
      const convexValue = value === null ? undefined : value;
      updateSettingsMutation({
        [key]: convexValue,
        lastSyncedAt: Date.now(),
      })
        .then(() => {
          setIsSyncing(false);
        })
        .catch((error) => {
          console.error('Failed to sync UI preference to Convex:', error);
          setIsSyncing(false);
          // Don't revert - keep optimistic update
        });
    }
  }, [user, updateSettingsMutation]);

  const settings: Settings = {
    textSize: allSettings.textSize,
    speechRate: allSettings.speechRate,
    speechPitch: allSettings.speechPitch,
    speechVolume: allSettings.speechVolume,
    speechVoice: allSettings.speechVoice,
    enterKeyBehavior: allSettings.enterKeyBehavior,
    ttsProvider: allSettings.ttsProvider,
    ttsVoiceId: allSettings.ttsVoiceId,
    ttsStability: allSettings.ttsStability,
    ttsSimilarityBoost: allSettings.ttsSimilarityBoost,
  };

  const uiPreferences: UIPreferences = {
    typingAreaVisible: allSettings.typingAreaVisible,
    typingAreaExpanded: allSettings.typingAreaExpanded,
    selectedBoardId: allSettings.selectedBoardId,
    typingShareFontSize: allSettings.typingShareFontSize,
    activeTypingTabId: allSettings.activeTypingTabId,
    typingDockMode: allSettings.typingDockMode,
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        uiPreferences,
        isLoading,
        isSyncing,
        updateSetting,
        updateUIPreference,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
