'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSettings } from '@/app/contexts/SettingsContext';
import { useLocalMessageHistory } from './useLocalMessageHistory';

export function useMessageCapture() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { messages: localRecentMessages, recordMessage: recordLocalMessage } = useLocalMessageHistory();
  const recordMessage = useMutation(api.conversationHistory.recordMessage);
  const [captureError, setCaptureError] = useState(false);
  const captureErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!captureError) return;
    if (captureErrorTimerRef.current) clearTimeout(captureErrorTimerRef.current);
    captureErrorTimerRef.current = setTimeout(() => setCaptureError(false), 4000);
    return () => {
      if (captureErrorTimerRef.current) clearTimeout(captureErrorTimerRef.current);
    };
  }, [captureError]);

  const handleCaptureCompletedMessage = async ({
    text,
    source,
    tabId,
  }: {
    text: string;
    source: 'speak' | 'speakAndClear' | 'clear';
    tabId?: string | null;
  }) => {
    const trimmedText = text.trim();
    if (!user || !trimmedText) return;

    const captureMode = settings.messageCaptureMode;
    const shouldCapture =
      (captureMode === 'clearOnly' && source === 'clear')
      || (captureMode === 'speakOnly' && source === 'speak')
      || (captureMode === 'speakAndClearOnly' && source === 'speakAndClear')
      || (captureMode === 'speakAny' && (source === 'speak' || source === 'speakAndClear'));

    if (!shouldCapture) return;

    recordLocalMessage({ text: trimmedText, source, tabId });

    try {
      await recordMessage({ text: trimmedText, captureSource: source, tabId: tabId ?? undefined });
      setCaptureError(false);
    } catch (error) {
      console.error('Failed to record conversation history:', error);
      setCaptureError(true);
    }
  };

  return {
    captureError,
    handleCaptureCompletedMessage,
    localRecentMessages,
  };
}
