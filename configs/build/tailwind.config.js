/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["../../index.html", "../../src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    "inputbox-red",
    "inputbox-yellow",
    "inputbox-blue",
    "button-red",
    "button-yellow",
    "button-blue",
    "text-red",
    "text-yellow",
    "text-blue",
    "title-red",
    "title-yellow",
    "title-blue",
    "reward-box",
    "punishment-box",
    "task-box",
    "touch-target",
    "btn-mobile",
    "input-mobile",
    "select-mobile",
    "card-mobile",
    "bottom-nav",
    "bottom-nav-item",
  ],
  darkMode: false,
  theme: {
    extend: {
      fontFamily: {
        inter: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
        "glass-gradient-hover":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))",
        "liquid-glass":
          "linear-gradient(45deg, rgba(147, 197, 253, 0.1), rgba(196, 181, 253, 0.1), rgba(251, 146, 60, 0.1))",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "64px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        "glass-inset": "inset 0 2px 4px 0 rgba(255, 255, 255, 0.06)",
        "glass-lg":
          "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)",
        liquid:
          "0 8px 32px rgba(147, 197, 253, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      },
      animation: {
        "glass-morph": "glass-morph 4s ease-in-out infinite",
        "liquid-flow": "liquid-flow 6s ease-in-out infinite",
        "glass-shimmer": "glass-shimmer 2s linear infinite",
        float: "float 3s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
      },
      keyframes: {
        "glass-morph": {
          "0%, 100%": {
            "background-position": "0% 50%",
            "border-radius": "20px",
          },
          "50%": {
            "background-position": "100% 50%",
            "border-radius": "25px",
          },
        },
        "liquid-flow": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "0% 0%",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "100% 100%",
          },
        },
        "glass-shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      colors: {
        // ChastityOS Design System Colors
        tekhelet: {
          DEFAULT: "#581c87", // Primary accent purple (e.g., Log Event bar, buttons, active states)
          100: "#12061b",
          200: "#240b36",
          300: "#351151",
          400: "#47166c",
          500: "#581c87",
          600: "#7f28c1",
          700: "#a052dc",
          800: "#c08ce7",
          900: "#dfc5f3",
        },
        dark_purple: {
          DEFAULT: "#282132", // Main dark mode background for the app body
          100: "#08070a",
          200: "#100d14",
          300: "#18141d",
          400: "#201a27",
          500: "#282132",
          600: "#514364",
          700: "#7a6598",
          800: "#a698ba",
          900: "#d3ccdd",
        },
        lavender_web: {
          DEFAULT: "#d7d2ea", // Light mode background / Dark mode card background / Light text
          100: "#231c3c",
          200: "#473979",
          300: "#6c59b1",
          400: "#a296cd",
          500: "#d7d2ea",
          600: "#dfdbee",
          700: "#e7e4f2",
          800: "#efedf7",
          900: "#f7f6fb",
        },
        rose_quartz: {
          DEFAULT: "#a39fad", // Secondary text / Subtle elements / Inactive states
          100: "#201e24",
          200: "#403d48",
          300: "#605b6b",
          400: "#807b8e",
          500: "#a39fad",
          600: "#b5b2bd",
          700: "#c8c5ce",
          800: "#dad8de",
          900: "#edecef",
        },
        tangerine: {
          DEFAULT: "#e88331", // Orange accent (e.g., Chastity Tracker bar, Full Report bar)
          100: "#321a06",
          200: "#65340b",
          300: "#974d11",
          400: "#ca6716",
          500: "#e88331",
          600: "#ed9c5a",
          700: "#f1b583",
          800: "#f6cdac",
          900: "#fae6d6",
        },
        // Legacy glass effects (keeping for compatibility)
        glass: {
          white: "rgba(255, 255, 255, 0.1)",
          "white-hover": "rgba(255, 255, 255, 0.15)",
          dark: "rgba(0, 0, 0, 0.1)",
          "dark-hover": "rgba(0, 0, 0, 0.15)",
          border: "rgba(255, 255, 255, 0.2)",
          "border-dark": "rgba(255, 255, 255, 0.1)",
        },
        // Legacy nightly theme (keeping for compatibility)
        nightly: {
          aquamarine: "#57f6b1ff",
          "spring-green": "#41e688ff",
          honeydew: "#e0fce7ff",
          celadon: "#b1f3c1ff",
          "lavender-floral": "#c691faff",
          "mobile-bg": "#282132ff",
          "desktop-bg": "#1a1423ff",
        },
        // Legacy prod colors (keeping for compatibility, but updated to match design system)
        prod: {
          tekhelet: "#581c87",
          "dark-purple": "#282132",
          "lavender-web": "#d7d2ea",
          "rose-quartz": "#a39fad",
          tangerine: "#e88331",
        },
        // Standard colors for borders and text
        black: "#000000", // For hard borders where specified
        white: "#ffffff", // For primary text on dark backgrounds
      },
    },
  },
  plugins: [],
};
