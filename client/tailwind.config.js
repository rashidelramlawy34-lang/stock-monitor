/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bull:  '#22c55e',
        bear:  '#ef4444',
        warn:  '#f59e0b',
        accent: { DEFAULT: '#3b82f6', hover: '#2563eb', light: '#eff6ff', dark: '#1e3a5f' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)',
        'card-md':  '0 4px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)',
        'card-dark':'0 4px 24px rgba(0,0,0,0.50)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
        'gradient-bull':   'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
        'gradient-bear':   'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
      },
    },
  },
  plugins: [],
};
