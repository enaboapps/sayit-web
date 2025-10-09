'use client';

import { useSettings } from '../contexts/SettingsContext';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  Cog6ToothIcon, 
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import { SettingsCard } from '@/app/components/ui/SettingsCard';
import { SettingsSection } from '@/app/components/ui/SettingsSection';
import { Dropdown } from '@/app/components/ui/Dropdown';

// Import types from SettingsContext
type TextSize = 'small' | 'medium' | 'large' | 'xlarge';
type EnterKeyBehavior = 'newline' | 'speak' | 'clear' | 'speakAndClear';

// Import TTSSettings dynamically with SSR disabled
const TTSSettings = dynamic(() => import('../components/TTSSettings'), {
  ssr: false,
  loading: () => (
    <div className="p-6">
      <div className="animate-pulse h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
      <div className="animate-pulse h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
      <div className="animate-pulse h-10 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
    </div>
  )
});

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until after hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-8"></div>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your text-to-speech and typing preferences
          </p>
        </div>

        <div className="space-y-8">
          {/* Text & Behavior Settings */}
          <SettingsSection 
            title="Text & Behavior" 
            description="Configure text size and input behavior"
          >
            <SettingsCard
              title="Text Size"
              description="Adjust the size of text in the typing area"
              icon={<Cog6ToothIcon className="w-6 h-6" />}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Current size: {settings.textSize}
                </span>
                <Dropdown
                  options={[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                    { value: 'xlarge', label: 'Extra Large' }
                  ]}
                  value={settings.textSize}
                  onChange={(value) => updateSetting('textSize', value as TextSize)}
                  className="w-48"
                />
              </div>
            </SettingsCard>

            <SettingsCard
              title="Enter Key Behavior"
              description="Choose what happens when you press Enter in the typing area"
              icon={<Cog6ToothIcon className="w-6 h-6" />}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Current behavior: {settings.enterKeyBehavior.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
                <Dropdown
                  options={[
                    { value: 'newline', label: 'New Line' },
                    { value: 'speak', label: 'Speak Text' },
                    { value: 'clear', label: 'Clear Text' },
                    { value: 'speakAndClear', label: 'Speak & Clear Text' }
                  ]}
                  value={settings.enterKeyBehavior}
                  onChange={(value) => updateSetting('enterKeyBehavior', value as EnterKeyBehavior)}
                  className="w-48"
                />
              </div>
            </SettingsCard>
          </SettingsSection>

          {/* Text-to-Speech Settings */}
          <SettingsSection 
            title="Text-to-Speech" 
            description="Configure voice and speech settings"
          >
            <SettingsCard
              title="Voice Settings"
              description="Choose your preferred text-to-speech voice and provider"
              icon={<SpeakerWaveIcon className="w-6 h-6" />}
            >
              <TTSSettings />
            </SettingsCard>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
