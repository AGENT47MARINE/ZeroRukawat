/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic palette
        success: { DEFAULT: '#10B981', light: '#D1FAE5', dark: '#059669' },
        processing: { DEFAULT: '#F59E0B', light: '#FEF3C7', dark: '#D97706' },
        risk: { DEFAULT: '#EF4444', light: '#FEE2E2', dark: '#DC2626' },
        ai: { DEFAULT: '#6366F1', light: '#E0E7FF', dark: '#4F46E5' },

        // Surface system
        surface: {
          '0': '#09090B',
          '1': '#0F1117',
          '2': '#161821',
          '3': '#1E2030',
          '4': '#272A3A',
        },
        // Border (renamed to avoid conflict with Tailwind's border utility)
        bdr: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          hover: 'rgba(255,255,255,0.12)',
          active: 'rgba(255,255,255,0.20)',
        },
        // Text
        txt: {
          primary: '#F4F4F5',
          secondary: '#A1A1AA',
          tertiary: '#71717A',
          muted: '#52525B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display': ['2.25rem', { lineHeight: '2.75rem', fontWeight: '800' }],
        'headline': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        'title': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'body': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
        'overline': ['0.6875rem', { lineHeight: '1rem', fontWeight: '600', letterSpacing: '0.05em' }],
      },
      spacing: {
        '18': '4.5rem',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      boxShadow: {
        'glow-ai': '0 0 20px rgba(99,102,241,0.15)',
        'glow-success': '0 0 20px rgba(16,185,129,0.15)',
        'glow-risk': '0 0 20px rgba(239,68,68,0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
      },
      keyframes: {
        'slide-particle': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(1200%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-particle': 'slide-particle 2s linear infinite',
        'fade-up': 'fade-up 0.4s ease-out',
      },
      transitionTimingFunction: {
        'bounce-sm': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
