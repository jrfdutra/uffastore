/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.php", "./templates/**/*.php", "./inc/**/*.php"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        "brand-foreground": "var(--brand-foreground)",
        "brand-strong": "var(--brand-strong)",
        "brand-soft": "var(--brand-soft)",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        display: ['"Anton"', "sans-serif"],
        sans: ['"Inter"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
