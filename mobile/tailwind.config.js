/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        secondary: '#00D4AA',
        background: '#0F0F1A',
        surface: '#1A1A2E',
        surfaceAlt: '#16213E',
      }
    },
  },
  plugins: [],
}

