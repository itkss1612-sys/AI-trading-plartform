/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0b0e14',
          card: '#121721',
          border: '#1e2638',
          accent: '#2563eb',
          bullish: '#10b981',
          bearish: '#ef4444',
          neutral: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
