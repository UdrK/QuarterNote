/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Consolas"', '"Courier New"', 'Monaco', 'monospace'],
        sans: ['"Consolas"', '"Courier New"', 'Monaco', 'monospace'],
      },
      colors: {
        bbs: {
          bg: '#000000',
          dark: '#080808',
          panel: '#0d0d0d',
          card: '#111111',
          border: '#2a2a2a',
          borderLight: '#444444',
          yellow: '#ffff00',
          cyan: '#00ffff',
          green: '#00ff66',
          red: '#ff3366',
          blue: '#003366',
          dim: '#888888',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#00ffff',
          500: '#00ffff',
          600: '#00cccc',
          700: '#009999',
          800: '#006666',
          900: '#003333',
        },
      },
    },
  },
  plugins: [],
};
