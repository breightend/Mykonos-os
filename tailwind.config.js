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
    extend: {
      colors: {
        primary: 'hsl(var(--p) / <alpha-value>)',
        'primary-content': 'hsl(var(--pc) / <alpha-value>)',
        secondary: 'hsl(var(--s) / <alpha-value>)',
        'secondary-content': 'hsl(var(--sc) / <alpha-value>)',
        accent: 'hsl(var(--a) / <alpha-value>)',
        'accent-content': 'hsl(var(--ac) / <alpha-value>)',
        neutral: 'hsl(var(--n) / <alpha-value>)',
        'neutral-content': 'hsl(var(--nc) / <alpha-value>)',
        'base-100': 'hsl(var(--b1) / <alpha-value>)',
        'base-200': 'hsl(var(--b2) / <alpha-value>)',
        'base-300': 'hsl(var(--b3) / <alpha-value>)',
        'base-content': 'hsl(var(--bc) / <alpha-value>)',
      }
    },
  },
  daisyui: {
    themes: [
      {
        light: {
          "color-scheme": "light",
          "primary": "oklch(73.95% 0.204 40.32)",
          "secondary": "oklch(69.71% 0.329 242.2)",
          "accent": "oklch(76.76% 0.184 183.61)",
          "neutral": "#2B3440",
          "base-100": "#ffffff",
          "base-200": "#F2F2F2",
          "base-300": "#E5E6E6",
          "base-content": "#1f2937",
        },
      },
      {
        dark: {
          "color-scheme": "dark",
          "primary": "oklch(73.95% 0.204 40.32)",
          "secondary": "oklch(74.8% 0.26 296.8)",
          "accent": "oklch(74.51% 0.167 183.61)",
          "neutral": "#2a323c",
          "base-100": "#1d232a",
          "base-200": "#191e24",
          "base-300": "#15191e",
          "base-content": "#A6ADBB",
        },
      },
    ],
  },
  plugins: [require("daisyui")]
}

