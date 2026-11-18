'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { emptyCloudTTSStatus, TTSProvider, TTSVoice, TTSProviderType, TTSStatus } from '../tts-provider';
import { CLOUD_TTS_PROVIDERS, isCloudProvider, type CloudTTSProviderType } from '../tts-types';
import { useSubscription } from '@/app/hooks/useSubscription';
import { useSettings } from '@/app/contexts/SettingsContext';

function sameStatus(a: TTSStatus, b: TTSStatus) {
  return a.isSpeaking === b.isSpeaking
    && a.activeProvider === b.activeProvider
    && a.browserTTSAvailable === b.browserTTSAvailable
    && CLOUD_TTS_PROVIDERS.every((provider) => (
      a.cloud[provider].available === b.cloud[provider].available
      && a.cloud[provider].voicesLoaded === b.cloud[provider].voicesLoaded
    ));
}

export function useTTS() {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [provider, setProvider] = useState<TTSProviderType>('browser');
  const [wordBoundary, setWordBoundary] = useState<{ word: string; charIndex: number } | null>(null);
  const [status, setStatus] = useState<TTSStatus>({
    isSpeaking: false,
    activeProvider: 'browser',
    browserTTSAvailable: false,
    cloud: emptyCloudTTSStatus(),
  });
  
  // Keeps the previous object when nothing changed, so status.cloud is stable.
  const updateStatus = useCallback((next: TTSStatus) => {
    setStatus((previous) => (sameStatus(previous, next) ? previous : next));
  }, []);

  // Use ref to avoid dependency issues in callbacks
  const ttsRef = useRef<TTSProvider | null>(null);
  
  // Get subscription status
  const { isActive: hasSubscription } = useSubscription();
  
  // Get settings
  const { settings } = useSettings();
  
  // Store settings in a ref to avoid dependency issues
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!ttsRef.current) {
      return;
    }

    ttsRef.current.setProvider(settings.ttsProvider);
    setProvider(ttsRef.current.getCurrentProvider());
    updateStatus(ttsRef.current.getStatus());
  }, [settings.ttsProvider, updateStatus]);

  useEffect(() => {
    if (!ttsRef.current) {
      ttsRef.current = TTSProvider.getInstance();

      const tts = ttsRef.current;
      tts.setProvider(settingsRef.current.ttsProvider);

      setIsAvailable(tts.isAvailable());
      setProvider(tts.getCurrentProvider());
      updateStatus(tts.getStatus());
      setVoices(tts.getAllVoices());
    }

    const tts = ttsRef.current;
    const unsubscribe = tts.addCallbacks({
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: (error) => {
        console.error('TTS Error:', error);
        setIsSpeaking(false);
      },
      onVoicesChanged: (newVoices) => {
        setVoices(newVoices);
        updateStatus(tts.getStatus());
      },
      onWordBoundary: (word, charIndex) => {
        setWordBoundary({ word, charIndex });
      },
    });

    return unsubscribe;
  }, [updateStatus]);

  const speak = useCallback((text: string, customOptions?: {
    voiceId?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    stability?: number;
    similarityBoost?: number;
    modelId?: string;
  }) => {
    if (!ttsRef.current || !isAvailable) {
      console.warn('TTS is not available');
      return;
    }

    // Merge settings with custom options, with custom options taking precedence
    const currentSettings = settingsRef.current;
    const modelId = currentSettings.ttsModelPreference === 'high_quality'
      ? 'eleven_v3'
      : 'eleven_flash_v2_5';

    const options = {
      voiceId: customOptions?.voiceId || currentSettings.ttsVoiceId,
      rate: customOptions?.rate || currentSettings.speechRate,
      pitch: customOptions?.pitch || currentSettings.speechPitch,
      volume: customOptions?.volume || currentSettings.speechVolume,
      stability: customOptions?.stability || currentSettings.ttsStability,
      similarityBoost: customOptions?.similarityBoost || currentSettings.ttsSimilarityBoost,
      modelId: customOptions?.modelId || modelId,
    };

    // Check if current provider is a premium provider or the voice is a premium voice
    const voice = options.voiceId
      ? voices.find(v => v.id === options.voiceId)
      : null;

    const usingPremium = isCloudProvider(voice?.provider) || isCloudProvider(ttsRef.current.getCurrentProvider());

    // If trying to use a premium provider without a subscription, force browser TTS
    if (usingPremium && !hasSubscription) {
      console.log('Forcing browser TTS for non-subscribers');

      // Find a browser voice to use instead
      const browserVoices = voices.filter(v => v.provider === 'browser');
      const fallbackVoice = browserVoices.length > 0 ? browserVoices[0].id : undefined;

      // Temporarily switch to browser provider if needed
      const originalProvider = ttsRef.current.getCurrentProvider();
      if (isCloudProvider(originalProvider)) {
        ttsRef.current.setProvider('browser');
      }
      
      // Use browser TTS with fallback voice and ignore ElevenLabs specific settings
      ttsRef.current.speak(text, {
        voiceId: fallbackVoice,
        rate: options.rate,
        pitch: options.pitch,
        volume: options.volume
      });
      
      // Update local state to reflect the temporary provider change
      if (isCloudProvider(originalProvider)) {
        setStatus({
          ...status,
          activeProvider: 'browser'
        });
      }
      
      return;
    }

    // Normal operation (either browser TTS or a premium provider for subscribers)
    ttsRef.current.speak(text, options);
  }, [isAvailable, voices, hasSubscription, status]);

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
    
    // If trying to switch to ElevenLabs without subscription, still allow UI to show it
    // but actual speak calls will be redirected to browser TTS
    ttsRef.current.setProvider(newProvider);
    setProvider(newProvider);
    updateStatus(ttsRef.current.getStatus());
  }, [updateStatus]);

  const getVoicesByProvider = useCallback((providerType: TTSProviderType) => {
    if (!ttsRef.current) return [];
    return ttsRef.current.getVoicesByProvider(providerType);
  }, []);

  const refreshVoices = useCallback(() => {
    if (!ttsRef.current) return;
    ttsRef.current.refreshVoices();
    setVoices(ttsRef.current.getAllVoices());
    updateStatus(ttsRef.current.getStatus());
  }, [updateStatus]);

  const loadCloudVoices = useCallback(async (providerType: CloudTTSProviderType) => {
    if (!ttsRef.current) return;
    await ttsRef.current.loadCloudVoices(providerType);
    setVoices(ttsRef.current.getAllVoices());
    updateStatus(ttsRef.current.getStatus());
  }, [updateStatus]);

  // Helper to check if a provider is actually available (considering subscription)
  const isProviderAvailable = useCallback((providerType: TTSProviderType) => {
    if (!isCloudProvider(providerType)) return true;
    return hasSubscription && status.cloud[providerType].available;
  }, [hasSubscription, status]);

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
    refreshVoices,
    loadCloudVoices,
    status,
    hasSubscription,
    isProviderAvailable,
    wordBoundary,
  };
}
