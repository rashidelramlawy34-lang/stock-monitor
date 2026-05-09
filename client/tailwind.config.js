/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic — maps to CSS vars at runtime
        gain:   '#16a34a',
        loss:   '#dc2626',
        warn:   '#d97706',
        accent: { DEFAULT: '#2563eb', hover: '#1d4ed8' },
        // Legacy aliases — old components use text-bull / text-bear Tailwind classes
        bull:   '#16a34a',
        bear:   '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
