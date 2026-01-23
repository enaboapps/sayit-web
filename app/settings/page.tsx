'use client';

import { useSettings } from '../contexts/SettingsContext';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Cog6ToothIcon,
  SpeakerWaveIcon,
  UserCircleIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import RoleChangeSection from '@/app/components/settings/RoleChangeSection';
import { useAuth } from '../contexts/AuthContext';
import BottomSheet from '@/app/components/ui/BottomSheet';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

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

interface SettingsCategoryProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  value?: string;
}

function SettingsCategory({ icon, title, description, onClick, value }: SettingsCategoryProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-surface rounded-2xl hover:bg-surface-hover transition-all active:scale-[0.98]"
    >
      <div className="flex-shrink-0 text-primary-500 bg-primary-500/10 p-3 rounded-2xl">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-text-tertiary">{value}</span>}
        <ChevronRightIcon className="w-5 h-5 text-text-tertiary" />
      </div>
    </button>
  );
}

interface OptionButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function OptionButton({ label, selected, onClick }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-2xl text-left font-medium transition-all ${
        selected
          ? 'bg-primary-500 text-white'
          : 'bg-surface-hover text-foreground hover:bg-surface'
      }`}
    >
      {label}
    </button>
  );
}

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  // Sheet states
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until after hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="space-y-4">
            <div className="animate-pulse h-10 bg-gradient-to-r from-surface-hover to-surface rounded-3xl w-48"></div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse h-20 bg-gradient-to-r from-surface-hover to-surface rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const textSizeLabels: Record<TextSize, string> = {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    xlarge: 'Extra Large'
  };

  const enterKeyLabels: Record<EnterKeyBehavior, string> = {
    newline: 'New Line',
    speak: 'Speak Text',
    clear: 'Clear Text',
    speakAndClear: 'Speak & Clear'
  };

  // Mobile layout with categories
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="p-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            {/* Voice & Speech */}
            <SettingsCategory
              icon={<SpeakerWaveIcon className="w-6 h-6" />}
              title="Voice & Speech"
              description="TTS provider, voice selection"
              onClick={() => setActiveSheet('voice')}
            />

            {/* Text & Display */}
            <SettingsCategory
              icon={<DocumentTextIcon className="w-6 h-6" />}
              title="Text & Display"
              description="Font size, enter key behavior"
              onClick={() => setActiveSheet('text')}
              value={textSizeLabels[settings.textSize]}
            />

            {/* Account - only when logged in */}
            {user && (
              <SettingsCategory
                icon={<UserCircleIcon className="w-6 h-6" />}
                title="Account"
                description="Profile, role settings"
                onClick={() => setActiveSheet('account')}
              />
            )}

            {/* About */}
            <SettingsCategory
              icon={<InformationCircleIcon className="w-6 h-6" />}
              title="About"
              description="Version, support, privacy"
              onClick={() => setActiveSheet('about')}
            />
          </div>
        </div>

        {/* Voice & Speech Sheet */}
        <BottomSheet
          isOpen={activeSheet === 'voice'}
          onClose={() => setActiveSheet(null)}
          title="Voice & Speech"
          snapPoints={[70, 90]}
          initialSnap={1}
        >
          <div className="p-4">
            <TTSSettings />
          </div>
        </BottomSheet>

        {/* Text & Display Sheet */}
        <BottomSheet
          isOpen={activeSheet === 'text'}
          onClose={() => setActiveSheet(null)}
          title="Text & Display"
          snapPoints={[60, 80]}
        >
          <div className="p-4 space-y-6">
            {/* Text Size */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Text Size</h3>
              <div className="grid grid-cols-2 gap-2">
                {(['small', 'medium', 'large', 'xlarge'] as TextSize[]).map((size) => (
                  <OptionButton
                    key={size}
                    label={textSizeLabels[size]}
                    selected={settings.textSize === size}
                    onClick={() => updateSetting('textSize', size)}
                  />
                ))}
              </div>
            </div>

            {/* Enter Key Behavior */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Enter Key Behavior</h3>
              <div className="space-y-2">
                {(['newline', 'speak', 'clear', 'speakAndClear'] as EnterKeyBehavior[]).map((behavior) => (
                  <OptionButton
                    key={behavior}
                    label={enterKeyLabels[behavior]}
                    selected={settings.enterKeyBehavior === behavior}
                    onClick={() => updateSetting('enterKeyBehavior', behavior)}
                  />
                ))}
              </div>
            </div>
          </div>
        </BottomSheet>

        {/* Account Sheet */}
        <BottomSheet
          isOpen={activeSheet === 'account'}
          onClose={() => setActiveSheet(null)}
          title="Account"
          snapPoints={[50, 70]}
        >
          <div className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Your Role</h3>
            <p className="text-sm text-text-secondary mb-4">Change how you use SayIt!</p>
            <RoleChangeSection />
          </div>
        </BottomSheet>

        {/* About Sheet */}
        <BottomSheet
          isOpen={activeSheet === 'about'}
          onClose={() => setActiveSheet(null)}
          title="About"
          snapPoints={[50, 70]}
        >
          <div className="p-4 space-y-4">
            <div className="bg-surface-hover rounded-2xl p-4">
              <h3 className="font-semibold text-foreground">SayIt!</h3>
              <p className="text-sm text-text-secondary mt-1">Version 1.21.0</p>
            </div>

            <a
              href="/support"
              className="block w-full p-4 bg-surface-hover rounded-2xl text-foreground font-medium hover:bg-surface transition-all"
            >
              Support & Help
            </a>

            <a
              href="/privacy"
              className="block w-full p-4 bg-surface-hover rounded-2xl text-foreground font-medium hover:bg-surface transition-all"
            >
              Privacy Policy
            </a>
          </div>
        </BottomSheet>
      </div>
    );
  }

  // Desktop layout (existing)
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
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Text & Behavior</h2>
              <p className="text-sm text-text-secondary mt-1">Configure text size and input behavior</p>
            </div>
            <div className="space-y-4">
              <div className="bg-surface rounded-3xl shadow-2xl hover:shadow-3xl overflow-hidden transition-all duration-300">
                <div className="px-8 py-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex-shrink-0 text-primary-500 bg-primary-500/10 p-3 rounded-3xl">
                      <Cog6ToothIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Text Size</h3>
                      <p className="text-sm text-text-secondary mt-1">Adjust the size of text in the typing area</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <select
                      value={settings.textSize}
                      onChange={(e) => updateSetting('textSize', e.target.value as TextSize)}
                      className="w-48 bg-surface-hover text-foreground rounded-2xl px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="xlarge">Extra Large</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-3xl shadow-2xl hover:shadow-3xl overflow-hidden transition-all duration-300">
                <div className="px-8 py-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex-shrink-0 text-primary-500 bg-primary-500/10 p-3 rounded-3xl">
                      <Cog6ToothIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Enter Key Behavior</h3>
                      <p className="text-sm text-text-secondary mt-1">Choose what happens when you press Enter</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <select
                      value={settings.enterKeyBehavior}
                      onChange={(e) => updateSetting('enterKeyBehavior', e.target.value as EnterKeyBehavior)}
                      className="w-48 bg-surface-hover text-foreground rounded-2xl px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    >
                      <option value="newline">New Line</option>
                      <option value="speak">Speak Text</option>
                      <option value="clear">Clear Text</option>
                      <option value="speakAndClear">Speak & Clear Text</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Text-to-Speech Settings */}
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Text-to-Speech</h2>
              <p className="text-sm text-text-secondary mt-1">Configure voice and speech settings</p>
            </div>
            <div className="bg-surface rounded-3xl shadow-2xl hover:shadow-3xl overflow-hidden transition-all duration-300">
              <div className="px-8 py-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-shrink-0 text-primary-500 bg-primary-500/10 p-3 rounded-3xl">
                    <SpeakerWaveIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Voice Settings</h3>
                    <p className="text-sm text-text-secondary mt-1">Choose your preferred text-to-speech voice</p>
                  </div>
                </div>
                <TTSSettings />
              </div>
            </div>
          </section>

          {/* Account Settings - Only show when logged in */}
          {user && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Account</h2>
                <p className="text-sm text-text-secondary mt-1">Manage your account settings</p>
              </div>
              <div className="bg-surface rounded-3xl shadow-2xl hover:shadow-3xl overflow-hidden transition-all duration-300">
                <div className="px-8 py-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex-shrink-0 text-primary-500 bg-primary-500/10 p-3 rounded-3xl">
                      <UserCircleIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Your Role</h3>
                      <p className="text-sm text-text-secondary mt-1">Change how you use SayIt!</p>
                    </div>
                  </div>
                  <RoleChangeSection />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
