import './assets/main.css'
import './assets/shadcn-fixes-clean.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './contexts/themeContext'
import { SettingsProvider } from './contexts/settingsContext'
import { SellProvider } from './contexts/sellContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <SellProvider>
          <App />
        </SellProvider>
      </SettingsProvider>
    </ThemeProvider>
  </React.StrictMode>
)
