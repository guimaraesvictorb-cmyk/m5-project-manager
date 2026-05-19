/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        m5green: "#1FCE4A",
        surface: "#131313",
        "surface-hover": "#1A1A1A",
        "card-border": "#262626",
      },
      fontFamily: {
        sans: ["Inter", "Helvetica Neue", "sans-serif"],
      },
    },
  },
  plugins: [],
}
