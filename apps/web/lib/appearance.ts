export type AppearanceTheme = 'system' | 'light' | 'dark';
export type ResolvedAppearanceTheme = 'light' | 'dark';

export const APPEARANCE_THEME_STORAGE_KEY = 'sayit-appearance-theme';

export function normalizeAppearanceTheme(value: unknown): AppearanceTheme {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
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

export const APPEARANCE_INIT_SCRIPT = `(() => {
  try {
    const stored = localStorage.getItem('${APPEARANCE_THEME_STORAGE_KEY}');
    const preference = stored === 'light' || stored === 'dark' ? stored : 'system';
    const resolved = preference === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#1a1917' : '#f7f7f5');
  } catch {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.colorScheme = 'dark';
  }
})();`;
