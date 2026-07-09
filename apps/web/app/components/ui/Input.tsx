import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={props.id} className="block text-foreground text-sm font-semibold mb-2">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`block min-h-[var(--control-height)] w-full rounded-[var(--radius-control)] border border-border bg-surface px-4 py-2.5 text-base text-foreground shadow-[var(--shadow-control)] placeholder:text-text-tertiary transition-[background-color,border-color,box-shadow] duration-[var(--motion-duration-standard)] hover:border-text-tertiary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
      />
      {error && (
        <div className="mt-2 rounded-[var(--radius-small)] bg-status-error px-4 py-2 text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
