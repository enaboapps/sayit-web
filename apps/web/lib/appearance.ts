export type AppearanceTheme = 'system' | 'light' | 'dark';
export type ResolvedAppearanceTheme = 'light' | 'dark';
export type MotionPreference = 'system' | 'reduced';
export type ContrastPreference = 'system' | 'high';

export const APPEARANCE_THEME_STORAGE_KEY = 'sayit-appearance-theme';
export const MOTION_PREFERENCE_STORAGE_KEY = 'sayit-motion-preference';
export const CONTRAST_PREFERENCE_STORAGE_KEY = 'sayit-contrast-preference';

export function normalizeAppearanceTheme(value: unknown): AppearanceTheme {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function normalizeMotionPreference(value: unknown): MotionPreference {
  return value === 'reduced' || value === 'system' ? value : 'system';
}

export function normalizeContrastPreference(value: unknown): ContrastPreference {
  return value === 'high' || value === 'system' ? value : 'system';
}

export function resolveAppearanceTheme(
  theme: AppearanceTheme,
  prefersDark: boolean,
): ResolvedAppearanceTheme {
  return theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
}

export function readAppearanceTheme(storage?: Pick<Storage, 'getItem'>): AppearanceTheme {
  if (!storage) return 'system';
  return normalizeAppearanceTheme(storage.getItem(APPEARANCE_THEME_STORAGE_KEY));
}

export function writeAppearanceTheme(
  storage: Pick<Storage, 'setItem'>,
  theme: AppearanceTheme,
) {
  storage.setItem(APPEARANCE_THEME_STORAGE_KEY, theme);
}

export function resolveReducedMotion(preference: MotionPreference, systemReduced: boolean) {
  return preference === 'reduced' || systemReduced;
}

export function resolveHighContrast(preference: ContrastPreference, systemHigh: boolean) {
  return preference === 'high' || systemHigh;
}

export function readMotionPreference(storage?: Pick<Storage, 'getItem'>): MotionPreference {
  if (!storage) return 'system';
  return normalizeMotionPreference(storage.getItem(MOTION_PREFERENCE_STORAGE_KEY));
}

export function readContrastPreference(storage?: Pick<Storage, 'getItem'>): ContrastPreference {
  if (!storage) return 'system';
  return normalizeContrastPreference(storage.getItem(CONTRAST_PREFERENCE_STORAGE_KEY));
}

export function writeMotionPreference(storage: Pick<Storage, 'setItem'>, preference: MotionPreference) {
  storage.setItem(MOTION_PREFERENCE_STORAGE_KEY, preference);
}

export function writeContrastPreference(storage: Pick<Storage, 'setItem'>, preference: ContrastPreference) {
  storage.setItem(CONTRAST_PREFERENCE_STORAGE_KEY, preference);
}

export const APPEARANCE_INIT_SCRIPT = `(() => {
  try {
    const stored = localStorage.getItem('${APPEARANCE_THEME_STORAGE_KEY}');
    const storedMotion = localStorage.getItem('${MOTION_PREFERENCE_STORAGE_KEY}');
    const storedContrast = localStorage.getItem('${CONTRAST_PREFERENCE_STORAGE_KEY}');
    const preference = stored === 'light' || stored === 'dark' ? stored : 'system';
    const resolved = preference === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    document.documentElement.dataset.motion = storedMotion === 'reduced' || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'standard';
    document.documentElement.dataset.contrast = storedContrast === 'high' || matchMedia('(prefers-contrast: more)').matches ? 'high' : 'standard';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#1a1917' : '#f7f7f5');
  } catch {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.colorScheme = 'dark';
    document.documentElement.dataset.motion = 'standard';
    document.documentElement.dataset.contrast = 'standard';
  }
})();`;
