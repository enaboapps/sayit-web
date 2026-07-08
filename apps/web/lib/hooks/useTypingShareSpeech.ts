'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TTSProvider } from '@/lib/tts-provider';
import type { LiveTypingSpeechCommand, LiveTypingSpeechSettings } from '@/lib/live-typing-speech';

interface TypingShareSpeechSession {
  speechCommand?: LiveTypingSpeechCommand;
}

async function prepareProvider(tts: TTSProvider, settings: LiveTypingSpeechSettings) {
  tts.setProvider(settings.provider);

  if (settings.provider === 'browser') {
    tts.refreshVoices();
    return;
  }

  if (settings.provider === 'elevenlabs') {
    await tts.loadElevenLabsVoices();
    return;
  }

  if (settings.provider === 'azure') {
    await tts.loadAzureVoices();
    return;
  }

  await tts.loadGeminiVoices();
}

export function useTypingShareSpeech(session: TypingShareSpeechSession | null | undefined) {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ttsRef = useRef<TTSProvider | null>(null);
  const lastHandledCommandIdRef = useRef<string | null>(null);

  useEffect(() => {
    const tts = TTSProvider.getInstance();
    ttsRef.current = tts;

    const unsubscribe = tts.addCallbacks({
      onStart: () => {
        setIsSpeaking(true);
        setError(null);
      },
      onEnd: () => setIsSpeaking(false),
      onError: (speechError) => {
        setIsSpeaking(false);

        if (/interrupted|canceled/i.test(speechError.message)) {
          return;
        }

        setError('Could not play speech on this device.');
      },
    });

    return unsubscribe;
  }, []);

  const enableAudio = useCallback(() => {
    lastHandledCommandIdRef.current = session?.speechCommand?.id ?? null;
    setAudioEnabled(true);
    setError(null);
  }, [session?.speechCommand?.id]);

  useEffect(() => {
    const command = session?.speechCommand;
    const tts = ttsRef.current;

    if (!command || !tts || !audioEnabled) {
      return;
    }

    if (lastHandledCommandIdRef.current === command.id) {
      return;
    }

    lastHandledCommandIdRef.current = command.id;

    if (command.action === 'stop') {
      tts.stop();
      return;
    }

    if (!command.text?.trim() || !command.settings) {
      setError('Speech command is missing text or voice settings.');
      return;
    }

    let cancelled = false;

    const speak = async () => {
      try {
        await prepareProvider(tts, command.settings!);
        if (cancelled) return;

        tts.speak(command.text!, {
          voiceId: command.settings!.voiceId,
          rate: command.settings!.rate,
          pitch: command.settings!.pitch,
          volume: command.settings!.volume,
          stability: command.settings!.stability,
          similarityBoost: command.settings!.similarityBoost,
          modelId: command.settings!.modelId,
        });
        setError(null);
      } catch (err) {
        console.error('Error playing live typing speech:', err);
        if (!cancelled) {
          setError('Could not play speech on this device.');
        }
      }
    };

    void speak();

    return () => {
      cancelled = true;
    };
  }, [audioEnabled, session?.speechCommand]);

  return {
    audioEnabled,
    enableAudio,
    isSpeaking,
    error,
  };
}
