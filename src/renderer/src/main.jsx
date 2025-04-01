import './assets/main.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './contexts/themeContext'
import { SellProvider } from './contexts/sellContext'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <SellProvider>
        <App />
      </SellProvider>
    </ThemeProvider>
  </React.StrictMode>
)
