import { useCallback, useEffect, useRef } from 'react';

export function useTextareaScroll(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  currentText: string,
  composing = false,
) {
  const previousText = useRef(currentText);
  const nativeEdit = useRef(false);
  const followEnd = useRef(false);
  const explicitEnd = useRef(false);
  const frame = useRef<number | null>(null);

  // Input/selection handlers must not measure layout or reset the native IME caret.
  const captureSnapshot = useCallback(() => {
    const area = textareaRef.current;
    if (area) followEnd.current = area.selectionStart === area.value.length
      && area.selectionEnd === area.value.length;
  }, [textareaRef]);

  const captureScrollIntent = useCallback((nextValue: string) => {
    nativeEdit.current = true;
    const area = textareaRef.current;
    followEnd.current = !!area && document.activeElement === area
      && area.selectionStart === nextValue.length && area.selectionEnd === nextValue.length;
  }, [textareaRef]);

  useEffect(() => {
    const changed = currentText !== previousText.current;
    const externalAppend = !nativeEdit.current && changed
      && currentText.startsWith(previousText.current) && followEnd.current;
    const moveCaret = explicitEnd.current || externalAppend;
    const shouldScroll = moveCaret || (nativeEdit.current && followEnd.current);
    previousText.current = currentText;
    nativeEdit.current = false;
    explicitEnd.current = false;
    if (composing || !shouldScroll) return;

    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const area = textareaRef.current;
      if (!area) return;
      // A selection made since scheduling wins over automatic scrolling.
      if (!moveCaret && (area.selectionStart !== area.value.length || area.selectionEnd !== area.value.length)) return;
      if (moveCaret && (area.selectionStart !== area.value.length || area.selectionEnd !== area.value.length)) {
        area.setSelectionRange(area.value.length, area.value.length);
      }
      const bottom = Math.max(0, area.scrollHeight - area.clientHeight);
      if (area.scrollTop !== bottom) area.scrollTop = bottom;
      captureSnapshot();
    });
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [captureSnapshot, composing, currentText, textareaRef]);

  const scrollToEnd = useCallback(() => { explicitEnd.current = true; }, []);
  return { captureSnapshot, captureScrollIntent, scrollToEnd };
}
