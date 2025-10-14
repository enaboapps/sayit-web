import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './app/components/ui/input.css',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--background)',
        },
        foreground: {
          DEFAULT: 'var(--foreground)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          hover: 'var(--surface-hover)',
        },
        border: {
          DEFAULT: 'var(--border)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        // Accessible high-contrast accent colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa', // Primary accent - 8:1 contrast on dark bg
          500: '#3b82f6', // Primary hover - 6.5:1 contrast
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        accent: {
          DEFAULT: '#06b6d4', // Cyan-500 - 7:1 contrast
          hover: '#0891b2',
        },
        success: {
          DEFAULT: '#10b981', // Emerald-500 - 5:1 contrast
          hover: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b', // Amber-500 - 6:1 contrast
          hover: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444', // Red-500 - 5.5:1 contrast
          hover: '#dc2626',
        },
        orange: {
          DEFAULT: '#ff9800', // Orange-500 - main accent for interactions
          hover: '#f57c00', // Orange-700 - darker hover
          active: '#e65100', // Orange-900 - darkest active/pressed
          light: '#ffb74d', // Orange-300 - lighter variant
        },
      },
    },
  },
  plugins: [
    forms,
  ],
};
export default config;
