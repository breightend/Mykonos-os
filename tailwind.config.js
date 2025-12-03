/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    './renderer/**/*.{js,ts,jsx,tsx,html}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: ["light", "dark"],
    styled: true,
    base: true,
    utils: true,
    logs: true,
    rtl: false,
  },
  plugins: [require("daisyui")]
}

