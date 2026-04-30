import { act, renderHook } from '@testing-library/react';
import { useLocalMessageHistory } from '@/lib/hooks/useLocalMessageHistory';

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

describe('useLocalMessageHistory', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('records recent messages to localStorage', () => {
    const { result } = renderHook(() => useLocalMessageHistory());

    act(() => {
      result.current.recordMessage({
        text: 'Need water',
        source: 'speak',
      });
    });

    expect(result.current.messages[0].text).toBe('Need water');

    const stored = localStorageMock.getItem('localTypingHistory');
    expect(stored).toContain('Need water');
  });

  it('moves duplicate messages to the front instead of duplicating them', () => {
    const { result } = renderHook(() => useLocalMessageHistory());

    act(() => {
      result.current.recordMessage({
        text: 'Need water',
        source: 'speak',
      });
      result.current.recordMessage({
        text: 'Need help',
        source: 'speak',
      });
      result.current.recordMessage({
        text: 'Need water',
        source: 'clear',
      });
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].text).toBe('Need water');
  });
});
