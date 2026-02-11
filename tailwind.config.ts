import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        'x-blue': '#1d9bf0',
        'x-blue-hover': '#1a8cd8',
        'x-blue-active': '#1577b8',
        'x-text': '#0f1419',
        'x-text-secondary': '#536471',
        'x-text-muted': '#a0a8b0',
        'x-border': '#eff3f4',
        'x-border-dark': '#2f3336',
        'x-bg-dark': '#16181c',
        'x-text-dark': '#e7e9ea',
        'x-text-dark-secondary': '#71767b',
        'x-error': '#f4212e',
        'x-success': '#00ba7c',
        'score-high-bg': '#d4edda',
        'score-high-text': '#155724',
        'score-mid-bg': '#fff3cd',
        'score-mid-text': '#856404',
        'score-low-bg': '#f8d7da',
        'score-low-text': '#721c24',
        'score-high-bg-dark': '#1e4620',
        'score-high-text-dark': '#a3d9a5',
        'score-mid-bg-dark': '#4a3c10',
        'score-mid-text-dark': '#f0d060',
        'score-low-bg-dark': '#4a1c1e',
        'score-low-text-dark': '#f0a0a5',
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-in forwards',
        spin: 'spin 0.7s linear infinite',
      },
      keyframes: {
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-out': {
          to: { opacity: '0', transform: 'translateY(16px) scale(0.97)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
