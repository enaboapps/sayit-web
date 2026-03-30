'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTTS } from '@/lib/hooks/useTTS';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { TTSVoice, TTSProviderType } from '@/lib/tts-provider';
import { useSettings } from '../contexts/SettingsContext';
import { Dropdown } from '@/app/components/ui/Dropdown';
import { Slider } from '@/app/components/ui/Slider';
import { useRouter } from 'next/navigation';
import { PlayCircleIcon, StopCircleIcon } from '@heroicons/react/24/solid';

// Extended TTSVoice type to include metadata
interface ExtendedTTSVoice extends TTSVoice {
  metadata?: {
    preview_url?: string;
    description?: string;
  };
}

export default function TTSSettings() {
  const { settings, updateSetting } = useSettings();
  const {
    voices,
    speak,
    stop,
    isSpeaking,
    status,
    getVoicesByProvider,
    refreshVoices,
    loadElevenLabsVoices,
    hasSubscription
  } = useTTS();

  const router = useRouter();
  const { isOnline } = useOnlineStatus();

  const [providerVoices, setProviderVoices] = useState<ExtendedTTSVoice[]>([]);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Sample text for previews
  const SAMPLE_TEXT = 'Hello, this is a preview of how this voice sounds.';

  // Load provider voices only when voices or provider changes
  useEffect(() => {
    if (settings.ttsProvider === 'browser') {
      refreshVoices();
    }
  }, [refreshVoices, settings.ttsProvider]);

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    void loadElevenLabsVoices();
  }, [isOnline, loadElevenLabsVoices]);

  useEffect(() => {
    const voicesForProvider = getVoicesByProvider(settings.ttsProvider);
    setProviderVoices(voicesForProvider);
  }, [voices, settings.ttsProvider, getVoicesByProvider]);

  // Handle default voice selection if needed
  useEffect(() => {
    if (providerVoices.length > 0) {
      const currentVoiceExists = providerVoices.some(v => v.id === settings.ttsVoiceId);

      if (!currentVoiceExists) {
        updateSetting('ttsVoiceId', providerVoices[0].id);
      }
    }
  }, [providerVoices, settings.ttsVoiceId, updateSetting]);

  // Safe provider change
  const handleProviderChange = useCallback((newProvider: TTSProviderType) => {
    if (newProvider === 'elevenlabs' && (!status.elevenLabsAvailable || !isOnline)) {
      return;
    }

    if (settings.ttsProvider !== newProvider) {
      updateSetting('ttsProvider', newProvider);
    }
  }, [isOnline, settings.ttsProvider, status.elevenLabsAvailable, updateSetting]);

  // Preview voice function
  const previewVoice = useCallback(() => {
    if (isSpeaking) {
      stop();
      setIsPlayingPreview(false);
      return;
    }

    setIsPlayingPreview(true);

    if (settings.ttsProvider === 'elevenlabs' && isOnline) {
      const voice = providerVoices.find(v => v.id === settings.ttsVoiceId) as ExtendedTTSVoice;

      if (voice?.metadata?.preview_url) {
        const audio = new Audio(voice.metadata.preview_url);
        audio.onended = () => setIsPlayingPreview(false);
        audio.play().catch(() => setIsPlayingPreview(false));
      } else {
        speak(SAMPLE_TEXT);
        setTimeout(() => setIsPlayingPreview(false), 5000);
      }
    } else {
      speak(SAMPLE_TEXT);
      setTimeout(() => setIsPlayingPreview(false), 5000);
    }
  }, [isOnline, speak, stop, isSpeaking, settings.ttsProvider, settings.ttsVoiceId, providerVoices]);

  // Get selected voice name for display
  const selectedVoiceName = providerVoices.find(v => v.id === settings.ttsVoiceId)?.name;

  return (
    <div className="space-y-6">
      {/* Voice Selection Card */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Voice</h3>
        <div className="bg-surface-hover rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <Dropdown
                options={providerVoices.map(voice => ({
                  value: voice.id,
                  label: voice.name
                }))}
                value={settings.ttsVoiceId}
                onChange={(value) => updateSetting('ttsVoiceId', value)}
                placeholder={providerVoices.length === 0 ? 'Loading voices...' : 'Select a voice'}
                disabled={providerVoices.length === 0}
              />
            </div>

            <button
              type="button"
              onClick={previewVoice}
              disabled={providerVoices.length === 0}
              className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-surface border border-border text-text-secondary hover:bg-surface-hover hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isPlayingPreview ? 'Stop preview' : 'Preview voice'}
            >
              {isPlayingPreview ? (
                <StopCircleIcon className="w-6 h-6 text-primary-500" />
              ) : (
                <PlayCircleIcon className="w-6 h-6" />
              )}
            </button>
          </div>

          {selectedVoiceName && (
            <p className="mt-2 text-xs text-text-tertiary">
              Provider: {settings.ttsProvider === 'browser' ? 'Browser TTS' : 'ElevenLabs'}
            </p>
          )}
        </div>
      </div>

      {/* Provider Selection Card */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Provider</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Browser TTS Option */}
          <button
            type="button"
            onClick={() => handleProviderChange('browser')}
            className={`relative p-4 rounded-2xl border-2 text-left transition-all min-h-[72px] ${
              settings.ttsProvider === 'browser'
                ? 'border-primary-500 bg-primary-900'
                : 'border-border bg-surface hover:border-border hover:bg-surface-hover'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 ${
                settings.ttsProvider === 'browser'
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-text-tertiary'
              }`}>
                {settings.ttsProvider === 'browser' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <span className="block font-medium text-foreground text-sm">Browser TTS</span>
                <span className="block text-xs text-text-secondary mt-0.5">System voices</span>
              </div>
            </div>
          </button>

          {/* ElevenLabs Option */}
          <button
            type="button"
            onClick={() => handleProviderChange('elevenlabs')}
            disabled={!status.elevenLabsAvailable || !isOnline}
            className={`relative p-4 rounded-2xl border-2 text-left transition-all min-h-[72px] ${
              !status.elevenLabsAvailable || !isOnline
                ? 'opacity-50 cursor-not-allowed border-border bg-surface'
                : settings.ttsProvider === 'elevenlabs'
                  ? 'border-primary-500 bg-primary-900'
                  : 'border-border bg-surface hover:border-border hover:bg-surface-hover'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 ${
                settings.ttsProvider === 'elevenlabs'
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-text-tertiary'
              }`}>
                {settings.ttsProvider === 'elevenlabs' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm">ElevenLabs</span>
                  {!hasSubscription && status.elevenLabsAvailable && (
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold bg-primary-900 text-primary-400 rounded">
                      PRO
                    </span>
                  )}
                </div>
                <span className="block text-xs text-text-secondary mt-0.5">AI voices</span>
              </div>
            </div>
          </button>
        </div>

        {/* Subtle subscription note */}
        {settings.ttsProvider === 'elevenlabs' && !hasSubscription && status.elevenLabsAvailable && (
          <p className="text-xs text-text-secondary px-1">
            Pro subscription required for ElevenLabs voices.{' '}
            <button
              type="button"
              onClick={() => router.push('/pricing')}
              className="text-primary-400 hover:text-primary-300 underline"
            >
              Upgrade
            </button>
          </p>
        )}

        {!isOnline && (
          <p className="text-xs text-amber-500 px-1">
            Offline. Browser TTS still works, but ElevenLabs voices need internet.
          </p>
        )}

        {!status.elevenLabsAvailable && isOnline && (
          <p className="text-xs text-text-tertiary px-1">
            ElevenLabs unavailable. API key not configured.
          </p>
        )}
      </div>

      {/* Voice Quality Card (ElevenLabs only) */}
      {settings.ttsProvider === 'elevenlabs' && hasSubscription && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Voice Quality</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateSetting('ttsModelPreference', 'fast')}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all min-h-[72px] ${
                settings.ttsModelPreference === 'fast'
                  ? 'border-primary-500 bg-primary-900'
                  : 'border-border bg-surface hover:border-border hover:bg-surface-hover'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 ${
                  settings.ttsModelPreference === 'fast'
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-text-tertiary'
                }`}>
                  {settings.ttsModelPreference === 'fast' && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="block font-medium text-foreground text-sm">Fast</span>
                  <span className="block text-xs text-text-secondary mt-0.5">Low latency</span>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => updateSetting('ttsModelPreference', 'high_quality')}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all min-h-[72px] ${
                settings.ttsModelPreference === 'high_quality'
                  ? 'border-primary-500 bg-primary-900'
                  : 'border-border bg-surface hover:border-border hover:bg-surface-hover'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 ${
                  settings.ttsModelPreference === 'high_quality'
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-text-tertiary'
                }`}>
                  {settings.ttsModelPreference === 'high_quality' && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="block font-medium text-foreground text-sm">High Quality</span>
                  <span className="block text-xs text-text-secondary mt-0.5">More expressive</span>
                </div>
              </div>
            </button>
          </div>
          <p className="text-xs text-text-tertiary px-1">
            {settings.ttsModelPreference === 'high_quality'
              ? 'Using ElevenLabs v3 for richer, more expressive speech. Latency will be higher.'
              : 'Using ElevenLabs Flash for fastest response time.'}
          </p>
        </div>
      )}

      {/* Voice Settings Card */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Voice Settings</h3>
        <div className="bg-surface-hover rounded-2xl p-4 space-y-5">
          {/* Browser TTS settings */}
          {settings.ttsProvider === 'browser' && (
            <>
              <Slider
                value={settings.speechRate}
                onChange={(value) => updateSetting('speechRate', value)}
                min={0.5}
                max={2}
                step={0.1}
                label="Speed"
                valueLabel={(v) => `${v.toFixed(1)}x`}
              />

              <Slider
                value={settings.speechPitch}
                onChange={(value) => updateSetting('speechPitch', value)}
                min={0.5}
                max={2}
                step={0.1}
                label="Pitch"
                valueLabel={(v) => v.toFixed(1)}
              />
            </>
          )}

          {/* ElevenLabs-specific settings */}
          {settings.ttsProvider === 'elevenlabs' && hasSubscription && (
            <>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={settings.ttsStability}
                onChange={(value) => updateSetting('ttsStability', value)}
                label="Stability"
                valueLabel={(v) => v.toFixed(1)}
              />

              <Slider
                min={0}
                max={1}
                step={0.1}
                value={settings.ttsSimilarityBoost}
                onChange={(value) => updateSetting('ttsSimilarityBoost', value)}
                label="Similarity"
                valueLabel={(v) => v.toFixed(1)}
              />
            </>
          )}

          {settings.ttsProvider === 'elevenlabs' && !hasSubscription && (
            <p className="text-xs text-text-tertiary text-center py-2">
              Advanced voice controls available with Pro subscription
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
