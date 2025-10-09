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


  return (
    <div className="space-y-6">
      {/* Provider Selection Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Choose Provider</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Browser TTS Card */}
            <div 
              onClick={() => handleProviderChange('browser')}
              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                settings.ttsProvider === 'browser'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Browser TTS</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Built-in system voices</p>
                </div>
                <div className="flex items-center space-x-2">
                  {status.browserTTSAvailable ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                      ✓ Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
                      ✗ Unavailable
                    </span>
                  )}
                  {settings.ttsProvider === 'browser' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>

            {/* ElevenLabs Card */}
            <div 
              onClick={() => status.elevenLabsAvailable && handleProviderChange('elevenlabs')}
              className={`relative p-4 border-2 rounded-lg transition-all ${
                !status.elevenLabsAvailable 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer'
              } ${
                settings.ttsProvider === 'elevenlabs'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">ElevenLabs</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">High-quality AI voices</p>
                </div>
                <div className="flex items-center space-x-2">
                  {status.elevenLabsAvailable ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                      ✓ Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
                      ✗ Unavailable
                    </span>
                  )}
                  {!hasSubscription && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                      Premium
                    </span>
                  )}
                  {settings.ttsProvider === 'elevenlabs' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
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

        {/* Voice Selection Section */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Voice Selection</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {providerVoices.length > 0 ? 
                `Choose from ${providerVoices.length} available voices` : 
                'Loading voices...'
              }
            </p>
          </div>
          
          <div className="flex space-x-3">
            <div className="flex-1">
              <Dropdown
                options={providerVoices.map(voice => ({
                  value: voice.id,
                  label: voice.name
                }))}
                value={settings.ttsVoiceId}
                onChange={(value) => updateSetting('ttsVoiceId', value)}
                placeholder={providerVoices.length === 0 ? 'Loading voices...' : 'Select a voice'}
                className="w-full"
                disabled={providerVoices.length === 0}
              />
            </div>
            
            <button
              type="button"
              onClick={previewVoice}
              disabled={isPlayingPreview || providerVoices.length === 0}
              className={`inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md transition-colors ${
                isPlayingPreview 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                  : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              title={isPlayingPreview ? 'Stop preview' : 'Preview voice'}
            >
              {isPlayingPreview ? (
                <>
                  <SpeakerWaveIcon className="h-4 w-4 mr-2" />
                  <span>Playing...</span>
                </>
              ) : (
                <>
                  <PlayCircleIcon className="h-4 w-4 mr-2" />
                  <span>Preview</span>
                </>
              )}
            </button>
          </div>
          
          {providerVoices.length > 0 && settings.ttsVoiceId && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Selected: {providerVoices.find(v => v.id === settings.ttsVoiceId)?.name || 'Unknown'}
            </div>
          )}
        </div>

        {/* Browser TTS Specific Settings */}
        {settings.ttsProvider === 'browser' && (
          <div className="space-y-4">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Browser TTS Settings</h3>
              {isMobile ? (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400 dark:text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Mobile Device Detected</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Speech rate and pitch are controlled by your device's system settings. 
                        Please adjust these in your device's accessibility options.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Slider
                      value={settings.speechRate}
                      onChange={(value) => updateSetting('speechRate', value)}
                      min={0.5}
                      max={2}
                      step={0.1}
                      label="Speech Rate"
                      description="Adjust how fast the voice speaks"
                      showTicks
                    />
                  </div>

                  <div>
                    <Slider
                      value={settings.speechPitch}
                      onChange={(value) => updateSetting('speechPitch', value)}
                      min={0.5}
                      max={2}
                      step={0.1}
                      label="Pitch"
                      description="Adjust the voice pitch (higher or lower tone)"
                      showTicks
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ElevenLabs Specific Settings */}
        {settings.ttsProvider === 'elevenlabs' && (
          <div className="space-y-4">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">ElevenLabs Settings</h3>
              <SubscriptionWrapper
                fallback={
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 p-6 rounded-lg text-center border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Premium Feature</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Advanced ElevenLabs voice controls require a Pro subscription. Voice previews are available, but speech generation uses Browser TTS.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => router.push('/pricing')}
                        className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Upgrade to Pro
                      </button>
                      <button 
                        onClick={() => handleProviderChange('browser')}
                        className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Use Browser TTS
                      </button>
                    </div>
                  </div>
                }
              >
                <div className="space-y-6">
                  <div>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={settings.ttsStability}
                      onChange={(value) => updateSetting('ttsStability', value)}
                      label="Voice Stability"
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
                      description="Higher values make the voice more closely match the original voice characteristics"
                    />
                  </div>
                </div>
              </SubscriptionWrapper>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 