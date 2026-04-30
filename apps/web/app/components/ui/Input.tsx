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
        className={`block w-full px-6 py-3 bg-surface border border-border rounded-3xl text-foreground text-base placeholder:text-text-tertiary shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:shadow-xl hover:shadow-lg transition-all duration-300 ${className}`}
      />
      {error && (
        <div className="mt-2 text-red-500 text-sm bg-status-error px-4 py-2 rounded-3xl">
          {error}
        </div>
      )}
    </div>
  );
} 