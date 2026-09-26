import React, { useRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useTextareaScroll } from '@/app/components/composer/useTextareaScroll';

function Editor() {
  const [text, setText] = useState('');
  const [composing, setComposing] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const scroll = useTextareaScroll(ref, text, composing);
  return <textarea ref={ref} value={text} onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} onSelect={() => scroll.captureSnapshot()}
    onChange={e => { scroll.captureScrollIntent(e.target.value); setText(e.target.value); }} />;
}
test('500 native edits do not synchronously measure layout or rewrite the caret', () => {
  const frames = new Map<number, FrameRequestCallback>(); let serial = 0;
  const raf = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => { frames.set(++serial, cb); return serial; });
  const cancel = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => { frames.delete(id); });
  const view = render(<Editor />);
  const area = screen.getByRole('textbox') as HTMLTextAreaElement;
  const measure = jest.fn(() => 1000);
  Object.defineProperty(area, 'scrollHeight', { configurable: true, get: measure });
  Object.defineProperty(area, 'clientHeight', { configurable: true, value: 200 });
  const caret = jest.spyOn(area, 'setSelectionRange'); area.focus();
  for (let i = 1; i <= 500; i++) fireEvent.change(area, { target: { value: 'x'.repeat(i) } });
  expect(area.value).toHaveLength(500);
  expect(measure).not.toHaveBeenCalled(); expect(caret).not.toHaveBeenCalled();
  expect(frames.size).toBeLessThanOrEqual(1);
  act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(cb => cb(0)); });
  expect(measure.mock.calls.length).toBeLessThanOrEqual(1);
  view.unmount(); raf.mockRestore(); cancel.mockRestore();
});


test('composition never rewrites the IME selection or scrolls the textarea', () => {
  jest.useFakeTimers();
  const view = render(<Editor />);
  const area = screen.getByRole('textbox') as HTMLTextAreaElement;
  area.focus();
  const caret = jest.spyOn(area, 'setSelectionRange');
  const measure = jest.fn(() => 1000);
  Object.defineProperty(area, 'scrollHeight', { configurable: true, get: measure });
  fireEvent.compositionStart(area);
  fireEvent.change(area, { target: { value: 'composing' } });
  act(() => jest.advanceTimersByTime(50));
  expect(measure).not.toHaveBeenCalled(); expect(caret).not.toHaveBeenCalled();
  fireEvent.compositionEnd(area);
  expect(area.value).toBe('composing');
  view.unmount(); jest.useRealTimers();
});

test('unmount cancels pending scroll work', () => {
  jest.useFakeTimers();
  const view = render(<Editor />);
  const area = screen.getByRole('textbox') as HTMLTextAreaElement;
  const measure = jest.fn(() => 1000);
  Object.defineProperty(area, 'scrollHeight', { configurable: true, get: measure });
  area.focus(); fireEvent.change(area, { target: { value: 'Draft' } });
  view.unmount(); act(() => jest.runOnlyPendingTimers());
  expect(measure).not.toHaveBeenCalled(); jest.useRealTimers();
});
