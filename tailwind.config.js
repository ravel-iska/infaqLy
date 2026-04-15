/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // User Theme
        'user': {
          'bg': '#F8FAF5',
          'bg-alt': '#F0FDF4',
          'card': '#FFFFFF',
          'accent': '#10B981',
          'accent-hover': '#059669',
          'accent-light': '#D1FAE5',
          'text': '#1E293B',
          'text-secondary': '#64748B',
          'text-muted': '#94A3B8',
          'border': '#E2E8F0',
        },
        // Admin Theme
        'admin': {
          'bg': '#0F172A',
          'bg-card': '#1E293B',
          'bg-sidebar': '#0B1120',
          'bg-hover': '#334155',
          'accent': '#6366F1',
          'accent-hover': '#818CF8',
          'accent-secondary': '#10B981',
          'text': '#F1F5F9',
          'text-secondary': '#94A3B8',
          'text-muted': '#64748B',
          'border': '#334155',
        },
        // Status colors
        'success': '#10B981',
        'warning': '#F59E0B',
        'danger': '#EF4444',
      },
      fontFamily: {
        'heading': ['Outfit', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'user': '12px',
        'user-lg': '16px',
        'admin': '8px',
        'admin-sm': '6px',
      },
      boxShadow: {
        'user': '0 4px 6px -1px rgba(0, 0, 0, 0.07)',
        'user-lg': '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        'admin': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'glow-indigo': '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'progress': 'progress 1.5s ease-out forwards',
        'count-up': 'countUp 2s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: false,
    base: false,
    styled: true,
    utils: true,
  },
}
