import { useState, useEffect, useCallback } from 'react';
import { TextToSpeech } from '../tts';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const tts = TextToSpeech.getInstance();

  useEffect(() => {
    setIsAvailable(tts.isAvailable());
    
    // Set up callbacks
    tts.setCallbacks({
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: (error) => {
        console.error('TTS Error:', error);
        setIsSpeaking(false);
      },
      onVoicesChanged: (newVoices) => {
        setVoices(newVoices);
      }
    });

    // Get initial voices
    setVoices(tts.getVoices());
  }, []);

  const speak = useCallback((text: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voiceURI?: string;
  }) => {
    if (!isAvailable) {
      console.warn('TTS is not available in this browser');
      return;
    }
    tts.speak(text, options);
  }, [isAvailable]);

  const stop = useCallback(() => {
    tts.stop();
  }, []);

  const pause = useCallback(() => {
    tts.pause();
  }, []);

  const resume = useCallback(() => {
    tts.resume();
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isAvailable,
    voices
  };
} 