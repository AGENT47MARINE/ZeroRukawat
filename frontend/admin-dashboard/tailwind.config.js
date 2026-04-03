/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        success: '#10B981', // green
        processing: '#F59E0B', // orange
        risk: '#EF4444', // red
        ai: '#3B82F6', // blue
        dark: '#0F172A',
        darker: '#0B0F19',
        card: '#1E293B'
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
