'use client';

import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  Cog6ToothIcon, 
  SpeakerWaveIcon, 
  PaintBrushIcon,
  EyeIcon,
  CommandLineIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { SettingsCard } from '@/app/components/ui/SettingsCard';
import { SettingsSection } from '@/app/components/ui/SettingsSection';
import { ToggleSwitch } from '@/app/components/ui/ToggleSwitch';
import { Dropdown } from '@/app/components/ui/Dropdown';

// Import types from SettingsContext
type TextSize = 'small' | 'medium' | 'large' | 'xlarge';
type EnterKeyBehavior = 'newline' | 'speak' | 'clear' | 'speakAndClear';
type ThemeMode = 'light' | 'dark' | 'system';

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
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until after hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto p-6">
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

  const themeOptions = [
    { value: 'light', label: 'Light', icon: <SunIcon className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <MoonIcon className="w-4 h-4" /> },
    { value: 'system', label: 'System', icon: <ComputerDesktopIcon className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your SayIt experience to match your preferences
          </p>
        </div>

        <div className="space-y-8">
          {/* Appearance Settings */}
          <SettingsSection 
            title="Appearance" 
            description="Customize the visual appearance of the application"
          >
            <SettingsCard
              title="Theme"
              description="Choose your preferred color scheme"
              icon={<PaintBrushIcon className="w-6 h-6" />}
            >
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value as ThemeMode)}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-all ${settings.theme === option.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'}`}
                  >
                    {option.icon}
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </SettingsCard>
          </SettingsSection>

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
              icon={<CommandLineIcon className="w-6 h-6" />}
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

          {/* Accessibility Settings */}
          <SettingsSection 
            title="Accessibility" 
            description="Customize accessibility and user experience options"
          >
            <SettingsCard
              title="Accessibility Options"
              description="Improve usability for different needs and preferences"
              icon={<EyeIcon className="w-6 h-6" />}
            >
              <div className="space-y-4">
                <ToggleSwitch
                  enabled={settings.reduceMotion}
                  onChange={(enabled) => updateSetting('reduceMotion', enabled)}
                  label="Reduce Motion"
                  description="Minimize animations and transitions for better accessibility"
                />
                
                <ToggleSwitch
                  enabled={settings.highContrast}
                  onChange={(enabled) => updateSetting('highContrast', enabled)}
                  label="High Contrast"
                  description="Increase contrast for better visibility"
                />
                
                <ToggleSwitch
                  enabled={settings.enableKeyboardShortcuts}
                  onChange={(enabled) => updateSetting('enableKeyboardShortcuts', enabled)}
                  label="Keyboard Shortcuts"
                  description="Enable keyboard shortcuts for faster navigation"
                />
              </div>
            </SettingsCard>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
