'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import {
  CONTRAST_PREFERENCE_STORAGE_KEY,
  MOTION_PREFERENCE_STORAGE_KEY,
  APPEARANCE_THEME_STORAGE_KEY,
  normalizeContrastPreference,
  normalizeAppearanceTheme,
  normalizeMotionPreference,
  readContrastPreference,
  readAppearanceTheme,
  readMotionPreference,
  resolveHighContrast,
  resolveReducedMotion,
  resolveAppearanceTheme,
  writeContrastPreference,
  writeAppearanceTheme,
  writeMotionPreference,
  type AppearanceTheme,
  type ContrastPreference,
  type MotionPreference,
  type ResolvedAppearanceTheme,
} from '@/lib/appearance';

interface AppearanceContextValue {
  theme: AppearanceTheme;
  resolvedTheme: ResolvedAppearanceTheme;
  setTheme: (theme: AppearanceTheme) => void;
  motionPreference: MotionPreference;
  contrastPreference: ContrastPreference;
  reduceMotion: boolean;
  highContrast: boolean;
  setMotionPreference: (preference: MotionPreference) => void;
  setContrastPreference: (preference: ContrastPreference) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function systemPrefersDark() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppearanceTheme>(() =>
    typeof window === 'undefined' ? 'system' : readAppearanceTheme(window.localStorage)
  );
  const [prefersDark, setPrefersDark] = useState(systemPrefersDark);
  const [motionPreference, setMotionPreferenceState] = useState<MotionPreference>(() =>
    typeof window === 'undefined' ? 'system' : readMotionPreference(window.localStorage)
  );
  const [contrastPreference, setContrastPreferenceState] = useState<ContrastPreference>(() =>
    typeof window === 'undefined' ? 'system' : readContrastPreference(window.localStorage)
  );
  const [systemReducedMotion, setSystemReducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [systemHighContrast, setSystemHighContrast] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-contrast: more)').matches
  );
  const resolvedTheme = resolveAppearanceTheme(theme, prefersDark);
  const reduceMotion = resolveReducedMotion(motionPreference, systemReducedMotion);
  const highContrast = resolveHighContrast(contrastPreference, systemHighContrast);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    const updateMotion = (event: MediaQueryListEvent) => setSystemReducedMotion(event.matches);
    const updateContrast = (event: MediaQueryListEvent) => setSystemHighContrast(event.matches);
    motionQuery.addEventListener('change', updateMotion);
    contrastQuery.addEventListener('change', updateContrast);
    return () => {
      motionQuery.removeEventListener('change', updateMotion);
      contrastQuery.removeEventListener('change', updateContrast);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      resolvedTheme === 'dark' ? '#1a1917' : '#f7f7f5',
    );
  }, [resolvedTheme]);

  useEffect(() => {
    document.documentElement.dataset.motion = reduceMotion ? 'reduced' : 'standard';
    document.documentElement.dataset.contrast = highContrast ? 'high' : 'standard';
  }, [highContrast, reduceMotion]);

  useEffect(() => {
    const syncFromAnotherTab = (event: StorageEvent) => {
      if (event.key === APPEARANCE_THEME_STORAGE_KEY) {
        setThemeState(normalizeAppearanceTheme(event.newValue));
      } else if (event.key === MOTION_PREFERENCE_STORAGE_KEY) {
        setMotionPreferenceState(normalizeMotionPreference(event.newValue));
      } else if (event.key === CONTRAST_PREFERENCE_STORAGE_KEY) {
        setContrastPreferenceState(normalizeContrastPreference(event.newValue));
      }
    };
    window.addEventListener('storage', syncFromAnotherTab);
    return () => window.removeEventListener('storage', syncFromAnotherTab);
  }, []);

  const value = useMemo<AppearanceContextValue>(() => ({
    theme,
    resolvedTheme,
    motionPreference,
    contrastPreference,
    reduceMotion,
    highContrast,
    setTheme: (nextTheme) => {
      writeAppearanceTheme(window.localStorage, nextTheme);
      setThemeState(nextTheme);
    },
    setMotionPreference: (preference) => {
      writeMotionPreference(window.localStorage, preference);
      setMotionPreferenceState(preference);
    },
    setContrastPreference: (preference) => {
      writeContrastPreference(window.localStorage, preference);
      setContrastPreferenceState(preference);
    },
  }), [contrastPreference, highContrast, motionPreference, reduceMotion, resolvedTheme, theme]);

  return (
    <AppearanceContext.Provider value={value}>
      <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>{children}</MotionConfig>
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance must be used within AppearanceProvider');
  return context;
}
