'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTTS } from '@/lib/hooks/useTTS';
import { TTSVoice, TTSProviderType } from '@/lib/tts-provider';
import { useSettings } from '../contexts/SettingsContext';
import { Dropdown } from '@/app/components/ui/Dropdown';
import { Slider } from '@/app/components/ui/Slider';
import SubscriptionWrapper from '@/app/components/SubscriptionWrapper';
import { useRouter } from 'next/navigation';
import { PlayCircleIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';

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
    hasSubscription
  } = useTTS();
  
  const router = useRouter();
  
  const [providerVoices, setProviderVoices] = useState<ExtendedTTSVoice[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showSubscriptionMessage, setShowSubscriptionMessage] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  
  // Sample text for previews - hardcoded
  const SAMPLE_TEXT = 'Hello, this is a preview of how this voice sounds.';
  
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

  // Alert user when trying to use ElevenLabs without subscription
  useEffect(() => {
    if (settings.ttsProvider === 'elevenlabs' && !hasSubscription) {
      setShowSubscriptionMessage(true);
    } else {
      setShowSubscriptionMessage(false);
    }
  }, [settings.ttsProvider, hasSubscription]);

  // Safe provider change that prevents loops
  const handleProviderChange = useCallback((newProvider: TTSProviderType) => {
    // Don't change if the provider is not available
    if (newProvider === 'elevenlabs' && !status.elevenLabsAvailable) {
      return;
    }
    
    // Only update if different
    if (settings.ttsProvider !== newProvider) {
      // If switching to ElevenLabs and no subscription, show message
      if (newProvider === 'elevenlabs' && !hasSubscription) {
        setShowSubscriptionMessage(true);
      }
      
      updateSetting('ttsProvider', newProvider);
    }
  }, [settings.ttsProvider, status.elevenLabsAvailable, updateSetting, hasSubscription]);

  // Preview voice function for both providers
  const previewVoice = useCallback(() => {
    if (isSpeaking) {
      stop();
      setIsPlayingPreview(false);
      return;
    }
    
    setIsPlayingPreview(true);
    
    // Different behavior based on provider
    if (settings.ttsProvider === 'elevenlabs') {
      // Find currently selected voice
      const voice = providerVoices.find(v => v.id === settings.ttsVoiceId) as ExtendedTTSVoice;
      
      if (voice?.metadata?.preview_url) {
        // If the voice has a preview URL, use that
        const audio = new Audio(voice.metadata.preview_url);
        audio.onended = () => setIsPlayingPreview(false);
        audio.play().catch(error => {
          console.error('Error playing preview:', error);
          setIsPlayingPreview(false);
        });
      } else {
        // Use the TTS API to generate a preview
        speak(SAMPLE_TEXT);
        
        // Reset the playing state when done
        setTimeout(() => {
          setIsPlayingPreview(false);
        }, 5000); // Assume preview takes at most 5 seconds
      }
    } else {
      // Browser TTS preview
      speak(SAMPLE_TEXT);
      
      // Reset the playing state when done
      setTimeout(() => {
        setIsPlayingPreview(false);
      }, 5000);
    }
  }, [
    speak, 
    stop, 
    isSpeaking, 
    settings.ttsProvider,
    settings.ttsVoiceId, 
    providerVoices
  ]);

  // Determine button styling without recreating on every render
  const browserButtonClass = `px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
    settings.ttsProvider === 'browser'
      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
  }`;
    
  const elevenlabsButtonClass = `px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
    settings.ttsProvider === 'elevenlabs'
      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
  } ${!status.elevenLabsAvailable ? 'opacity-50 cursor-not-allowed' : ''}`;

  return (
    <div className="space-y-6">
      {/* Removed redundant header since it's now handled by the parent SettingsCard */}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">TTS Provider</label>
          <div className="mt-1 flex space-x-4">
            <button
              type="button"
              onClick={() => handleProviderChange('browser')}
              className={browserButtonClass}
            >
              Browser TTS
              {status.browserTTSAvailable ? 
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">Available</span> : 
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">Unavailable</span>
              }
            </button>
            <button
              type="button"
              onClick={() => handleProviderChange('elevenlabs')}
              className={elevenlabsButtonClass}
              disabled={!status.elevenLabsAvailable}
            >
              ElevenLabs
              {status.elevenLabsAvailable ? 
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">Available</span> : 
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">Unavailable</span>
              }
              {!hasSubscription && settings.ttsProvider === 'elevenlabs' && (
                <span className="ml-2 text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">Premium</span>
              )}
            </button>
          </div>
          {!status.elevenLabsAvailable && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              ElevenLabs API key not found. Add one to your environment variables to use high-quality voices.
            </p>
          )}
          {showSubscriptionMessage && settings.ttsProvider === 'elevenlabs' && !hasSubscription && (
            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <span className="font-medium">Premium Feature:</span> Full ElevenLabs voice functionality requires a subscription. You can preview voices, but your speech will use Browser TTS instead.
                  </p>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => router.push('/pricing')}
                      className="text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:text-yellow-600 dark:hover:text-yellow-200 underline"
                    >
                      Upgrade to Pro
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSubscriptionMessage(false)}
                      className="ml-3 text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:text-yellow-600 dark:hover:text-yellow-200 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="voice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
            
            <button
              type="button"
              onClick={previewVoice}
              disabled={isPlayingPreview || providerVoices.length === 0}
              className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Preview Voice"
            >
              {isPlayingPreview ? (
                <SpeakerWaveIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <PlayCircleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
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
                  <label htmlFor="rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Speech Rate
                  </label>
                  <div className="mt-1">
                    <Slider
                      value={settings.speechRate}
                      onChange={(value) => updateSetting('speechRate', value)}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="pitch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pitch
                  </label>
                  <div className="mt-1">
                    <Slider
                      value={settings.speechPitch}
                      onChange={(value) => updateSetting('speechPitch', value)}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {settings.ttsProvider === 'elevenlabs' && (
          <>
            {/* ElevenLabs specific settings */}
            <SubscriptionWrapper
              fallback={
                <div className="bg-gray-50 p-6 rounded-lg text-center my-4">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Pro Feature</h3>
                  <p className="text-gray-600 mb-6">
                    The high-quality ElevenLabs voices require a subscription. You can preview the voices, but full functionality is only available with a Pro subscription.
                  </p>
                  <div className="flex flex-col space-y-2">
                    <button 
                      onClick={() => router.push('/pricing')}
                      className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                    >
                      Upgrade to Pro
                    </button>
                    <button 
                      onClick={() => handleProviderChange('browser')}
                      className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Switch to Browser TTS
                    </button>
                  </div>
                </div>
              }
            >
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
            </SubscriptionWrapper>
          </>
        )}
      </div>
    </div>
  );
} 