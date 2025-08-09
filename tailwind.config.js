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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        // Tema claro elegante para local de ropa con naranja como base
        cupcake: {
          primary: '#ff8c42',        // Naranja vibrante pero sofisticado
          'primary-content': '#ffffff', // Texto blanco sobre naranja
          secondary: '#6366f1',       // Índigo moderno (elegante)
          'secondary-content': '#ffffff',
          accent: '#06b6d4',          // Cian elegante (complementa el naranja)
          'accent-content': '#ffffff',
          neutral: '#374151',         // Gris carbón (sofisticado)
          'neutral-content': '#ffffff',
          'base-100': '#ffffff',        // Fondo blanco puro
          'base-200': '#f8fafc',        // Gris muy claro (slate)
          'base-300': '#e2e8f0',        // Gris suave (slate)
          'base-content': '#1e293b',    // Texto oscuro (slate-800)
          info: '#0ea5e9',            // Azul cielo profesional
          'info-content': '#ffffff',
          success: '#10b981',         // Verde esmeralda
          'success-content': '#ffffff',
          warning: '#f59e0b',         // Ámbar dorado
          'warning-content': '#ffffff',
          error: '#ef4444',           // Rojo coral
          'error-content': '#ffffff'
        },
        // Tema oscuro sofisticado
        night: {
          primary: '#ff8c42',        // Mismo naranja (consistencia de marca)
          'primary-content': '#ffffff',
          secondary: '#818cf8',       // Índigo más claro para contraste
          'secondary-content': '#1e1b4b',
          accent: '#22d3ee',          // Cian brillante
          'accent-content': '#083344',
          neutral: '#1f2937',         // Gris oscuro elegante
          'neutral-content': '#f9fafb',
          'base-100': '#111827',        // Fondo muy oscuro (gray-900)
          'base-200': '#1f2937',        // Gris oscuro (gray-800)
          'base-300': '#374151',        // Gris medio (gray-700)
          'base-content': '#f9fafb',    // Texto claro
          info: '#38bdf8',            // Azul cielo más brillante
          'info-content': '#0c4a6e',
          success: '#34d399',         // Verde mint
          'success-content': '#064e3b',
          warning: '#fbbf24',         // Ámbar brillante
          'warning-content': '#92400e',
          error: '#f87171',           // Rojo suave
          'error-content': '#7f1d1d'
        }
      }
    ]
  }
}
