/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gaming: {
          bg: '#050505',
          panel: '#111111',
          red: '#ef4444',
          darkred: '#991b1b',
          glow: 'rgba(239, 68, 68, 0.5)'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
