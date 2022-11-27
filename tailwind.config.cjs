/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xxs': '350px',
      'xs': '400px',
      'sm': '760px'
    },
    extend: {},
  },
  plugins: [],
}
