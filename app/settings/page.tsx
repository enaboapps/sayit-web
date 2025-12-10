'use client';

import { useSettings } from '../contexts/SettingsContext';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Cog6ToothIcon,
  SpeakerWaveIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { SettingsCard } from '@/app/components/ui/SettingsCard';
import { SettingsSection } from '@/app/components/ui/SettingsSection';
import { Dropdown } from '@/app/components/ui/Dropdown';
import RoleChangeSection from '@/app/components/settings/RoleChangeSection';
import { useAuth } from '../contexts/AuthContext';

// Import types from SettingsContext
type TextSize = 'small' | 'medium' | 'large' | 'xlarge';
type EnterKeyBehavior = 'newline' | 'speak' | 'clear' | 'speakAndClear';

// Import TTSSettings dynamically with SSR disabled
const TTSSettings = dynamic(() => import('../components/TTSSettings'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="animate-pulse h-6 w-48 bg-gradient-to-r from-surface-hover to-surface rounded-3xl"></div>
      <div className="animate-pulse h-4 w-full bg-gradient-to-r from-surface-hover to-surface rounded-3xl"></div>
      <div className="animate-pulse h-12 w-full bg-gradient-to-r from-surface-hover to-surface rounded-3xl"></div>
    </div>
  )
});

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until after hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="space-y-8">
            <div className="animate-pulse h-10 bg-gradient-to-r from-surface-hover to-surface rounded-3xl w-48"></div>
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-40 bg-gradient-to-r from-surface-hover to-surface rounded-3xl shadow-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Settings
          </h1>
          <p className="text-text-secondary">
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
              <div className="flex justify-end">
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
              <div className="flex justify-end">
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

          {/* Account Settings - Only show when logged in */}
          {user && (
            <SettingsSection
              title="Account"
              description="Manage your account settings"
            >
              <SettingsCard
                title="Your Role"
                description="Change how you use SayIt!"
                icon={<UserCircleIcon className="w-6 h-6" />}
              >
                <RoleChangeSection />
              </SettingsCard>
            </SettingsSection>
          )}
        </div>
      </div>
    </div>
  );
}
