'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  defaultAllSettings,
  pickSettings,
  pickUIPreferences,
  type AllSettings,
  type Settings,
  type SettingsContextType,
  type UIPreferences,
} from './settings/types';
import {
  loadSettingsFromLocalStorage,
  saveSettingsToLocalStorage,
} from './settings/storage';
import { useSettingsSync } from './settings/useSettingsSync';

export type {
  AllSettings,
  EnterKeyBehavior,
  MessageCaptureMode,
  Settings,
  SettingsContextType,
  TextSize,
  TTSModelPreference,
  TypingDockMode,
  UIPreferences,
} from './settings/types';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [allSettings, setAllSettings] = useState<AllSettings>(defaultAllSettings);
  const hasSkippedInitialPersistRef = useRef(false);
  const {
    isLoading,
    isSyncing,
    syncSetting,
    syncUIPreference,
  } = useSettingsSync({ user, setAllSettings });

  useEffect(() => {
    setAllSettings(loadSettingsFromLocalStorage());
  }, []);

  useEffect(() => {
    if (!hasSkippedInitialPersistRef.current) {
      hasSkippedInitialPersistRef.current = true;
      return;
    }

    saveSettingsToLocalStorage(allSettings);
  }, [allSettings]);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    console.log(`Updating setting ${key} to:`, value);

    setAllSettings((prev) => {
      return { ...prev, [key]: value };
    });

    syncSetting(key, value);
  }, [syncSetting]);

  const updateUIPreference = useCallback(<K extends keyof UIPreferences>(
    key: K,
    value: UIPreferences[K]
  ) => {
    console.log(`Updating UI preference ${key} to:`, value);

    setAllSettings((prev) => {
      return { ...prev, [key]: value };
    });

    syncUIPreference(key, value);
  }, [syncUIPreference]);

  return (
    <SettingsContext.Provider
      value={{
        settings: pickSettings(allSettings),
        uiPreferences: pickUIPreferences(allSettings),
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
