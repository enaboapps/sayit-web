'use client';

import { useSettings } from '../contexts/SettingsContext';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
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
  const [, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  // Don't render anything until after hydration
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">Settings</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Text Size</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Typing Area Text Size</h3>
                <p className="text-gray-600 dark:text-gray-400">Adjust the size of text in the typing area</p>
              </div>
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
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Enter Key Behavior</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">When Enter is Pressed</h3>
                <p className="text-gray-600 dark:text-gray-400">Choose what happens when you press Enter in the typing area</p>
              </div>
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
          </div>
        </section>

        <section className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <TTSSettings />
        </section>
      </div>
    </div>
  );
}
