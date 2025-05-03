'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTTS } from '@/lib/hooks/useTTS';
import { TTSVoice, TTSProviderType } from '@/lib/tts-provider';
import { useSettings } from '../contexts/SettingsContext';
import { Dropdown, DropdownOption } from '@/app/components/ui/Dropdown';
import { Slider } from '@/app/components/ui/Slider';

export default function TTSSettings() {
  const { settings, updateSetting } = useSettings();
  const { 
    voices, 
    speak, 
    stop, 
    isSpeaking, 
    status,
    getVoicesByProvider
  } = useTTS();
  
  const [sampleText, setSampleText] = useState('Hello, this is a sample text to demonstrate text-to-speech capabilities.');
  const [providerVoices, setProviderVoices] = useState<TTSVoice[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile device
  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  // Load provider voices only when voices or provider changes
  useEffect(() => {
    const voicesForProvider = getVoicesByProvider(settings.ttsProvider);
    console.log(`Got ${voicesForProvider.length} voices for provider ${settings.ttsProvider}`);
    setProviderVoices(voicesForProvider);
  }, [voices, settings.ttsProvider, getVoicesByProvider]);
  
  // Handle default voice selection if needed
  useEffect(() => {
    if (providerVoices.length > 0) {
      // Check if current voice is from the current provider
      const currentVoiceExists = providerVoices.some(v => v.id === settings.ttsVoiceId);
      
      if (!currentVoiceExists) {
        console.log('Current voice not found in provider voices, setting default voice to:', providerVoices[0]);
        updateSetting('ttsVoiceId', providerVoices[0].id);
      } else {
        console.log('Using existing voice ID:', settings.ttsVoiceId);
      }
    }
  }, [providerVoices, settings.ttsVoiceId, updateSetting]);

  // When provider changes, log available voices
  useEffect(() => {
    console.log('Available voices for provider', settings.ttsProvider, ':', providerVoices);
  }, [settings.ttsProvider, providerVoices]);

  // Safe provider change that prevents loops
  const handleProviderChange = useCallback((newProvider: TTSProviderType) => {
    // Don't change if the provider is not available
    if (newProvider === 'elevenlabs' && !status.elevenLabsAvailable) {
      return;
    }
    
    // Only update if different
    if (settings.ttsProvider !== newProvider) {
      updateSetting('ttsProvider', newProvider);
    }
  }, [settings.ttsProvider, status.elevenLabsAvailable, updateSetting]);

  const handlePlay = useCallback(() => {
    if (isSpeaking) {
      stop();
    } else {
      console.log('Speaking with voice:', settings.ttsVoiceId);
      console.log('Selected voice details:', providerVoices.find(v => v.id === settings.ttsVoiceId));
      
      speak(sampleText, {
        voiceId: settings.ttsVoiceId,
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        stability: settings.ttsStability,
        similarityBoost: settings.ttsSimilarityBoost
      });
    }
  }, [
    isSpeaking, 
    stop, 
    speak, 
    sampleText, 
    settings.ttsVoiceId, 
    settings.speechRate, 
    settings.speechPitch, 
    settings.ttsStability, 
    settings.ttsSimilarityBoost,
    providerVoices
  ]);

  // Determine button styling without recreating on every render
  const browserButtonClass = settings.ttsProvider === 'browser'
    ? 'bg-black text-white'
    : 'bg-gray-200 text-gray-700 hover:bg-gray-300';
    
  const elevenlabsButtonClass = `${
    settings.ttsProvider === 'elevenlabs'
      ? 'bg-black text-white'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
  } ${!status.elevenLabsAvailable ? 'opacity-50 cursor-not-allowed' : ''}`;

  return (
    <div className="space-y-6 py-6 px-4 sm:p-6">
      <div>
        <h2 className="text-lg font-medium leading-6 text-gray-900">Text-to-Speech Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure your text-to-speech preferences.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">TTS Provider</label>
          <div className="mt-1 flex space-x-4">
            <button
              type="button"
              onClick={() => handleProviderChange('browser')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${browserButtonClass}`}
            >
              Browser TTS
              {status.browserTTSAvailable ? 
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full">Available</span> : 
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full">Unavailable</span>
              }
            </button>
            <button
              type="button"
              onClick={() => handleProviderChange('elevenlabs')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${elevenlabsButtonClass}`}
              disabled={!status.elevenLabsAvailable}
            >
              ElevenLabs
              {status.elevenLabsAvailable ? 
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full">Available</span> : 
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full">Unavailable</span>
              }
            </button>
          </div>
          {!status.elevenLabsAvailable && (
            <p className="mt-1 text-xs text-gray-500">
              ElevenLabs API key not found. Add one to your environment variables to use high-quality voices.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="voice" className="block text-sm font-medium text-gray-700">
            Voice
          </label>
          <div className="mt-1 flex space-x-2">
            <Dropdown
              options={providerVoices.map(voice => ({
                value: voice.id,
                label: voice.name
              }))}
              value={settings.ttsVoiceId}
              onChange={(value) => updateSetting('ttsVoiceId', value)}
              placeholder="Select a voice"
              className="w-full"
              disabled={providerVoices.length === 0}
            />
            
            {settings.ttsProvider === 'elevenlabs' && 
             providerVoices.find(v => v.id === settings.ttsVoiceId)?.metadata?.preview_url && (
              <button
                type="button"
                onClick={() => {
                  const voice = providerVoices.find(v => v.id === settings.ttsVoiceId);
                  if (voice?.metadata?.preview_url) {
                    const audio = new Audio(voice.metadata.preview_url);
                    audio.play();
                  }
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Preview Voice
              </button>
            )}
          </div>
        </div>

        {settings.ttsProvider === 'browser' && (
          <>
            {isMobile ? (
              <div className="mt-2 p-3 bg-gray-100 rounded-md border border-gray-300">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Note for mobile users:</span> On mobile devices, speech settings like rate and pitch 
                  are controlled by your device's system settings. Please adjust these settings in your device's accessibility options.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <Slider
                    min={0.1}
                    max={2}
                    step={0.1}
                    value={settings.speechRate}
                    onChange={(value) => updateSetting('speechRate', value)}
                    label="Rate"
                    showTicks
                    description="Controls how fast the voice speaks"
                  />
                </div>

                <div>
                  <Slider
                    min={0.1}
                    max={2}
                    step={0.1}
                    value={settings.speechPitch}
                    onChange={(value) => updateSetting('speechPitch', value)}
                    label="Pitch"
                    showTicks
                    trackColor="bg-gray-800"
                    thumbColor="bg-gray-800"
                    description="Controls the tone of the voice"
                  />
                </div>
              </>
            )}
          </>
        )}

        {settings.ttsProvider === 'elevenlabs' && (
          <>
            <div>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={settings.ttsStability}
                onChange={(value) => updateSetting('ttsStability', value)}
                label="Stability"
                showTicks
                description="Higher stability makes the voice more consistent but less expressive"
              />
            </div>

            <div>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={settings.ttsSimilarityBoost}
                onChange={(value) => updateSetting('ttsSimilarityBoost', value)}
                label="Similarity Boost"
                showTicks
                trackColor="bg-gray-800"
                thumbColor="bg-gray-800"
                description="Higher values make the voice more closely match the original voice"
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="sample-text" className="block text-sm font-medium text-gray-700">
            Sample Text
          </label>
          <textarea
            id="sample-text"
            name="sample-text"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handlePlay}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            {isSpeaking ? 'Stop' : 'Play'}
          </button>
        </div>
      </div>
    </div>
  );
} 