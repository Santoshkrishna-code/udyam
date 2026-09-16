/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Core Udyam Orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        dark: {
          900: '#0b0f17',
          850: '#101726',
          800: '#1e293b',
          700: '#334155',
        },
      },
      boxShadow: {
        'brand': '0 10px 25px -5px rgba(249, 115, 22, 0.25), 0 8px 10px -6px rgba(249, 115, 22, 0.2)',
        'brand-lg': '0 20px 30px -10px rgba(249, 115, 22, 0.35)',
      },
    },
  },
  plugins: [],
};
