'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { TTSProviderType } from '@/lib/tts-provider';

type TextSize = 'small' | 'medium' | 'large' | 'xlarge';
type EnterKeyBehavior = 'newline' | 'speak' | 'clear' | 'speakAndClear';

interface Settings {
  textSize: TextSize;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  speechVoice: string; // Store the voice URI
  enterKeyBehavior: EnterKeyBehavior;
  ttsProvider: TTSProviderType;
  ttsVoiceId: string;
  ttsStability: number;
  ttsSimilarityBoost: number;
}

interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const defaultSettings: Settings = {
  textSize: 'medium',
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 1.0,
  speechVoice: '', // Default to system default voice
  enterKeyBehavior: 'newline', // Default to newline
  ttsProvider: 'browser', // Default to browser TTS
  ttsVoiceId: '', // Will be set by the component based on available voices
  ttsStability: 0.5,
  ttsSimilarityBoost: 0.5,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }
    return defaultSettings;
  });

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    console.log(`Updating setting ${key} to:`, value);
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('settings', JSON.stringify(newSettings));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
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
