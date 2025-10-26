/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a5f3f',
          50: '#f0f9f4',
          100: '#daf2e4',
          200: '#b8e4cd',
          300: '#88d0ad',
          400: '#54b487',
          500: '#329968',
          600: '#237b52',
          700: '#1a5f3f',
          800: '#184d35',
          900: '#15402d',
        },
        secondary: {
          DEFAULT: '#2d8659',
          light: '#4db87f',
          dark: '#1a5f3f',
        },
      },
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
        quran: ['Amiri Quran', 'serif'],
      },
    },
  },
  plugins: [],
}