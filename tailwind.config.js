/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./admin.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          hover: 'rgb(var(--color-secondary-hover) / <alpha-value>)'
        },
        charcoal: '#1A1A1A',
        admin: {
          primary: '#007A33',
          'primary-hover': '#005c29',
          sidebar: '#1A1A1A',
          'sidebar-hover': '#333333',
          'sidebar-text': '#f3f4f6',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Almarai', 'sans-serif'],
        display: ['var(--font-display)', 'Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'lg-up': '0 -10px 15px -3px rgb(0 0 0 / 0.1), 0 -4px 6px -4px rgb(0 0 0 / 0.1)',
        'glow-primary': '0 0 15px 0 rgb(var(--color-primary) / 0.4)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(5px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        staggerIn: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        gradientBg: { '0%, 100%': { 'background-position': '0% 50%' }, '50%': { 'background-position': '100% 50%' } },
        formEntry: { 'from': { opacity: '0', transform: 'scale(0.95) translateY(20px)' }, 'to': { opacity: '1', transform: 'scale(1) translateY(0)' } },
        twinkle: { '0%, 100%': { opacity: '0.5', transform: 'scale(0.8)' }, '50%': { opacity: '1', transform: 'scale(1)' } },
        bannerContentIn: {
          'from': { opacity: '0', transform: 'translateY(1rem)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'ken-burns': {
          '0%': { transform: 'scale(1) translate(0, 0)', 'transform-origin': 'center' },
          '100%': { transform: 'scale(1.1) translate(-1%, 1%)', 'transform-origin': 'center' },
        },
        'pulse-urgent': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.9' },
        },
        'toast-in': {
          'from': { transform: 'translateX(100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'toast-out': {
          'from': { transform: 'translateX(0)', opacity: '1' },
          'to': { transform: 'translateX(100%)', opacity: '0' },
        },
        'progress': {
          'from': { width: '100%' },
          'to': { width: '0%' },
        },
        'whatsapp-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.7)' },
          '70%': { boxShadow: '0 0 0 10px rgba(34, 197, 94, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)' }
        },
        'draw-chart': {
          'to': { 'stroke-dashoffset': '0' },
        },
        'fade-in-chart': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'slide-in-letter': {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'nudge-reveal': {
            '0%, 100%': { transform: 'scaleX(0)' },
            '20%, 80%': { transform: 'scaleX(1)' },
        },
        'progress-bar-fill': {
          'from': { transform: 'scaleX(0)' },
          'to': { transform: 'scaleX(1)' },
        },
        'jiggle': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-in-up': 'slideInUp 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        'stagger-in': 'staggerIn 0.4s ease-out backwards',
        'gradient-bg': 'gradientBg 20s ease infinite',
        'form-entry': 'formEntry 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        'twinkle': 'twinkle 2s infinite ease-in-out',
        'banner-content-in': 'bannerContentIn 0.8s 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        'ken-burns': 'ken-burns 8s ease-out infinite alternate',
        'pulse-urgent': 'pulse-urgent 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'toast-in': 'toast-in 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        'toast-out': 'toast-out 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        'progress': 'progress 5s linear forwards',
        'whatsapp-pulse': 'whatsapp-pulse 2s infinite',
        'draw-chart': 'draw-chart 2s 0.5s ease-out forwards',
        'fade-in-chart': 'fade-in-chart 0.5s ease-out forwards',
        'slide-in-letter': 'slide-in-letter 0.5s forwards',
        'nudge-reveal': 'nudge-reveal 4s ease-in-out',
        'progress-bar-fill': 'progress-bar-fill 1.5s ease-out forwards',
        'jiggle': 'jiggle 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
}
