import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { PhraseBarProvider, usePhraseBar } from '@/app/contexts/PhraseBarContext';

const STORAGE_KEY = 'phraseBarItems';

function wrapper({ children }: { children: ReactNode }) {
  return <PhraseBarProvider>{children}</PhraseBarProvider>;
}

describe('PhraseBarContext', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('starts empty when sessionStorage is empty', () => {
    const { result } = renderHook(() => usePhraseBar(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.joinedText).toBe('');
  });

  it('addItem appends a chip with a generated id', () => {
    const { result } = renderHook(() => usePhraseBar(), { wrapper });

    act(() => {
      result.current.addItem({ text: 'Hello' });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual(
      expect.objectContaining({ text: 'Hello' })
    );
    expect(typeof result.current.items[0].id).toBe('string');
    expect(result.current.items[0].id.length).toBeGreaterThan(0);
  });

  it('preserves symbolUrl on added chips', () => {
    const { result } = renderHook(() => usePhraseBar(), { wrapper });

    act(() => {
      result.current.addItem({ text: 'Water', symbolUrl: 'https://example.com/water.png' });
    });

    expect(result.current.items[0].symbolUrl).toBe('https://example.com/water.png');
  });

  it('joinedText concatenates all chip texts with spaces', () => {
    const { result } = renderHook(() => usePhraseBar(), { wrapper });

    act(() => {
      result.current.addItem({ text: 'I' });
      result.current.addItem({ text: 'need' });
      result.current.addItem({ text: 'water' });
    });

    expect(result.current.joinedText).toBe('I need water');
  });

  it('removeLast pops the newest chip', () => {
    const { result } = renderHook(() => usePhraseBar(), { wrapper });

    act(() => {
      result.current.addItem({ text: 'one' });
      result.current.addItem({ text: 'two' });
      result.current.addItem({ text: 'three' });
    });

    act(() => {
      result.current.removeLast();
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items.map((i) => i.text)).toEqual(['one', 'two']);
  });

  it('removeLast on an empty bar is a no-op', () => {
    const { result } = renderHook(() => usePhraseBar(), { wrapper });

    act(() => {
      result.current.removeLast();
    });

    expect(result.current.items).toEqual([]);
  });

  it('clear empties the bar', () => {
    const { result } = renderHook(() => usePhraseBar(), { wrapper });

    act(() => {
      result.current.addItem({ text: 'one' });
      result.current.addItem({ text: 'two' });
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.joinedText).toBe('');
  });

  it('persists items to sessionStorage after mutations', () => {
    const { result } = renderHook(() => usePhraseBar(), { wrapper });

    act(() => {
      result.current.addItem({ text: 'Hello' });
    });

    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual(
      expect.objectContaining({ text: 'Hello' })
    );
  });

  it('rehydrates from sessionStorage on mount', () => {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 'a', text: 'pre', symbolUrl: 'https://example.com/pre.png' },
        { id: 'b', text: 'existing' },
      ])
    );

    const { result } = renderHook(() => usePhraseBar(), { wrapper });

    expect(result.current.items).toEqual([
      { id: 'a', text: 'pre', symbolUrl: 'https://example.com/pre.png' },
      { id: 'b', text: 'existing' },
    ]);
    expect(result.current.joinedText).toBe('pre existing');
  });

  it('tolerates malformed sessionStorage payloads', () => {
    window.sessionStorage.setItem(STORAGE_KEY, 'not valid json{');

    const { result } = renderHook(() => usePhraseBar(), { wrapper });

    expect(result.current.items).toEqual([]);
  });

  it('throws if usePhraseBar is called outside the provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      expect(() => renderHook(() => usePhraseBar())).toThrow(
        /usePhraseBar must be used within a PhraseBarProvider/
      );
    } finally {
      spy.mockRestore();
    }
  });
});
