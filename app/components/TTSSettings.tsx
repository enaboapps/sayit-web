'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTTS } from '@/lib/hooks/useTTS';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { TTSProviderType } from '@/lib/tts-provider';
import { useSettings } from '../contexts/SettingsContext';
import { Dropdown, DropdownOption } from '@/app/components/ui/Dropdown';
import { Slider } from '@/app/components/ui/Slider';
import { useRouter } from 'next/navigation';
import { PlayCircleIcon, StopCircleIcon } from '@heroicons/react/24/solid';

// Sample text used for voice preview
const SAMPLE_TEXT = 'This is how I sound.';

const providerDetails: Record<TTSProviderType, { name: string; description: string }> = {
  browser: { name: 'Browser TTS', description: 'System voices' },
  elevenlabs: { name: 'ElevenLabs', description: 'AI voices' },
  azure: { name: 'Azure', description: 'Neural voices' },
  gemini: { name: 'Gemini', description: 'Expressive AI voices' },
};

type ProviderDropdownOption = DropdownOption<TTSProviderType> & {
  name: string;
  description: string;
  showProBadge: boolean;
};

const cloudProviders: TTSProviderType[] = ['elevenlabs', 'azure', 'gemini'];

function isCloudProvider(provider: TTSProviderType): provider is 'elevenlabs' | 'azure' | 'gemini' {
  return cloudProviders.includes(provider);
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
    loadAzureVoices,
    loadGeminiVoices,
    hasSubscription
  } = useTTS();

  const router = useRouter();
  const { isOnline } = useOnlineStatus();

  const [providerVoices, setProviderVoices] = useState(voices);
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female' | 'Unknown'>('All');
  const [langFilter, setLangFilter] = useState<string>('All');

  const providerAvailability = useMemo(() => ({
    elevenlabs: status.elevenLabsAvailable,
    azure: status.azureAvailable,
    gemini: status.geminiAvailable,
  }), [status.azureAvailable, status.elevenLabsAvailable, status.geminiAvailable]);

  const providerLoaded = useMemo(() => ({
    elevenlabs: status.elevenLabsVoicesLoaded,
    azure: status.azureVoicesLoaded,
    gemini: status.geminiVoicesLoaded,
  }), [status.azureVoicesLoaded, status.elevenLabsVoicesLoaded, status.geminiVoicesLoaded]);

  const savedCloudProvider = isCloudProvider(settings.ttsProvider) ? settings.ttsProvider : null;
  const savedCloudProviderAvailable = savedCloudProvider ? providerAvailability[savedCloudProvider] : true;
  const displayProvider: TTSProviderType = savedCloudProvider && (!isOnline || !savedCloudProviderAvailable)
    ? 'browser'
    : settings.ttsProvider;
  const isTemporaryFallback = displayProvider !== settings.ttsProvider;

  // Refresh browser voices when switching to browser provider
  useEffect(() => {
    if (displayProvider === 'browser') {
      refreshVoices();
    }
  }, [displayProvider, refreshVoices]);

  // Load ElevenLabs voices when online
  useEffect(() => {
    if (!isOnline) return;
    void loadElevenLabsVoices();
  }, [isOnline, loadElevenLabsVoices]);

  // Load Azure voices when online
  useEffect(() => {
    if (!isOnline) return;
    void loadAzureVoices();
  }, [isOnline, loadAzureVoices]);

  // Load Gemini voices when online
  useEffect(() => {
    if (!isOnline) return;
    void loadGeminiVoices();
  }, [isOnline, loadGeminiVoices]);

  // Update visible voices when provider or voice list changes
  useEffect(() => {
    setProviderVoices(getVoicesByProvider(displayProvider));
  }, [displayProvider, voices, getVoicesByProvider]);

  // Reset filters when provider changes
  useEffect(() => {
    setGenderFilter('All');
    setLangFilter('All');
  }, [displayProvider]);

  // Silently persist Browser TTS only when a saved cloud provider has been
  // checked online and confirmed unavailable. Offline fallback stays temporary.
  useEffect(() => {
    if (!savedCloudProvider || !isOnline) return;
    if (!providerLoaded[savedCloudProvider]) return;
    if (providerAvailability[savedCloudProvider]) return;

    updateSetting('ttsProvider', 'browser');
  }, [
    isOnline,
    providerAvailability,
    providerLoaded,
    savedCloudProvider,
    updateSetting,
  ]);

  const filteredVoices = useMemo(() => {
    let result = providerVoices;
    if (genderFilter !== 'All') result = result.filter(v => v.gender === genderFilter);
    if (langFilter !== 'All') result = result.filter(v => v.languageCodes?.some(lc => lc.bcp47 === langFilter));
    return result;
  }, [providerVoices, genderFilter, langFilter]);

  const languageOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { code: string; display: string }[] = [];
    for (const voice of providerVoices) {
      for (const lc of voice.languageCodes ?? []) {
        if (!seen.has(lc.bcp47)) {
          seen.add(lc.bcp47);
          opts.push({ code: lc.bcp47, display: lc.display });
        }
      }
    }
    return opts.sort((a, b) => a.display.localeCompare(b.display));
  }, [providerVoices]);

  // Auto-select first voice if current voice doesn't exist in filtered list
  useEffect(() => {
    if (isTemporaryFallback) return;

    if (filteredVoices.length > 0) {
      const currentVoiceExists = filteredVoices.some(v => v.id === settings.ttsVoiceId);
      if (!currentVoiceExists) {
        updateSetting('ttsVoiceId', filteredVoices[0].id);
      }
    }
  }, [filteredVoices, isTemporaryFallback, settings.ttsVoiceId, updateSetting]);

  const handleProviderChange = useCallback((newProvider: TTSProviderType) => {
    if (isCloudProvider(newProvider) && (!isOnline || !providerAvailability[newProvider])) return;

    if (settings.ttsProvider !== newProvider) {
      updateSetting('ttsProvider', newProvider);
    }
  }, [
    isOnline,
    providerAvailability,
    settings.ttsProvider,
    updateSetting,
  ]);

  const selectedDisplayVoiceId = displayProvider === settings.ttsProvider
    ? settings.ttsVoiceId
    : providerVoices[0]?.id ?? '';

  const handleVoiceChange = useCallback((voiceId: string) => {
    if (isTemporaryFallback) {
      updateSetting('ttsProvider', 'browser');
    }

    updateSetting('ttsVoiceId', voiceId);
  }, [isTemporaryFallback, updateSetting]);

  const previewVoice = useCallback(() => {
    if (isSpeaking) {
      stop();
      return;
    }
    speak(SAMPLE_TEXT, selectedDisplayVoiceId ? { voiceId: selectedDisplayVoiceId } : undefined);
  }, [speak, stop, isSpeaking, selectedDisplayVoiceId]);

  const selectedVoiceName = filteredVoices.find(v => v.id === selectedDisplayVoiceId)?.name;

  const providerLabel = displayProvider === 'elevenlabs'
    ? 'ElevenLabs'
    : displayProvider === 'azure'
      ? 'Azure'
      : displayProvider === 'gemini'
        ? 'Gemini'
        : 'Browser TTS';

  const providerOptions = useMemo<ProviderDropdownOption[]>(() => {
    const options: ProviderDropdownOption[] = [
      {
        value: 'browser',
        label: providerDetails.browser.name,
        name: providerDetails.browser.name,
        description: providerDetails.browser.description,
        disabled: false,
        showProBadge: false,
      },
    ];

    if (isOnline && status.elevenLabsAvailable) {
      options.push({
        value: 'elevenlabs',
        label: providerDetails.elevenlabs.name,
        name: providerDetails.elevenlabs.name,
        description: !hasSubscription ? 'AI voices - Pro' : providerDetails.elevenlabs.description,
        disabled: false,
        showProBadge: !hasSubscription,
      });
    }

    if (isOnline && status.azureAvailable) {
      options.push({
        value: 'azure',
        label: providerDetails.azure.name,
        name: providerDetails.azure.name,
        description: !hasSubscription ? 'Neural voices - Pro' : providerDetails.azure.description,
        disabled: false,
        showProBadge: !hasSubscription,
      });
    }

    if (isOnline && status.geminiAvailable) {
      options.push({
        value: 'gemini',
        label: providerDetails.gemini.name,
        name: providerDetails.gemini.name,
        description: !hasSubscription ? 'Expressive AI voices - Pro' : providerDetails.gemini.description,
        disabled: false,
        showProBadge: !hasSubscription,
      });
    }

    return options;
  }, [hasSubscription, isOnline, status.azureAvailable, status.elevenLabsAvailable, status.geminiAvailable]);

  const selectedProviderOption = providerOptions.find(option => option.value === displayProvider);

  const renderProviderOption = useCallback((option: DropdownOption<TTSProviderType>) => {
    const providerOption = option as ProviderDropdownOption;

    return (
      <span className="block">
        <span className="flex items-center gap-2">
          <span className="font-medium">{providerOption.label}</span>
          {providerOption.showProBadge && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold bg-primary-900 text-primary-400 rounded">
              PRO
            </span>
          )}
        </span>
        <span className="block text-xs opacity-80 mt-0.5">
          {providerOption.description}
        </span>
      </span>
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* Provider Selection Card */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Provider</h3>
        <div className="space-y-2">
          <Dropdown<TTSProviderType>
            options={providerOptions}
            value={displayProvider}
            onChange={handleProviderChange}
            placeholder="Select a provider"
            renderOption={renderProviderOption}
          />
          {selectedProviderOption && (
            <p className="text-xs text-text-secondary px-1">
              {selectedProviderOption.description}
            </p>
          )}
        </div>

        {/* Subscription note */}
        {isCloudProvider(displayProvider) && !hasSubscription && (
          <p className="text-xs text-text-secondary px-1">
            Pro subscription required for {providerLabel} voices.{' '}
            <button
              type="button"
              onClick={() => router.push('/pricing')}
              className="text-primary-400 hover:text-primary-300 underline"
            >
              Upgrade
            </button>
          </p>
        )}

      </div>

      {/* Voice Selection Card */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Voice</h3>
        <div className="bg-surface-hover rounded-2xl p-4">
          {displayProvider !== 'browser' && providerVoices.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select
                value={genderFilter}
                onChange={e => setGenderFilter(e.target.value as 'All' | 'Male' | 'Female' | 'Unknown')}
                className="rounded-xl border border-border bg-surface text-sm px-3 py-2 text-foreground"
              >
                <option value="All">All genders</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Unknown">Unknown</option>
              </select>
              <select
                value={langFilter}
                onChange={e => setLangFilter(e.target.value)}
                className="rounded-xl border border-border bg-surface text-sm px-3 py-2 text-foreground"
              >
                <option value="All">All languages</option>
                {languageOptions.map(l => (
                  <option key={l.code} value={l.code}>{l.display}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <Dropdown
                options={filteredVoices.map(voice => ({
                  value: voice.id,
                  label: voice.name
                }))}
                value={selectedDisplayVoiceId}
                onChange={handleVoiceChange}
                placeholder={providerVoices.length === 0 ? 'Loading voices...' : 'Select a voice'}
                disabled={providerVoices.length === 0}
                searchable
                searchPlaceholder="Search voices..."
              />
            </div>

            <button
              type="button"
              onClick={previewVoice}
              disabled={providerVoices.length === 0}
              className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-surface border border-border text-text-secondary hover:bg-surface-hover hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isSpeaking ? 'Stop preview' : 'Preview voice'}
            >
              {isSpeaking ? (
                <StopCircleIcon className="w-6 h-6 text-primary-500" />
              ) : (
                <PlayCircleIcon className="w-6 h-6" />
              )}
            </button>
          </div>

          {selectedVoiceName && (
            <p className="mt-2 text-xs text-text-tertiary">
              Provider: {providerLabel}
              {displayProvider !== 'browser' && providerVoices.length > 0 && (
                <span className="ml-2">· {filteredVoices.length} of {providerVoices.length} voices</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Voice Quality Card (ElevenLabs only) */}
      {displayProvider === 'elevenlabs' && hasSubscription && (
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
          {displayProvider === 'browser' && (
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
          {displayProvider === 'elevenlabs' && hasSubscription && (
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

          {displayProvider === 'elevenlabs' && !hasSubscription && (
            <p className="text-xs text-text-tertiary text-center py-2">
              Advanced voice controls available with Pro subscription
            </p>
          )}

          {displayProvider === 'azure' && (
            <p className="text-xs text-text-tertiary text-center py-2">
              Voice speed and pitch are set by the selected Azure voice.
            </p>
          )}

          {displayProvider === 'gemini' && (
            <p className="text-xs text-text-tertiary text-center py-2">
              Gemini 3.1 Flash uses the selected voice and style instructions in your text.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
