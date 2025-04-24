import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={props.id} className="block text-gray-700 text-sm font-bold mb-2">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 ${className}`}
      />
      {error && (
        <div className="mt-1 text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
} 