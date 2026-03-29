'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { TTSProvider, TTSVoice, TTSProviderType } from '../tts-provider';
import { useSubscription } from '@/app/hooks/useSubscription';
import { useSettings } from '@/app/contexts/SettingsContext';

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
    setStatus(ttsRef.current.getStatus());
  }, [settings.ttsProvider]);

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

  const speak = useCallback((text: string, customOptions?: {
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

    // Merge settings with custom options, with custom options taking precedence
    const currentSettings = settingsRef.current;
    const options = {
      voiceId: customOptions?.voiceId || currentSettings.ttsVoiceId,
      rate: customOptions?.rate || currentSettings.speechRate,
      pitch: customOptions?.pitch || currentSettings.speechPitch,
      volume: customOptions?.volume || currentSettings.speechVolume,
      stability: customOptions?.stability || currentSettings.ttsStability,
      similarityBoost: customOptions?.similarityBoost || currentSettings.ttsSimilarityBoost
    };

    // Check if current provider is ElevenLabs or the voice is an ElevenLabs voice
    const voice = options.voiceId 
      ? voices.find(v => v.id === options.voiceId) 
      : null;
    
    const isElevenLabsVoice = voice?.provider === 'elevenlabs';
    const currentProvider = ttsRef.current.getCurrentProvider();
    const usingElevenLabs = isElevenLabsVoice || currentProvider === 'elevenlabs';
    
    // If trying to use ElevenLabs without a subscription, force browser TTS
    if (usingElevenLabs && !hasSubscription) {
      console.log('Forcing browser TTS for non-subscribers');
      
      // Find a browser voice to use instead
      const browserVoices = voices.filter(v => v.provider === 'browser');
      const fallbackVoice = browserVoices.length > 0 ? browserVoices[0].id : undefined;
      
      // Temporarily switch to browser provider if needed
      const originalProvider = ttsRef.current.getCurrentProvider();
      if (originalProvider === 'elevenlabs') {
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
      if (originalProvider === 'elevenlabs') {
        setStatus({
          ...status,
          activeProvider: 'browser'
        });
      }
      
      return;
    }

    // Normal operation (either browser TTS or ElevenLabs for subscribers)
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
    setStatus(ttsRef.current.getStatus());
  }, []);

  const getVoicesByProvider = useCallback((providerType: TTSProviderType) => {
    if (!ttsRef.current) return [];
    return ttsRef.current.getVoicesByProvider(providerType);
  }, []);

  const refreshVoices = useCallback(() => {
    if (!ttsRef.current) return;
    ttsRef.current.refreshVoices();
    setVoices(ttsRef.current.getAllVoices());
    setStatus(ttsRef.current.getStatus());
  }, []);

  const loadElevenLabsVoices = useCallback(async () => {
    if (!ttsRef.current) return;
    await ttsRef.current.loadElevenLabsVoices();
    setVoices(ttsRef.current.getAllVoices());
    setStatus(ttsRef.current.getStatus());
  }, []);

  // Helper to check if a provider is actually available (considering subscription)
  const isProviderAvailable = useCallback((providerType: TTSProviderType) => {
    if (providerType === 'browser') return true;
    if (providerType === 'elevenlabs') return hasSubscription && status.elevenLabsAvailable;
    return false;
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
    loadElevenLabsVoices,
    status,
    hasSubscription,
    isProviderAvailable
  };
}
