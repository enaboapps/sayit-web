import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './app/components/ui/input.css',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--background)',
          dark: '#0a0a0a',
        },
        foreground: {
          DEFAULT: 'var(--foreground)',
          dark: '#ededed',
        },
      },
    },
  },
  plugins: [
    forms,
  ],
};
export default config;
