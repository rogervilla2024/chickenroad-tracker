/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary farmyard theme colors
        'chicken': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Primary amber
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        'road': {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308', // Primary yellow
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        'grass': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Green accent
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        'farm': {
          dark: '#1c1917',
          darker: '#0c0a09',
          light: '#fafaf9',
          brown: '#78350f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fredoka One', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'road-pattern': "repeating-linear-gradient(90deg, #374151 0px, #374151 40px, #fbbf24 40px, #fbbf24 50px)",
        'grass-pattern': "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
        'farm-gradient': "linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #22c55e 100%)",
      },
      animation: {
        'chicken-walk': 'chickenWalk 0.5s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 1s ease-in-out infinite',
      },
      keyframes: {
        chickenWalk: {
          '0%, 100%': { transform: 'translateY(0) rotate(-2deg)' },
          '50%': { transform: 'translateY(-3px) rotate(2deg)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      boxShadow: {
        'farm': '0 4px 20px rgba(245, 158, 11, 0.3)',
        'farm-lg': '0 10px 40px rgba(245, 158, 11, 0.4)',
      },
    },
  },
  plugins: [],
};
