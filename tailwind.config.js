/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        'xs-tight': ['11px', { lineHeight: '16px' }],
      },
      fontFamily: {
        sans: ['Outfit-Regular', 'Outfit', 'Pyidaungsu', 'Noto Sans Myanmar', 'sans-serif'],
        'sans-medium': ['Outfit-Medium', 'Outfit', 'Pyidaungsu', 'sans-serif'],
        'sans-semibold': ['Outfit-SemiBold', 'Outfit', 'Pyidaungsu', 'sans-serif'],
        'sans-bold': ['Outfit-Bold', 'Outfit', 'Pyidaungsu', 'sans-serif'],
        mono: ['DMMono-Regular', 'monospace'],
        'mono-medium': ['DMMono-Medium', 'monospace'],
      },
      colors: {
        brand: {
          50: '#e4f1f3',
          100: '#c9e3e7',
          500: '#168a97',
          600: '#0d7480',
          700: '#0a5f69',
          800: '#094e56',
          900: '#073c43',
        },
        ledger: {
          bg: '#f7f9fa',
          surface: '#ecf0f2',
          ink: '#1f3038',
          muted: '#5d6b72',
          'dark-bg': '#16232a',
          'dark-card': '#1f3038',
          'dark-surface': '#24343d',
        },
        kbz: {
          DEFAULT: '#0052cc',
          light: '#e6f0ff',
          dark: '#003e99',
        },
        cash: {
          DEFAULT: '#14532d',
          light: '#e3f3ea',
          dark: '#86efac',
        },
      },
    },
  },
  plugins: [],
};
