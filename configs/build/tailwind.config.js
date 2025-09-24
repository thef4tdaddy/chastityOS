/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "../../index.html",
    "../../src/**/*.{js,ts,jsx,tsx}"
  ],
  safelist: [
    'inputbox-red',
    'inputbox-yellow',
    'inputbox-blue',
    'button-red',
    'button-yellow',
    'button-blue',
    'text-red',
    'text-yellow',
    'text-blue',
    'title-red',
    'title-yellow',
    'title-blue',
    'reward-box',
    'punishment-box',
    'task-box',
  ],
  darkMode: false,
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      backdropBlur: {
        xs: '2px',
      },
      colors: {
        nightly: {
          aquamarine: '#57f6b1ff',
          'spring-green': '#41e688ff',
          honeydew: '#e0fce7ff',
          celadon: '#b1f3c1ff',
          'lavender-floral': '#c691faff',
          'mobile-bg': '#282132ff',
          'desktop-bg': '#1a1423ff',
        },
        prod: {
            tekhelet: '#581c87ff',
            'dark-purple': '#282132ff',
            'lavender-web': '#d7d2eaff',
            'rose-quartz': '#a39fadff',
            tangerine: '#e88331ff',
        },
      },
    },
  },
  plugins: [],
}