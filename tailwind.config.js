/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        nightly: {
          bg: '#f2f2f2',
          text: '#111111',
          border: '#444444',
        },
        prod: {
          bg: '#0f0f1a',
          text: '#e5e5e5',
          border: '#333333',
        },
      },
    },
  },
  plugins: [],
}
