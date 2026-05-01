'use client';

import { useSettings } from '../contexts/SettingsContext';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { version } from '../../package.json';
import {
  Cog6ToothIcon,
  SpeakerWaveIcon,
  UserCircleIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  RectangleStackIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import RoleChangeSection from '@/app/components/settings/RoleChangeSection';
import ImportedPackagesSection from '@/app/components/settings/ImportedPackagesSection';
import { useAuth } from '../contexts/AuthContext';
import BottomSheet from '@/app/components/ui/BottomSheet';
import { Dropdown } from '@/app/components/ui/Dropdown';
import { Slider } from '@/app/components/ui/Slider';
import { Switch } from '@/app/components/ui/Switch';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { UserButton } from '@clerk/nextjs';
import type { AacLayoutPreset } from '@/lib/aacLayout';

// Import types from SettingsContext
type EnterKeyBehavior = 'newline' | 'speak' | 'clear' | 'speakAndClear';
type MessageCaptureMode = 'disabled' | 'clearOnly' | 'speakOnly' | 'speakAndClearOnly' | 'speakAny';

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
      <div className="flex-shrink-0 text-primary-500 bg-surface-hover p-3 rounded-2xl">
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

  const enterKeyOptions = [
    { value: 'newline' as EnterKeyBehavior, label: 'New Line' },
    { value: 'speak' as EnterKeyBehavior, label: 'Speak Text' },
    { value: 'clear' as EnterKeyBehavior, label: 'Clear Text' },
    { value: 'speakAndClear' as EnterKeyBehavior, label: 'Speak & Clear' },
  ];
  const doubleEnterTimeoutSeconds = Math.round(settings.doubleEnterTimeoutMs / 1000);
  const messageCaptureOptions = [
    { value: 'disabled' as MessageCaptureMode, label: 'Off' },
    { value: 'clearOnly' as MessageCaptureMode, label: 'On Clear' },
    { value: 'speakOnly' as MessageCaptureMode, label: 'On Speak Only' },
    { value: 'speakAndClearOnly' as MessageCaptureMode, label: 'On Speak & Clear Only' },
    { value: 'speakAny' as MessageCaptureMode, label: 'On Speak or Speak & Clear' },
  ];
  const aacGridPresetOptions = [
    { value: 'largeAccess16' as AacLayoutPreset, label: 'Large Access 16' },
    { value: 'standard36' as AacLayoutPreset, label: 'Standard 36' },
    { value: 'dense48' as AacLayoutPreset, label: 'Dense 48' },
  ];

  // Mobile layout with categories
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-bottom-stack">
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
            />

            <SettingsCategory
              icon={<Cog6ToothIcon className="w-6 h-6" />}
              title="AI Suggestions"
              description="Next reply suggestions and message capture"
              onClick={() => setActiveSheet('ai')}
            />

            {/* Phrase Bar */}
            <SettingsCategory
              icon={<RectangleStackIcon className="w-6 h-6" />}
              title="Phrase Bar"
              description="Build sentences from phrase tiles"
              onClick={() => setActiveSheet('phraseBar')}
              value={settings.usePhraseBar ? 'On' : 'Off'}
            />

            {/* Imported AAC vocabularies — only when signed in (the underlying
                query is auth-gated and would just return []) */}
            {user && (
              <SettingsCategory
                icon={<ArrowDownTrayIcon className="w-6 h-6" />}
                title="Imported AAC vocabularies"
                description="Manage packages imported from .obf or .obz files"
                onClick={() => setActiveSheet('importedPackages')}
              />
            )}

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

        <BottomSheet
          isOpen={activeSheet === 'ai'}
          onClose={() => setActiveSheet(null)}
          title="AI Suggestions"
          snapPoints={[60, 80]}
        >
          <div className="p-4 space-y-6">
            <Switch
              label="Reply Suggestions"
              description="Show AI-generated likely next replies near the composer"
              checked={settings.aiReplySuggestionsEnabled}
              onChange={(value) => updateSetting('aiReplySuggestionsEnabled', value)}
            />
            <Dropdown
              label="Capture Completed Messages"
              description="Choose which completed messages can be used for suggestions"
              options={messageCaptureOptions}
              value={settings.messageCaptureMode}
              onChange={(value) => updateSetting('messageCaptureMode', value)}
            />
          </div>
        </BottomSheet>

        {/* Phrase Bar Sheet */}
        <BottomSheet
          isOpen={activeSheet === 'phraseBar'}
          onClose={() => setActiveSheet(null)}
          title="Phrase Bar"
          snapPoints={[60, 80]}
        >
          <div className="p-4 space-y-6">
            <Switch
              label="Phrase Bar"
              description="When enabled, tapping a phrase adds it to the Phrase Bar instead of speaking immediately."
              checked={settings.usePhraseBar}
              onChange={(value) => updateSetting('usePhraseBar', value)}
            />
            <Switch
              label="Speak on tap"
              description="Also speak each phrase as it's added to the bar."
              checked={settings.speakPhrasesOnTap}
              onChange={(value) => updateSetting('speakPhrasesOnTap', value)}
              disabled={!settings.usePhraseBar}
            />
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
            <Slider
              label="Text Size"
              min={8}
              max={72}
              step={2}
              value={settings.textSize}
              onChange={(value) => updateSetting('textSize', value)}
              valueLabel={(v) => `${v}px`}
            />
            <Dropdown
              label="Enter Key Behavior"
              options={enterKeyOptions}
              value={settings.enterKeyBehavior}
              onChange={(value) => updateSetting('enterKeyBehavior', value)}
            />
            <Dropdown
              label="AAC Grid Preset"
              description="Default layout when creating AAC core boards"
              options={aacGridPresetOptions}
              value={settings.aacGridPresetPreference}
              onChange={(value) => updateSetting('aacGridPresetPreference', value)}
            />
            <Switch
              label="Double-Enter"
              description="Press Enter twice to trigger an action"
              checked={settings.doubleEnterEnabled}
              onChange={(value) => updateSetting('doubleEnterEnabled', value)}
            />
            <Dropdown
              label="Double-Enter Action"
              options={enterKeyOptions}
              value={settings.doubleEnterAction}
              onChange={(value) => updateSetting('doubleEnterAction', value)}
              disabled={!settings.doubleEnterEnabled}
            />
            <Slider
              label="Double-Enter Timeout"
              description="Time window to press Enter twice"
              min={1}
              max={10}
              step={1}
              value={doubleEnterTimeoutSeconds}
              onChange={(value) => updateSetting('doubleEnterTimeoutMs', value * 1000)}
              valueLabel={(v) => `${v}s`}
              disabled={!settings.doubleEnterEnabled}
            />
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
            {/* User Account Section */}
            <div className="flex items-center gap-4 bg-surface-hover rounded-2xl p-4 mb-6">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-12 h-12 rounded-full'
                  }
                }}
              />
              <div>
                <p className="font-semibold text-foreground">Signed In</p>
                <p className="text-sm text-text-secondary">Tap avatar to manage account</p>
              </div>
            </div>

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
              <p className="text-sm text-text-secondary mt-1">Version {version}</p>
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

        {/* Imported AAC vocabularies sheet */}
        <BottomSheet
          isOpen={activeSheet === 'importedPackages'}
          onClose={() => setActiveSheet(null)}
          title="Imported AAC vocabularies"
          snapPoints={[60, 90]}
        >
          <div className="p-4">
            <ImportedPackagesSection variant="sheet" />
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
                    <div className="flex-shrink-0 text-primary-500 bg-surface-hover p-3 rounded-3xl">
                      <Cog6ToothIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Text Size</h3>
                      <p className="text-sm text-text-secondary mt-1">Adjust the size of text in the typing area</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Slider
                      min={8}
                      max={72}
                      step={2}
                      value={settings.textSize}
                      onChange={(value) => updateSetting('textSize', value)}
                      valueLabel={(v) => `${v}px`}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-3xl shadow-2xl hover:shadow-3xl overflow-hidden transition-all duration-300">
                <div className="px-8 py-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex-shrink-0 text-primary-500 bg-surface-hover p-3 rounded-3xl">
                      <Cog6ToothIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Enter Key Behavior</h3>
                      <p className="text-sm text-text-secondary mt-1">Choose what happens when you press Enter</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Dropdown
                      options={enterKeyOptions}
                      value={settings.enterKeyBehavior}
                      onChange={(value) => updateSetting('enterKeyBehavior', value)}
                      className="w-48"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-3xl shadow-2xl hover:shadow-3xl overflow-hidden transition-all duration-300">
                <div className="px-8 py-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex-shrink-0 text-primary-500 bg-surface-hover p-3 rounded-3xl">
                      <Cog6ToothIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Double-Enter</h3>
                      <p className="text-sm text-text-secondary mt-1">Press Enter twice to trigger an action</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Switch
                      label="Enabled"
                      checked={settings.doubleEnterEnabled}
                      onChange={(value) => updateSetting('doubleEnterEnabled', value)}
                    />
                    <Dropdown
                      label="Action"
                      options={enterKeyOptions}
                      value={settings.doubleEnterAction}
                      onChange={(value) => updateSetting('doubleEnterAction', value)}
                      disabled={!settings.doubleEnterEnabled}
                    />
                    <Dropdown
                      label="AAC Grid Preset"
                      options={aacGridPresetOptions}
                      value={settings.aacGridPresetPreference}
                      onChange={(value) => updateSetting('aacGridPresetPreference', value)}
                    />
                  </div>
                  <div className="mt-6">
                    <Slider
                      label="Timeout"
                      description="Time window to press Enter twice"
                      min={1}
                      max={10}
                      step={1}
                      value={doubleEnterTimeoutSeconds}
                      onChange={(value) => updateSetting('doubleEnterTimeoutMs', value * 1000)}
                      valueLabel={(v) => `${v}s`}
                      disabled={!settings.doubleEnterEnabled}
                    />
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
                  <div className="flex-shrink-0 text-primary-500 bg-surface-hover p-3 rounded-3xl">
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

          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">AI Suggestions</h2>
              <p className="text-sm text-text-secondary mt-1">Control next reply suggestions and message capture</p>
            </div>
            <div className="bg-surface rounded-3xl shadow-2xl hover:shadow-3xl overflow-hidden transition-all duration-300">
              <div className="px-8 py-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-shrink-0 text-primary-500 bg-surface-hover p-3 rounded-3xl">
                    <Cog6ToothIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Reply Suggestions</h3>
                    <p className="text-sm text-text-secondary mt-1">Use recent completed messages to suggest likely next replies</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Switch
                    label="Enabled"
                    checked={settings.aiReplySuggestionsEnabled}
                    onChange={(value) => updateSetting('aiReplySuggestionsEnabled', value)}
                  />
                  <Dropdown
                    label="Capture Completed Messages"
                    options={messageCaptureOptions}
                    value={settings.messageCaptureMode}
                    onChange={(value) => updateSetting('messageCaptureMode', value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Phrase Bar Settings */}
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Phrase Bar</h2>
              <p className="text-sm text-text-secondary mt-1">Build sentences from phrase tiles before speaking</p>
            </div>
            <div className="bg-surface rounded-3xl shadow-2xl hover:shadow-3xl overflow-hidden transition-all duration-300">
              <div className="px-8 py-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-shrink-0 text-primary-500 bg-surface-hover p-3 rounded-3xl">
                    <RectangleStackIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Phrase Bar</h3>
                    <p className="text-sm text-text-secondary mt-1">
                      When enabled, tapping a phrase adds a chip to the bar instead of speaking.
                      Use Speak all to say the whole sentence.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Switch
                    label="Phrase Bar"
                    description="Tap a phrase to add it to the bar instead of speaking immediately"
                    checked={settings.usePhraseBar}
                    onChange={(value) => updateSetting('usePhraseBar', value)}
                  />
                  <Switch
                    label="Speak on tap"
                    description="Also speak each phrase as it's added"
                    checked={settings.speakPhrasesOnTap}
                    onChange={(value) => updateSetting('speakPhrasesOnTap', value)}
                    disabled={!settings.usePhraseBar}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Imported AAC vocabularies — only when signed in (the underlying
              query is auth-gated and would just return []) */}
          {user && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Imported AAC vocabularies</h2>
                <p className="text-sm text-text-secondary mt-1">Manage packages imported from .obf or .obz files</p>
              </div>
              <div className="bg-surface rounded-3xl shadow-2xl hover:shadow-3xl overflow-hidden transition-all duration-300">
                <div className="px-8 py-6">
                  <ImportedPackagesSection variant="desktop" />
                </div>
              </div>
            </section>
          )}

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
                    <div className="flex-shrink-0 text-primary-500 bg-surface-hover p-3 rounded-3xl">
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
