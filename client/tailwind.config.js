/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF8F2',
          100: '#FEEDDE',
          200: '#FDD6BD',
          300: '#FBB78A',
          400: '#FA924F',
          500: '#FF7A00', // Specification Primary Orange
          600: '#F05A00', // Specification Dark Orange
          700: '#C94800',
          800: '#9E3700',
          900: '#752800',
        },
        navy: {
          950: '#060B14',
          900: '#0B1220', // Specification Navy
          850: '#0F182B',
          800: '#16223B',
          700: '#233458',
        },
        charcoal: {
          950: '#0A0E17',
          900: '#111827', // Specification Charcoal
          800: '#1F2937',
          700: '#374151',
          600: '#4B5563',
          500: '#64748B', // Specification Muted
        },
        canvas: '#F7F8FA', // Specification Background
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px -1px rgba(16, 24, 40, 0.04)',
        'brand': '0 4px 14px 0 rgba(255, 122, 0, 0.25)',
      },
    },
  },
  plugins: [],
};
