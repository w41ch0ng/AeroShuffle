/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        "l-xl": "0.55rem",
      },
      colors: {
        "wmp-blue": "#b9d1ea",
      },
    },
  },
  plugins: [],
};
