/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        noir: {
          950: '#0a0a0b',
          900: '#111113',
          850: '#161619',
          800: '#1c1c20',
          700: '#2a2a30',
          600: '#3a3a42',
          500: '#5a5a65',
        },
        amber: {
          300: '#d97706',
          400: '#b45309',
          500: '#92400e',
          600: '#78350f',
        },
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
        },
        crystal: {
          light: 'rgba(255, 255, 255, 0.08)',
          medium: 'rgba(255, 255, 255, 0.12)',
          bright: 'rgba(255, 255, 255, 0.18)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'crystal': '0 0 0 1px rgba(255, 255, 255, 0.05), 0 4px 24px -4px rgba(0, 0, 0, 0.5)',
        'crystal-hover': '0 0 0 1px rgba(180, 83, 9, 0.3), 0 8px 32px -4px rgba(0, 0, 0, 0.6)',
        'glow-amber': '0 0 20px -5px rgba(180, 83, 9, 0.5)',
        'glow-teal': '0 0 20px -5px rgba(45, 212, 191, 0.4)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.4s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
