'use client';

import { useSettings } from '../contexts/SettingsContext';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Dropdown, DropdownOption } from '@/app/components/ui/Dropdown';

// Import TTSSettings dynamically with SSR disabled
const TTSSettings = dynamic(() => import('../components/TTSSettings'), {
  ssr: false,
  loading: () => (
    <div className="p-6">
      <div className="animate-pulse h-6 w-48 bg-gray-200 rounded mb-4"></div>
      <div className="animate-pulse h-4 w-full bg-gray-200 rounded mb-2"></div>
      <div className="animate-pulse h-10 w-full bg-gray-200 rounded mb-4"></div>
    </div>
  )
});

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

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
            <Dropdown
              options={[
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' },
                { value: 'xlarge', label: 'Extra Large' }
              ]}
              value={settings.textSize}
              onChange={(value) => updateSetting('textSize', value)}
              className="w-48"
            />
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
            <Dropdown
              options={[
                { value: 'newline', label: 'New Line' },
                { value: 'speak', label: 'Speak Text' },
                { value: 'clear', label: 'Clear Text' }
              ]}
              value={settings.enterKeyBehavior}
              onChange={(value) => updateSetting('enterKeyBehavior', value)}
              className="w-48"
            />
          </div>
        </div>
      </section>

      <section className="mb-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <TTSSettings />
      </section>
    </div>
  );
}
