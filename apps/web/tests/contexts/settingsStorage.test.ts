import {
  loadSettingsFromLocalStorage,
  saveSettingsToLocalStorage,
} from '@/app/contexts/settings/storage';
import {
  defaultAllSettings,
  type AllSettings,
} from '@/app/contexts/settings/types';

function createStorage(initial: Record<string, string> = {}): Storage {
  let store = { ...initial };

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: jest.fn(() => {
      store = {};
    }),
    getItem: jest.fn((key: string) => store[key] ?? null),
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
  };
}

describe('settings storage helpers', () => {
  it('falls back to defaults when stored settings JSON is malformed', () => {
    const storage = createStorage({
      settings: '{not-json',
      typingAreaVisible: 'not-json',
      'typing-share-font-size': 'bad',
      typingDockMode: 'invalid',
    });

    const loaded = loadSettingsFromLocalStorage(storage);

    expect(loaded.textSize).toBe(defaultAllSettings.textSize);
    expect(loaded.typingAreaVisible).toBe(defaultAllSettings.typingAreaVisible);
    expect(loaded.typingShareFontSize).toBe(defaultAllSettings.typingShareFontSize);
    expect(loaded.typingDockMode).toBe(defaultAllSettings.typingDockMode);
  });

  it('normalizes legacy and bounded setting values from storage', () => {
    const storage = createStorage({
      settings: JSON.stringify({
        textSize: 'large',
        doubleEnterTimeoutMs: 20000,
      }),
      typingAreaVisible: 'false',
      typingAreaExpanded: 'true',
      'typing-share-font-size': '100',
      typingDockMode: 'fullscreen',
    });

    const loaded = loadSettingsFromLocalStorage(storage);

    expect(loaded.textSize).toBe(24);
    expect(loaded.doubleEnterTimeoutMs).toBe(10000);
    expect(loaded.typingAreaVisible).toBe(false);
    expect(loaded.typingAreaExpanded).toBe(true);
    expect(loaded.typingShareFontSize).toBe(64);
    expect(loaded.typingDockMode).toBe('fullscreen');
  });

  it('persists settings and removes nullable preference keys when cleared', () => {
    const storage = createStorage({
      selectedBoardId: 'old-board',
      activeTypingTabId: 'old-tab',
    });
    const settings: AllSettings = {
      ...defaultAllSettings,
      textSize: 32,
      selectedBoardId: null,
      activeTypingTabId: null,
      typingDockMode: 'minimized',
    };

    saveSettingsToLocalStorage(settings, storage);

    expect(storage.setItem).toHaveBeenCalledWith(
      'settings',
      expect.stringContaining('"textSize":32')
    );
    expect(storage.removeItem).toHaveBeenCalledWith('selectedBoardId');
    expect(storage.removeItem).toHaveBeenCalledWith('activeTypingTabId');
    expect(storage.setItem).toHaveBeenCalledWith('typingDockMode', 'minimized');
  });
});
