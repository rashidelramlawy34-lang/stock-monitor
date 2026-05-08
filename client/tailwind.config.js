/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Iron Man / JARVIS palette
        hud: {
          bg:       '#020810',
          surface:  '#071220',
          card:     '#0a1828',
          border:   'rgba(0,212,255,0.18)',
        },
        arc:    '#00d4ff',   // arc reactor cyan
        repulsor: '#0066ff', // repulsor blue
        suit:   '#ff6b35',   // Iron Man orange-red
        gold:   '#ffa800',   // suit gold
        bull:   '#00e676',
        bear:   '#ff3355',
        warn:   '#ffaa00',
        accent: { DEFAULT: '#00d4ff', hover: '#00b8e6' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        hud:  ['"Orbitron"', '"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        arc:      '0 0 12px rgba(0,212,255,0.4), 0 0 24px rgba(0,212,255,0.15)',
        'arc-sm': '0 0 6px rgba(0,212,255,0.3)',
        'arc-lg': '0 0 30px rgba(0,212,255,0.5), 0 0 60px rgba(0,212,255,0.2)',
        suit:     '0 0 12px rgba(255,107,53,0.4)',
        card:     '0 2px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(0,212,255,0.05)',
      },
      backgroundImage: {
        'grid-hud': `
          linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid-hud': '40px 40px',
      },
      animation: {
        'pulse-arc': 'pulse-arc 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'scan':      'scan 3s linear infinite',
        'flicker':   'flicker 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-arc': {
          '0%,100%': { boxShadow: '0 0 8px rgba(0,212,255,0.4)' },
          '50%':     { boxShadow: '0 0 20px rgba(0,212,255,0.8), 0 0 40px rgba(0,212,255,0.3)' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%,100%': { opacity: 1 },
          '92%': { opacity: 1 },
          '93%': { opacity: 0.7 },
          '94%': { opacity: 1 },
          '96%': { opacity: 0.8 },
          '97%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
