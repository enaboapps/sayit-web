'use client';

import { cn } from '@/lib/utils';

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}: SwitchProps) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-semibold text-foreground mb-2">{label}</label>}
      {description && <p className="text-sm text-text-secondary mb-2">{description}</p>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative w-full py-3 pl-6 pr-10 text-left bg-surface border border-border rounded-3xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:shadow-xl text-base transition-all duration-300',
          disabled && 'opacity-50 cursor-not-allowed bg-surface-hover'
        )}
        disabled={disabled}
      >
        <span className="block truncate text-foreground">{checked ? 'On' : 'Off'}</span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-4">
          <span
            className={cn(
              'relative inline-flex h-7 w-12 items-center rounded-full border border-border transition-colors',
              checked ? 'bg-primary-500' : 'bg-surface-hover'
            )}
          >
            <span
              className={cn(
                'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                checked ? 'translate-x-5' : 'translate-x-1'
              )}
            />
          </span>
        </span>
      </button>
    </div>
  );
}
