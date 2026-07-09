import {
  APPEARANCE_THEME_STORAGE_KEY,
  CONTRAST_PREFERENCE_STORAGE_KEY,
  MOTION_PREFERENCE_STORAGE_KEY,
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
} from '@/lib/appearance';

describe('appearance theme infrastructure', () => {
  it.each([
    ['system', 'system'],
    ['light', 'light'],
    ['dark', 'dark'],
    ['legacy-dark-theme', 'system'],
    [null, 'system'],
  ])('normalizes %p to %s', (stored, expected) => {
    expect(normalizeAppearanceTheme(stored)).toBe(expected);
  });

  it('resolves system preference while explicit themes win', () => {
    expect(resolveAppearanceTheme('system', true)).toBe('dark');
    expect(resolveAppearanceTheme('system', false)).toBe('light');
    expect(resolveAppearanceTheme('light', true)).toBe('light');
    expect(resolveAppearanceTheme('dark', false)).toBe('dark');
  });

  it('normalizes motion and contrast preferences safely', () => {
    expect(normalizeMotionPreference('reduced')).toBe('reduced');
    expect(normalizeMotionPreference('full')).toBe('system');
    expect(normalizeContrastPreference('high')).toBe('high');
    expect(normalizeContrastPreference('low')).toBe('system');
  });

  it('never lets an app preference weaken matching OS accessibility settings', () => {
    expect(resolveReducedMotion('system', true)).toBe(true);
    expect(resolveReducedMotion('reduced', false)).toBe(true);
    expect(resolveHighContrast('system', true)).toBe(true);
    expect(resolveHighContrast('high', false)).toBe(true);
  });

  it('reads and writes the device-local theme key', () => {
    const storage = {
      getItem: jest.fn(() => 'dark'),
      setItem: jest.fn(),
    };

    expect(readAppearanceTheme(storage)).toBe('dark');
    writeAppearanceTheme(storage, 'light');
    expect(storage.getItem).toHaveBeenCalledWith(APPEARANCE_THEME_STORAGE_KEY);
    expect(storage.setItem).toHaveBeenCalledWith(APPEARANCE_THEME_STORAGE_KEY, 'light');
  });

  it('reads and writes device-local motion and contrast keys', () => {
    const values: Record<string, string> = {
      [MOTION_PREFERENCE_STORAGE_KEY]: 'reduced',
      [CONTRAST_PREFERENCE_STORAGE_KEY]: 'high',
    };
    const storage = {
      getItem: jest.fn((key: string) => values[key] ?? null),
      setItem: jest.fn(),
    };

    expect(readMotionPreference(storage)).toBe('reduced');
    expect(readContrastPreference(storage)).toBe('high');
    writeMotionPreference(storage, 'system');
    writeContrastPreference(storage, 'system');
    expect(storage.setItem).toHaveBeenCalledWith(MOTION_PREFERENCE_STORAGE_KEY, 'system');
    expect(storage.setItem).toHaveBeenCalledWith(CONTRAST_PREFERENCE_STORAGE_KEY, 'system');
  });
});
