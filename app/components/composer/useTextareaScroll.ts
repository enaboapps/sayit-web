import { useCallback, useLayoutEffect, useRef } from 'react';
import type { TextareaScrollIntent, TextareaScrollSnapshot } from './types';

export function useTextareaScroll(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  currentText: string,
) {
  const pendingRef = useRef<TextareaScrollIntent | null>(null);
  const previousTextRef = useRef('');
  const snapshotRef = useRef<TextareaScrollSnapshot | null>(null);

  const captureSnapshot = useCallback((value?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const currentValue = value ?? textarea.value;
    const selectionStart = textarea.selectionStart ?? currentValue.length;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    const distanceFromBottom = textarea.scrollHeight - textarea.scrollTop - textarea.clientHeight;
    const wasNearBottom = distanceFromBottom <= 24;

    snapshotRef.current = {
      selectionStart,
      selectionEnd,
      wasAtEnd: selectionStart >= currentValue.length,
      wasNearBottom,
    };
  }, [textareaRef]);

  const captureScrollIntent = useCallback((nextValue: string) => {
    const textarea = textareaRef.current;
    if (!textarea || document.activeElement !== textarea) {
      pendingRef.current = null;
      return;
    }

    const selectionStart = textarea.selectionStart ?? nextValue.length;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    const distanceFromBottom = textarea.scrollHeight - textarea.scrollTop - textarea.clientHeight;
    const isNearBottom = distanceFromBottom <= 24;
    const isCaretAtEnd = selectionStart >= nextValue.length;
    const previousSnapshot = snapshotRef.current;
    const wasEditingEarlier = !!previousSnapshot
      && !previousSnapshot.wasAtEnd
      && !previousSnapshot.wasNearBottom;
    const shouldScrollToEnd = !wasEditingEarlier
      && (isCaretAtEnd || isNearBottom || !!previousSnapshot?.wasAtEnd || !!previousSnapshot?.wasNearBottom);

    pendingRef.current = {
      selectionStart,
      selectionEnd,
      shouldScrollToEnd,
    };
    snapshotRef.current = {
      selectionStart,
      selectionEnd,
      wasAtEnd: isCaretAtEnd,
      wasNearBottom: isNearBottom,
    };
  }, [textareaRef]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      previousTextRef.current = currentText;
      pendingRef.current = null;
      return;
    }

    const pending = pendingRef.current;
    const previousText = previousTextRef.current;
    const snapshot = snapshotRef.current;
    const wasExternalAppend = currentText.length > previousText.length
      && !!snapshot
      && (snapshot.wasAtEnd || snapshot.wasNearBottom);

    if (pending && document.activeElement === textarea) {
      const selectionStart = Math.min(pending.selectionStart, currentText.length);
      const selectionEnd = Math.min(pending.selectionEnd, currentText.length);
      textarea.setSelectionRange(selectionStart, selectionEnd);

      if (pending.shouldScrollToEnd) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    } else if (wasExternalAppend) {
      textarea.setSelectionRange(currentText.length, currentText.length);
      textarea.scrollTop = textarea.scrollHeight;
    }

    previousTextRef.current = currentText;
    pendingRef.current = null;
    captureSnapshot(currentText);
  }, [captureSnapshot, currentText, textareaRef]);

  const scrollToEnd = useCallback(() => {
    pendingRef.current = {
      selectionStart: Number.MAX_SAFE_INTEGER,
      selectionEnd: Number.MAX_SAFE_INTEGER,
      shouldScrollToEnd: true,
    };
  }, []);

  return {
    captureSnapshot,
    captureScrollIntent,
    scrollToEnd,
  };
}
