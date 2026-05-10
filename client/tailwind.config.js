/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Aura semantic tokens
        gain:   '#4ade80',
        loss:   '#f87171',
        warn:   '#fbbf24',
        // Legacy aliases for existing components
        bull:   '#4ade80',
        bear:   '#f87171',

        // ShadCN token names mapped to Aura values so ShadCN components compile
        background: '#06081a',
        foreground:  '#eaecff',
        card: {
          DEFAULT:    'rgba(15,22,50,0.55)',
          foreground: '#eaecff',
        },
        popover: {
          DEFAULT:    'rgba(15,22,50,0.85)',
          foreground: '#eaecff',
        },
        primary: {
          DEFAULT:    '#7c5cff',
          foreground: '#eaecff',
        },
        secondary: {
          DEFAULT:    'rgba(28,36,70,0.65)',
          foreground: '#eaecff',
        },
        muted: {
          DEFAULT:    'rgba(28,36,70,0.65)',
          foreground: '#7e85b8',
        },
        accent: {
          DEFAULT:    '#7c5cff',
          foreground: '#eaecff',
          hover:      '#6a47ff',
        },
        destructive: '#f87171',
        border:      'rgba(160,180,255,0.10)',
        input:       'rgba(28,36,70,0.65)',
        ring:        '#7c5cff',
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
