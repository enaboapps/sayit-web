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
    screens: {
      'xs': '375px',   // Small phones
      'sm': '480px',   // Large phones
      'md': '768px',   // Tablets
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Large desktop
      '2xl': '1536px', // Extra large
    },
    extend: {
      spacing: {
        // Consistent spacing scale
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '18': '72px',
        '20': '80px',
        // Safe area values
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
      },
      height: {
        'screen-dvh': '100dvh',
        'screen-svh': '100svh',
        'screen-lvh': '100lvh',
      },
      minHeight: {
        'screen-dvh': '100dvh',
        'screen-svh': '100svh',
      },
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
        // Solid status backgrounds (replacing transparent versions)
        status: {
          error: '#2a1215',      // Dark red background
          warning: '#2a1f0a',    // Dark amber background
          success: '#0a2a1a',    // Dark green background
          info: '#0a1a2a',       // Dark blue background
          purple: '#1a0a2a',     // Dark purple background
        },
        // Overlay/backdrop solid color
        overlay: '#0a0a0a',     // Near-black for modals
      },
    },
  },
  plugins: [
    forms,
  ],
};
export default config;
