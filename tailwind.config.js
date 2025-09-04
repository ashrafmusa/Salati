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
        primary: { 
          DEFAULT: '#007A33', // Primary Green
          dark: '#005c29',
        },
        secondary: { 
          DEFAULT: '#D21034', // Secondary Red
          dark: '#a60d29',
        },
        accent: { 
          DEFAULT: '#D21034', 
          hover: '#a60d29'
        },
        warmBeige: '#F5F5DC',
        charcoal: '#1A1A1A',
        admin: {
          primary: '#007A33',
          'primary-hover': '#005c29',
          bg: '#F5F5DC',
          sidebar: '#1A1A1A',
          'sidebar-hover': '#333333',
          'sidebar-text': '#f3f4f6',
        },
        status: {
          preparing: '#f59e0b', // amber-500
          delivering: '#3b82f6', // blue-500
          delivered: '#22c55e', // green-500
          cancelled: '#ef4444', // red-500
        }
      },
      fontFamily: {
        sans: ['Almarai', 'Lato', 'sans-serif'],
        display: ['Montserrat', 'Almarai', 'sans-serif'],
      },
      boxShadow: {
        'lg-up': '0 -10px 15px -3px rgb(0 0 0 / 0.1), 0 -4px 6px -4px rgb(0 0 0 / 0.1)',
        'glow-primary': '0 0 15px 0 rgb(0 122 51 / 0.4)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(5px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
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
        'slide-in-letter': {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'nudge-reveal': {
            '0%, 100%': { transform: 'scaleX(0)' },
            '20%, 80%': { transform: 'scaleX(1)' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-in-up': 'slideInUp 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards',
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
        'slide-in-letter': 'slide-in-letter 0.5s forwards',
        'nudge-reveal': 'nudge-reveal 4s ease-in-out',
      },
    },
  },
  plugins: [],
}