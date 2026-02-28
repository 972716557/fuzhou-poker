/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Table surface
        felt: {
          DEFAULT: '#1a5c2e',
          light: '#1f6d36',
          dark: '#0f3d1d',
          border: '#2a7a3e',
        },
        // Accent gold
        gold: {
          DEFAULT: '#d4a843',
          light: '#e8c56a',
          dark: '#b8922f',
          muted: 'rgba(212, 168, 67, 0.15)',
        },
        // Surface system
        surface: {
          DEFAULT: '#111315',
          raised: '#1a1d21',
          overlay: '#22262b',
          card: '#2a2f36',
        },
        // Text system
        txt: {
          DEFAULT: '#e8eaed',
          secondary: '#9aa0a8',
          muted: '#5f666e',
          inverse: '#111315',
        },
        // Semantic
        accent: '#34d399',
        danger: '#f87171',
        warn: '#fbbf24',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"',
          '"PingFang SC"', '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
        mono: ['"SF Mono"', '"Fira Code"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.3)',
        'glass-lg': '0 8px 40px rgba(0, 0, 0, 0.4)',
        'glow-green': '0 0 20px rgba(52, 211, 153, 0.3)',
        'glow-gold': '0 0 20px rgba(212, 168, 67, 0.3)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'card-lg': '0 4px 16px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 8px rgba(52, 211, 153, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(52, 211, 153, 0.5)' },
        },
      },
    },
  },
  plugins: [],
}
