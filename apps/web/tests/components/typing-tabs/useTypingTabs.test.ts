import { renderHook, act, waitFor } from '@testing-library/react';
import { useTypingTabs } from '@/app/components/typing-tabs/useTypingTabs';

// Mock nanoid to avoid ESM issues
jest.mock('nanoid', () => {
  let idCounter = 0;
  return {
    nanoid: jest.fn(() => `test-id-${++idCounter}`),
  };
});

// Mock Convex
const mockUpdateSettingsMutation = jest.fn();
jest.mock('convex/react', () => ({
  useMutation: jest.fn(() => mockUpdateSettingsMutation),
}));

// Mock SettingsContext
const mockUpdateUIPreference = jest.fn();
jest.mock('@/app/contexts/SettingsContext', () => ({
  useSettings: jest.fn(() => ({
    uiPreferences: {
      activeTypingTabId: null,
    },
    updateUIPreference: mockUpdateUIPreference,
  })),
}));

// Mock AuthContext
jest.mock('@/app/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
  })),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock alert
global.alert = jest.fn();

describe('useTypingTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('initialization', () => {
    it('creates a default tab when no stored tabs exist', () => {
      const { result } = renderHook(() => useTypingTabs());

      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.tabs[0].text).toBe('');
      expect(result.current.tabs[0].label).toBe('Message 1');
      expect(result.current.activeTab).toBeDefined();
    });

    it('creates a default tab with initial text', () => {
      const { result } = renderHook(() => useTypingTabs('Hello world'));

      // Auto-creation effect creates a second empty tab when first tab has text
      expect(result.current.tabs).toHaveLength(2);
      expect(result.current.tabs[0].text).toBe('Hello world');
      expect(result.current.tabs[0].label).toBe('Hello world');
      // Second tab is auto-created and is now active
      expect(result.current.tabs[1].text).toBe('');
      expect(result.current.activeTabId).toBe(result.current.tabs[1].id);
    });

    it('loads tabs from localStorage if available', () => {
      const storedState = {
        tabs: [
          {
            id: 'stored-tab-1',
            label: 'Stored Tab',
            text: 'Restored draft',
            createdAt: Date.now(),
            lastModified: Date.now(),
            isCustomLabel: false,
          },
        ],
        activeTabId: 'stored-tab-1',
        nextTabNumber: 2,
      };
      localStorageMock.setItem('typingTabs', JSON.stringify(storedState));

      const { result } = renderHook(() => useTypingTabs());

      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.tabs[0].id).toBe('stored-tab-1');
      expect(result.current.tabs[0].text).toBe('Restored draft');
      expect(result.current.tabs[0].label).toBe('Stored Tab');
      expect(result.current.activeTabId).toBe('stored-tab-1');
    });

    it('does not auto-create a new tab when restoring non-empty stored content', () => {
      const storedState = {
        tabs: [
          {
            id: 'stored-tab-1',
            label: 'Stored Tab',
            text: 'Restored draft',
            createdAt: Date.now(),
            lastModified: Date.now(),
            isCustomLabel: false,
          },
        ],
        activeTabId: 'stored-tab-1',
        nextTabNumber: 2,
      };
      localStorageMock.setItem('typingTabs', JSON.stringify(storedState));

      const { result } = renderHook(() => useTypingTabs());

      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.activeTabId).toBe('stored-tab-1');
      expect(result.current.activeTab.text).toBe('Restored draft');
    });

    it('migrates tabs without isCustomLabel field', () => {
      const storedState = {
        tabs: [
          {
            id: 'old-tab-1',
            label: 'Old Tab',
            text: 'Old content',
            createdAt: Date.now(),
            lastModified: Date.now(),
          },
        ],
        activeTabId: 'old-tab-1',
        nextTabNumber: 2,
      };
      localStorageMock.setItem('typingTabs', JSON.stringify(storedState));

      const { result } = renderHook(() => useTypingTabs());

      expect(result.current.tabs[0].isCustomLabel).toBe(false);
    });

    it('handles corrupted localStorage data', () => {
      localStorageMock.setItem('typingTabs', 'invalid json');

      const { result } = renderHook(() => useTypingTabs());

      // Should fall back to creating a default tab
      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.tabs[0].label).toBe('Message 1');
    });
  });

  describe('createTab', () => {
    it('creates a new tab', () => {
      const { result } = renderHook(() => useTypingTabs());

      act(() => {
        result.current.createTab();
      });

      expect(result.current.tabs).toHaveLength(2);
      expect(result.current.tabs[1].label).toBe('Message 2');
    });

    it('switches to the new tab after creation', () => {
      const { result } = renderHook(() => useTypingTabs());
      const firstTabId = result.current.activeTabId;

      act(() => {
        result.current.createTab();
      });

      expect(result.current.activeTabId).not.toBe(firstTabId);
      expect(result.current.activeTabId).toBe(result.current.tabs[1].id);
    });

    it('allows creating many tabs without limit', () => {
      const { result } = renderHook(() => useTypingTabs());

      // Create 15 additional tabs (we already have 1)
      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.createTab();
        }
      });

      expect(result.current.tabs).toHaveLength(16);
      expect(global.alert).not.toHaveBeenCalled();
    });
  });

  describe('switchTab', () => {
    it('switches to a different tab', () => {
      const { result } = renderHook(() => useTypingTabs());

      act(() => {
        result.current.createTab();
      });

      const firstTabId = result.current.tabs[0].id;
      const secondTabId = result.current.tabs[1].id;

      expect(result.current.activeTabId).toBe(secondTabId);

      act(() => {
        result.current.switchTab(firstTabId);
      });

      expect(result.current.activeTabId).toBe(firstTabId);
    });
  });

  describe('closeTab', () => {
    it('closes a tab', () => {
      const { result } = renderHook(() => useTypingTabs());

      act(() => {
        result.current.createTab();
      });

      expect(result.current.tabs).toHaveLength(2);

      const tabToClose = result.current.tabs[0].id;

      act(() => {
        result.current.closeTab(tabToClose);
      });

      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.tabs.find(t => t.id === tabToClose)).toBeUndefined();
    });

    it('switches to adjacent tab when closing active tab', () => {
      const { result } = renderHook(() => useTypingTabs());

      act(() => {
        result.current.createTab();
        result.current.createTab();
      });

      const secondTabId = result.current.tabs[1].id;

      // Switch to first tab
      act(() => {
        result.current.switchTab(result.current.tabs[0].id);
      });

      // Close first tab
      act(() => {
        result.current.closeTab(result.current.tabs[0].id);
      });

      // Should switch to what was the second tab
      expect(result.current.activeTabId).toBe(secondTabId);
    });

    it('clears text instead of closing when it is the last tab', () => {
      const { result } = renderHook(() => useTypingTabs());

      act(() => {
        result.current.updateActiveTabText('Some text');
      });

      expect(result.current.activeTab.text).toBe('Some text');

      act(() => {
        result.current.closeTab(result.current.activeTabId);
      });

      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.activeTab.text).toBe('');
      expect(result.current.activeTab.label).toBe('Message 1');
      expect(result.current.activeTab.isCustomLabel).toBe(false);
    });
  });

  describe('renameTab', () => {
    it('renames a tab', () => {
      const { result } = renderHook(() => useTypingTabs());

      const tabId = result.current.tabs[0].id;

      act(() => {
        result.current.renameTab(tabId, 'New Name');
      });

      expect(result.current.tabs[0].label).toBe('New Name');
      expect(result.current.tabs[0].isCustomLabel).toBe(true);
    });

    it('validates the new label', () => {
      const { result } = renderHook(() => useTypingTabs());

      const tabId = result.current.tabs[0].id;

      act(() => {
        result.current.renameTab(tabId, '   ');
      });

      // Empty/whitespace labels should be replaced with 'Message'
      expect(result.current.tabs[0].label).toBe('Message');
    });

    it('truncates long labels', () => {
      const { result } = renderHook(() => useTypingTabs());

      const tabId = result.current.tabs[0].id;
      const longLabel = 'a'.repeat(100);

      act(() => {
        result.current.renameTab(tabId, longLabel);
      });

      expect(result.current.tabs[0].label.length).toBeLessThanOrEqual(20);
    });
  });

  describe('updateActiveTabText', () => {
    it('updates the text of the active tab', () => {
      const { result } = renderHook(() => useTypingTabs());

      act(() => {
        result.current.updateActiveTabText('New text');
      });

      expect(result.current.activeTab.text).toBe('New text');
    });

    it('auto-updates label from text when not custom', () => {
      const { result } = renderHook(() => useTypingTabs());

      act(() => {
        result.current.updateActiveTabText('Hello world');
      });

      expect(result.current.activeTab.label).toBe('Hello world');
    });

    it('does not update label when it is custom', () => {
      const { result } = renderHook(() => useTypingTabs());

      const tabId = result.current.activeTabId;

      act(() => {
        result.current.renameTab(tabId, 'Custom Name');
      });

      act(() => {
        result.current.updateActiveTabText('Different text');
      });

      expect(result.current.activeTab.label).toBe('Custom Name');
      expect(result.current.activeTab.text).toBe('Different text');
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      // Create multiple tabs for navigation tests
    });

    it('switches to tab by index', () => {
      const { result } = renderHook(() => useTypingTabs());

      act(() => {
        result.current.createTab();
        result.current.createTab();
      });

      const secondTabId = result.current.tabs[1].id;

      act(() => {
        result.current.switchToTabByIndex(1);
      });

      expect(result.current.activeTabId).toBe(secondTabId);
    });

    it('ignores invalid index in switchToTabByIndex', () => {
      const { result } = renderHook(() => useTypingTabs());
      const initialActiveId = result.current.activeTabId;

      act(() => {
        result.current.switchToTabByIndex(999);
      });

      expect(result.current.activeTabId).toBe(initialActiveId);
    });

    it('switches to previous tab', () => {
      const { result } = renderHook(() => useTypingTabs());

      act(() => {
        result.current.createTab();
        result.current.createTab();
      });

      const firstTabId = result.current.tabs[0].id;

      // Currently on last tab (index 2)
      act(() => {
        result.current.switchToPreviousTab();
      });

      // Should now be on tab at index 1
      expect(result.current.activeTabId).toBe(result.current.tabs[1].id);

      act(() => {
        result.current.switchToPreviousTab();
      });

      // Should now be on first tab
      expect(result.current.activeTabId).toBe(firstTabId);
    });

    it('does not switch before first tab', () => {
      const { result } = renderHook(() => useTypingTabs());

      act(() => {
        result.current.createTab();
      });

      const firstTabId = result.current.tabs[0].id;

      act(() => {
        result.current.switchTab(firstTabId);
      });

      act(() => {
        result.current.switchToPreviousTab();
      });

      expect(result.current.activeTabId).toBe(firstTabId);
    });

    it('switches to next tab', () => {
      const { result } = renderHook(() => useTypingTabs());

      act(() => {
        result.current.createTab();
        result.current.createTab();
      });

      const firstTabId = result.current.tabs[0].id;

      act(() => {
        result.current.switchTab(firstTabId);
      });

      act(() => {
        result.current.switchToNextTab();
      });

      expect(result.current.activeTabId).toBe(result.current.tabs[1].id);
    });

    it('does not switch after last tab', () => {
      const { result } = renderHook(() => useTypingTabs());

      act(() => {
        result.current.createTab();
      });

      const lastTabId = result.current.tabs[1].id;

      act(() => {
        result.current.switchTab(lastTabId);
      });

      act(() => {
        result.current.switchToNextTab();
      });

      expect(result.current.activeTabId).toBe(lastTabId);
    });
  });

  describe('persistence', () => {
    it('persists tabs to localStorage', async () => {
      const { result } = renderHook(() => useTypingTabs());

      act(() => {
        result.current.updateActiveTabText('Test content');
      });

      // Wait for debounced persistence (300ms + buffer)
      await waitFor(
        () => {
          const stored = localStorageMock.getItem('typingTabs');
          expect(stored).toBeTruthy();

          const parsed = JSON.parse(stored!);
          expect(parsed.tabs[0].text).toBe('Test content');
        },
        { timeout: 500 }
      );
    });
  });
});
