'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TTSProvider } from '@/lib/tts-provider';

export function useOfflineTTS() {
  const ttsRef = useRef<TTSProvider | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!ttsRef.current) {
      ttsRef.current = TTSProvider.getInstance();
      ttsRef.current.setProvider('browser');
    }

    setIsAvailable(ttsRef.current.getStatus().browserTTSAvailable);

    const unsubscribe = ttsRef.current.addCallbacks({
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });

    return unsubscribe;
  }, []);

  const speak = useCallback((text: string) => {
    if (!ttsRef.current || !text.trim()) {
      return;
    }

    ttsRef.current.setProvider('browser');
    ttsRef.current.speak(text, {});
  }, []);

  const stop = useCallback(() => {
    ttsRef.current?.stop();
  }, []);

  return {
    isAvailable,
    isSpeaking,
    speak,
    stop,
  };
}
