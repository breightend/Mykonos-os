import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    server: {
      headers: {
        "Content-Security-Policy": [
          "default-src 'self'",
          "connect-src 'self' http://localhost:5000 ws://localhost:5173",
          "img-src 'self' data: blob: http://localhost:5173",
          "style-src 'self' 'unsafe-inline'",
          "script-src 'self' 'unsafe-eval'",
          "font-src 'self' data:",
          "media-src 'self' data: blob:"
        ].join('; ')
      }
    }
  }
})