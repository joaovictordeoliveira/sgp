import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0A1220',
          900: '#0E1A2E',
          800: '#152944',
          700: '#1E3A5F',
        },
        blue: {
          600: '#2C5AA0',
          500: '#3E72C0',
          400: '#6B9BD8',
        },
        slate: {
          500: '#5B6B82',
          300: '#94A3B5',
        },
        paper: {
          DEFAULT: '#F6F8FB',
          dim: '#EDF1F6',
        },
        ink: {
          DEFAULT: '#0F1826',
          soft: '#3D4A5C',
        },
        amber: '#D9A441',
        line: '#DDE4EC',
      },
      fontFamily: {
        display: ['Archivo', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
