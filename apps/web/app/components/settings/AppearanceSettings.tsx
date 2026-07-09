'use client';

import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useAppearance } from '@/app/contexts/AppearanceContext';
import type { AppearanceTheme } from '@/lib/appearance';

const OPTIONS: Array<{
  value: AppearanceTheme;
  label: string;
  description: string;
  icon: typeof ComputerDesktopIcon;
}> = [
  { value: 'system', label: 'System', description: 'Match this device', icon: ComputerDesktopIcon },
  { value: 'light', label: 'Light', description: 'Light surfaces and dark text', icon: SunIcon },
  { value: 'dark', label: 'Dark', description: 'Dark surfaces and light text', icon: MoonIcon },
];

export default function AppearanceSettings() {
  const { theme, setTheme } = useAppearance();

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-foreground">Theme</legend>
      <p className="mt-1 text-sm text-text-secondary">Choose how SayIt! looks on this device.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(option.value)}
              className={`flex min-h-[72px] items-center gap-3 rounded-[var(--radius-control)] border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${selected ? 'border-primary-500 bg-[var(--accent-surface)] text-[var(--accent-foreground)]' : 'border-border bg-surface text-foreground hover:bg-surface-hover'}`}
            >
              <Icon className="h-6 w-6 shrink-0" />
              <span>
                <span className="block font-semibold">{option.label}</span>
                <span className="block text-xs text-text-secondary">{option.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
