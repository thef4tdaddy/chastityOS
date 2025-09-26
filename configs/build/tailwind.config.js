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
  ],
  darkMode: false,
  theme: {
    extend: {
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
        glass: {
          white: "rgba(255, 255, 255, 0.1)",
          "white-hover": "rgba(255, 255, 255, 0.15)",
          dark: "rgba(0, 0, 0, 0.1)",
          "dark-hover": "rgba(0, 0, 0, 0.15)",
          border: "rgba(255, 255, 255, 0.2)",
          "border-dark": "rgba(255, 255, 255, 0.1)",
        },
        nightly: {
          aquamarine: "#57f6b1ff",
          "spring-green": "#41e688ff",
          honeydew: "#e0fce7ff",
          celadon: "#b1f3c1ff",
          "lavender-floral": "#c691faff",
          "mobile-bg": "#282132ff",
          "desktop-bg": "#1a1423ff",
        },
        prod: {
          tekhelet: "#581c87ff",
          "dark-purple": "#282132ff",
          "lavender-web": "#d7d2eaff",
          "rose-quartz": "#a39fadff",
          tangerine: "#e88331ff",
        },
      },
    },
  },
  plugins: [],
};
