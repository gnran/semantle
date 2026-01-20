import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import WagmiProvider from './providers/WagmiProvider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
