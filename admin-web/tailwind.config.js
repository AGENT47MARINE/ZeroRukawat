/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9fe',
          200: '#c1d3fe',
          300: '#a2bdfe',
          400: '#83a7fd',
          500: '#6491fd',
          600: '#5074ca',
          700: '#3c5797',
          800: '#283a64',
          900: '#141d32',
        },
        secondary: {
          50: '#fff9eb',
          100: '#fff3d7',
          200: '#ffe7af',
          300: '#ffdb87',
          400: '#ffcf5f',
          500: '#ffc337',
          600: '#cc9c2c',
          700: '#997521',
          800: '#664e16',
          900: '#33270b',
        },
      },
    },
  },
  plugins: [],
}
