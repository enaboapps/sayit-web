'use client';

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  defaultSettings,
  defaultUIPreferences,
  isTypingDockMode,
  normalizeDoubleEnterTimeout,
  normalizeTextSize,
  type AllSettings,
  type EnterKeyBehavior,
  type MessageCaptureMode,
  type Settings,
  type TTSModelPreference,
  type UIPreferences,
} from './types';
import {
  loadSettingsFromLocalStorage,
  saveSettingsToLocalStorage,
} from './storage';

type AuthUser = {
  id?: string;
} | null | undefined;

type ConvexSettings = {
  textSize: number | string;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  speechVoice: string;
  enterKeyBehavior: EnterKeyBehavior;
  doubleEnterEnabled?: boolean;
  doubleEnterAction?: EnterKeyBehavior;
  doubleEnterTimeoutMs?: number;
  ttsProvider: Settings['ttsProvider'];
  ttsVoiceId: string;
  ttsStability: number;
  ttsSimilarityBoost: number;
  ttsModelPreference?: TTSModelPreference;
  aiReplySuggestionsEnabled?: boolean;
  messageCaptureMode?: MessageCaptureMode;
  usePhraseBar?: boolean;
  speakPhrasesOnTap?: boolean;
  typingAreaVisible: boolean;
  typingAreaExpanded: boolean;
  selectedBoardId?: string;
  typingShareFontSize: number;
  activeTypingTabId?: string;
  typingDockMode?: string;
};

type UseSettingsSyncOptions = {
  user: AuthUser;
  setAllSettings: Dispatch<SetStateAction<AllSettings>>;
};

function buildInitializeSettingsPayload(localSettings: AllSettings) {
  return {
    textSize: localSettings.textSize,
    speechRate: localSettings.speechRate,
    speechPitch: localSettings.speechPitch,
    speechVolume: localSettings.speechVolume,
    speechVoice: localSettings.speechVoice,
    enterKeyBehavior: localSettings.enterKeyBehavior,
    doubleEnterEnabled: localSettings.doubleEnterEnabled,
    doubleEnterAction: localSettings.doubleEnterAction,
    doubleEnterTimeoutMs: normalizeDoubleEnterTimeout(localSettings.doubleEnterTimeoutMs),
    ttsProvider: localSettings.ttsProvider,
    ttsVoiceId: localSettings.ttsVoiceId,
    ttsStability: localSettings.ttsStability,
    ttsSimilarityBoost: localSettings.ttsSimilarityBoost,
    ttsModelPreference: localSettings.ttsModelPreference,
    aiReplySuggestionsEnabled: localSettings.aiReplySuggestionsEnabled,
    messageCaptureMode: localSettings.messageCaptureMode,
    usePhraseBar: localSettings.usePhraseBar,
    speakPhrasesOnTap: localSettings.speakPhrasesOnTap,
    typingAreaVisible: localSettings.typingAreaVisible,
    typingAreaExpanded: localSettings.typingAreaExpanded,
    selectedBoardId: localSettings.selectedBoardId ?? undefined,
    typingShareFontSize: localSettings.typingShareFontSize,
    activeTypingTabId: localSettings.activeTypingTabId ?? undefined,
    typingDockMode: localSettings.typingDockMode,
  };
}

function mergeConvexSettings(convexSettings: ConvexSettings): AllSettings {
  return {
    textSize: normalizeTextSize(convexSettings.textSize),
    speechRate: convexSettings.speechRate,
    speechPitch: convexSettings.speechPitch,
    speechVolume: convexSettings.speechVolume,
    speechVoice: convexSettings.speechVoice,
    enterKeyBehavior: convexSettings.enterKeyBehavior,
    doubleEnterEnabled: convexSettings.doubleEnterEnabled ?? defaultSettings.doubleEnterEnabled,
    doubleEnterAction: convexSettings.doubleEnterAction ?? defaultSettings.doubleEnterAction,
    doubleEnterTimeoutMs: normalizeDoubleEnterTimeout(
      convexSettings.doubleEnterTimeoutMs ?? defaultSettings.doubleEnterTimeoutMs
    ),
    ttsProvider: convexSettings.ttsProvider,
    ttsVoiceId: convexSettings.ttsVoiceId,
    ttsStability: convexSettings.ttsStability,
    ttsSimilarityBoost: convexSettings.ttsSimilarityBoost,
    ttsModelPreference: convexSettings.ttsModelPreference ?? defaultSettings.ttsModelPreference,
    aiReplySuggestionsEnabled: convexSettings.aiReplySuggestionsEnabled ?? defaultSettings.aiReplySuggestionsEnabled,
    messageCaptureMode: convexSettings.messageCaptureMode ?? defaultSettings.messageCaptureMode,
    usePhraseBar: convexSettings.usePhraseBar ?? defaultSettings.usePhraseBar,
    speakPhrasesOnTap: convexSettings.speakPhrasesOnTap ?? defaultSettings.speakPhrasesOnTap,
    typingAreaVisible: convexSettings.typingAreaVisible,
    typingAreaExpanded: convexSettings.typingAreaExpanded,
    selectedBoardId: convexSettings.selectedBoardId ?? null,
    typingShareFontSize: convexSettings.typingShareFontSize,
    activeTypingTabId: convexSettings.activeTypingTabId ?? null,
    typingDockMode: isTypingDockMode(convexSettings.typingDockMode)
      ? convexSettings.typingDockMode
      : defaultUIPreferences.typingDockMode,
  };
}

export function useSettingsSync({
  user,
  setAllSettings,
}: UseSettingsSyncOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasMigrated, setHasMigrated] = useState(false);

  const convexSettings = useQuery(api.userSettings.getUserSettings, user ? {} : 'skip');
  const initializeSettings = useMutation(api.userSettings.initializeSettings);
  const updateSettingsMutation = useMutation(api.userSettings.updateSettings);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setHasMigrated(false);
      return;
    }

    if (convexSettings === undefined) {
      setIsLoading(true);
      return;
    }

    if (convexSettings === null && !hasMigrated) {
      setIsLoading(true);
      const localSettings = loadSettingsFromLocalStorage();

      initializeSettings(buildInitializeSettingsPayload(localSettings))
        .then(() => {
          console.log('Settings migrated to Convex successfully');
          setHasMigrated(true);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Failed to migrate settings to Convex:', error);
          setIsLoading(false);
        });
      return;
    }

    if (convexSettings) {
      const serverSettings = mergeConvexSettings(convexSettings as ConvexSettings);

      setAllSettings(serverSettings);
      saveSettingsToLocalStorage(serverSettings);
      setIsLoading(false);
      setHasMigrated(true);
    }
  }, [user, convexSettings, hasMigrated, initializeSettings, setAllSettings]);

  const syncSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (!user) return;

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
      });
  }, [user, updateSettingsMutation]);

  const syncUIPreference = useCallback(<K extends keyof UIPreferences>(
    key: K,
    value: UIPreferences[K]
  ) => {
    if (!user) return;

    setIsSyncing(true);
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
      });
  }, [user, updateSettingsMutation]);

  return {
    isLoading,
    isSyncing,
    syncSetting,
    syncUIPreference,
  };
}
