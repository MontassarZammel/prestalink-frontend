/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#D9A5A5', dark: '#C48C8C', light: 'rgba(217,165,165,0.12)', lt: '#E8DCD5', 50: '#FFF5F5', 100: '#FFE8E8', 200: '#F5EDEA', 300: '#E8DCD5', 400: '#D9A5A5', 500: '#C48C8C', 600: '#B07070', 700: '#8B4A4A', 900: '#5A2A2A' },
        gold:     { DEFAULT: '#D9A5A5', dark: '#C48C8C', light: '#E8DCD5', 50: '#FFF5F5', 100: '#FFE8E8', 400: '#E8DCD5', 500: '#D9A5A5', 600: '#C48C8C' },
        emerald:  { 400: '#6EE7B7', 500: '#34D399', 600: '#10B981', 700: '#059669' },
        rose:     { 400: '#FDA4AF', 500: '#FB7185', 600: '#F43F5E', 700: '#E11D48', 800: '#BE123C' },
        lux:      { bg: '#FAF8F7', s1: '#F5EDEA', s2: '#EDE0DB', s3: '#E5D5CE', border: 'rgba(217,165,165,0.22)', text: '#1A0E0E', text2: '#6B3A3A', text3: '#A87878' },
        adm:      { bg: '#0B1221', surface: '#111A2E', surface2: '#18243F', border: 'rgba(255,255,255,0.07)', text: '#E8EDF5', text2: '#8B9BB4' },
      },
      fontFamily: {
        display: ['"Inter"', 'sans-serif'],
        body:    ['"Inter"', 'sans-serif'],
        sans:    ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'card':       '0 2px 12px rgba(196,140,140,0.08)',
        'card-hover': '0 8px 32px rgba(196,140,140,0.15)',
        'primary':    '0 4px 20px rgba(217,165,165,0.35)',
        'primary-lg': '0 8px 40px rgba(217,165,165,0.45)',
        'gold':       '0 4px 20px rgba(217,165,165,0.35)',
        'green':      '0 4px 16px rgba(16,185,129,0.35)',
        'red':        '0 4px 16px rgba(244,63,94,0.35)',
        'glow-gold':  '0 0 40px rgba(217,165,165,0.2)',
        'dark-lg':    '0 20px 60px rgba(26,14,14,0.12)',
        'glass':      'inset 0 1px 0 rgba(255,255,255,0.8)',
      },
      backgroundImage: {
        'gold-gradient':  'linear-gradient(135deg, #C48C8C, #D9A5A5, #E8DCD5)',
        'gold-shimmer':   'linear-gradient(135deg, #D9A5A5, #E8DCD5, #FFF5F5)',
        'green-gradient': 'linear-gradient(135deg, #059669, #10B981, #6EE7B7)',
        'red-gradient':   'linear-gradient(135deg, #BE123C, #F43F5E, #FB7185)',
        'mesh-lux':       'radial-gradient(ellipse at 20% 30%, rgba(217,165,165,0.1) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(232,220,213,0.07) 0%, transparent 55%)',
      },
      animation: {
        'fade-up':    'fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards',
        'scale-in':   'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-down': 'slideDown 0.25s ease-out forwards',
        'float':      'float 3.5s ease-in-out infinite',
        'glow':       'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.94)' }, to: { opacity: '1', transform: 'scale(1)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        glowPulse: { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
      },
    },
  },
  plugins: [],
}
