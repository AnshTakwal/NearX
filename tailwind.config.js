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
          DEFAULT: '#0F766E', // Deep Teal
          dark: '#0D655E',
          light: '#CCFBF1',
        },
        accent: {
          DEFAULT: '#FF6B4A', // Warm Coral
          dark: '#E85536',
          light: '#FFF0ED',
        },
        bg: '#F8FAFA',
        text: '#1A1A2E',
        muted: '#64748B',
        success: '#16A34A', // Muted green (Tailwind green-600)
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
