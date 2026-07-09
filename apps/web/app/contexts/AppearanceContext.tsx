'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  APPEARANCE_THEME_STORAGE_KEY,
  normalizeAppearanceTheme,
  readAppearanceTheme,
  resolveAppearanceTheme,
  writeAppearanceTheme,
  type AppearanceTheme,
  type ResolvedAppearanceTheme,
} from '@/lib/appearance';

interface AppearanceContextValue {
  theme: AppearanceTheme;
  resolvedTheme: ResolvedAppearanceTheme;
  setTheme: (theme: AppearanceTheme) => void;
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
  const resolvedTheme = resolveAppearanceTheme(theme, prefersDark);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
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
    const syncFromAnotherTab = (event: StorageEvent) => {
      if (event.key === APPEARANCE_THEME_STORAGE_KEY) {
        setThemeState(normalizeAppearanceTheme(event.newValue));
      }
    };
    window.addEventListener('storage', syncFromAnotherTab);
    return () => window.removeEventListener('storage', syncFromAnotherTab);
  }, []);

  const value = useMemo<AppearanceContextValue>(() => ({
    theme,
    resolvedTheme,
    setTheme: (nextTheme) => {
      writeAppearanceTheme(window.localStorage, nextTheme);
      setThemeState(nextTheme);
    },
  }), [resolvedTheme, theme]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance must be used within AppearanceProvider');
  return context;
}
