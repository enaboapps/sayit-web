'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { TTSProvider, TTSVoice, TTSProviderType } from '../tts-provider';

export function useTTS() {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [provider, setProvider] = useState<TTSProviderType>('browser');
  const [status, setStatus] = useState<{
    isSpeaking: boolean;
    activeProvider: TTSProviderType;
    elevenLabsAvailable: boolean;
    browserTTSAvailable: boolean;
  }>({
    isSpeaking: false,
    activeProvider: 'browser',
    elevenLabsAvailable: false,
    browserTTSAvailable: false
  });
  
  // Use ref to avoid dependency issues in callbacks
  const ttsRef = useRef<TTSProvider | null>(null);

  useEffect(() => {
    // Initialize only once
    if (!ttsRef.current) {
      ttsRef.current = TTSProvider.getInstance();
      
      const tts = ttsRef.current;
      
      // Set initial state
      setIsAvailable(tts.isAvailable());
      setProvider(tts.getCurrentProvider());
      setStatus(tts.getStatus());
      setVoices(tts.getAllVoices());
  
      // Set callbacks for updates
      tts.setCallbacks({
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: (error) => {
          console.error('TTS Error:', error);
          setIsSpeaking(false);
        },
        onVoicesChanged: (newVoices) => {
          setVoices(newVoices);
          setStatus(tts.getStatus());
        }
      });
    }
  }, []);

  const speak = useCallback((text: string, options?: {
    voiceId?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    stability?: number;
    similarityBoost?: number;
  }) => {
    if (!ttsRef.current || !isAvailable) {
      console.warn('TTS is not available');
      return;
    }

    ttsRef.current.speak(text, options);
  }, [isAvailable]);

  const stop = useCallback(() => {
    if (!ttsRef.current) return;
    ttsRef.current.stop();
  }, []);

  const pause = useCallback(() => {
    if (!ttsRef.current) return;
    ttsRef.current.pause();
  }, []);

  const resume = useCallback(() => {
    if (!ttsRef.current) return;
    ttsRef.current.resume();
  }, []);

  const switchProvider = useCallback((newProvider: TTSProviderType) => {
    if (!ttsRef.current) return;
    
    ttsRef.current.setProvider(newProvider);
    setProvider(newProvider);
    setStatus(ttsRef.current.getStatus());
  }, []);

  const getVoicesByProvider = useCallback((providerType: TTSProviderType) => {
    if (!ttsRef.current) return [];
    return ttsRef.current.getVoicesByProvider(providerType);
  }, []);

  return {
    isAvailable,
    isSpeaking,
    voices,
    speak,
    stop,
    pause,
    resume,
    provider,
    switchProvider,
    getVoicesByProvider,
    status
  };
}
