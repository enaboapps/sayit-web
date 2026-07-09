import {
  APPEARANCE_THEME_STORAGE_KEY,
  normalizeAppearanceTheme,
  readAppearanceTheme,
  resolveAppearanceTheme,
  writeAppearanceTheme,
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
});
