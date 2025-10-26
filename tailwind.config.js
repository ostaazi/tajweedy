/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        amiri: ['Amiri', 'serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#1e7850',
          dark: '#155c3e',
          light: '#2a9d68',
          50: '#f0fdf4',
          100: '#dcfce7',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(30, 120, 80, 0.1), 0 2px 4px -1px rgba(30, 120, 80, 0.06)',
        'card-hover': '0 20px 25px -5px rgba(30, 120, 80, 0.1), 0 10px 10px -5px rgba(30, 120, 80, 0.04)',
      },
    },
  },
  plugins: [],
};
