import './assets/main.css'
import './assets/shadcn-fixes-clean.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './contexts/themeContext'
import { SettingsProvider } from './contexts/settingsContext'
import { SellProvider } from './contexts/sellContext'
import { GlobalDataProvider } from './contexts/GlobalDataContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <GlobalDataProvider>
          <SellProvider>
            <App />
          </SellProvider>
        </GlobalDataProvider>
      </SettingsProvider>
    </ThemeProvider>
  </React.StrictMode>
)