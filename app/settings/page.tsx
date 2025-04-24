'use client';

import { useSettings } from '../contexts/SettingsContext';
import { useTTS } from '@/lib/hooks/useTTS';
import { PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings();
  const { voices, speak, stop, isSpeaking } = useTTS();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  // Ensure we have default values
  const speechRate = settings.speechRate ?? 1.0;
  const speechPitch = settings.speechPitch ?? 1.0;
  const speechVolume = settings.speechVolume ?? 1.0;
  const speechVoice = settings.speechVoice ?? '';

  const handlePreview = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak('This is a preview of the current voice settings.', {
        rate: speechRate,
        pitch: speechPitch,
        volume: speechVolume,
        voiceURI: speechVoice,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Settings</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Text Size</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-lg border border-gray-100">
            <div>
              <h3 className="font-medium text-gray-900">Typing Area Text Size</h3>
              <p className="text-gray-600">Adjust the size of text in the typing area</p>
            </div>
            <select
              value={settings.textSize}
              onChange={(e) => updateSetting('textSize', e.target.value as 'small' | 'medium' | 'large' | 'xlarge')}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra Large</option>
            </select>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Enter Key Behavior</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-lg border border-gray-100">
            <div>
              <h3 className="font-medium text-gray-900">When Enter is Pressed</h3>
              <p className="text-gray-600">Choose what happens when you press Enter in the typing area</p>
            </div>
            <select
              value={settings.enterKeyBehavior}
              onChange={(e) => updateSetting('enterKeyBehavior', e.target.value as 'newline' | 'speak' | 'clear')}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
            >
              <option value="newline">New Line</option>
              <option value="speak">Speak Text</option>
              <option value="clear">Clear Text</option>
            </select>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Speech Settings</h2>
        <div className="space-y-4">
          {isMobile ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <h3 className="font-medium text-yellow-800 mb-2">Mobile Device Detected</h3>
              <p className="text-yellow-700">
                On mobile devices, all voice settings (voice selection, rate, pitch, and volume)
                are managed through your device&apos;s accessibility
                or text-to-speech settings to adjust these options.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-lg border border-gray-100">
                <div>
                  <h3 className="font-medium text-gray-900">Voice Selection</h3>
                  <p className="text-gray-600">Choose the voice to use for speech</p>
                </div>
                <select
                  value={speechVoice}
                  onChange={(e) => updateSetting('speechVoice', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                >
                  <option value="">System Default</option>
                  {voices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Speech Rate</h3>
                  <p className="text-gray-600">Adjust how fast the text is spoken</p>
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={speechRate}
                      onChange={(e) => updateSetting('speechRate', parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-600 [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-gray-700 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gray-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:hover:bg-gray-700"
                    />
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {speechRate.toFixed(1)}x
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Speech Pitch</h3>
                  <p className="text-gray-600">Adjust the pitch of the voice</p>
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={speechPitch}
                      onChange={(e) => updateSetting('speechPitch', parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-600 [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-gray-700 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gray-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:hover:bg-gray-700"
                    />
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {speechPitch.toFixed(1)}x
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Speech Volume</h3>
                  <p className="text-gray-600">Adjust the volume of the speech</p>
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={speechVolume}
                      onChange={(e) => updateSetting('speechVolume', parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-600 [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-gray-700 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gray-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:hover:bg-gray-700"
                    />
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {speechVolume.toFixed(1)}x
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-lg border border-gray-100">
            <div>
              <h3 className="font-medium text-gray-900">Preview Voice</h3>
              <p className="text-gray-600">Test the current voice settings</p>
            </div>
            <button
              onClick={handlePreview}
              className={`inline-flex items-center px-6 py-3 rounded-xl shadow-lg transform transition-all duration-200 ${
                isSpeaking
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:-translate-y-0.5 hover:shadow-xl text-white'
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 hover:-translate-y-0.5 hover:shadow-xl text-white'
              }`}
            >
              {isSpeaking ? (
                <>
                  <StopIcon className="w-5 h-5 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Play
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
