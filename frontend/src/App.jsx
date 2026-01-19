import React, { useState, useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import Game from './components/Game'
import Stats from './components/Stats'
import Header from './components/Header'
import './App.css'

// Use environment variable for API URL, fallback to '/api' for local development
const API_BASE = import.meta.env.VITE_API_URL || '/api'

function App() {
  const [currentView, setCurrentView] = useState('game')
  const [sessionId, setSessionId] = useState(null)
  const [token, setToken] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    // Authenticate user on mount
    signIn()
  }, [])

  async function signIn() {
    setIsAuthenticating(true)
    setAuthError(null)
    
    try {
      // Get JWT token from Quick Auth
      const { token: authToken } = await sdk.quickAuth.getToken()
      setToken(authToken)
      
      // Verify token with backend and get user data
      const response = await sdk.quickAuth.fetch(`${API_BASE}/auth`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Authentication failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch (e) {
          errorMessage = `Authentication failed with status ${response.status}`
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      setUserData(data)
      
      // Hide loading splash screen and display the app
      await sdk.actions.ready()
      setIsAuthenticating(false)
    } catch (error) {
      console.error('Authentication failed:', error)
      setAuthError('Failed to authenticate. Please try again.')
      setIsAuthenticating(false)
      // Still call ready() to hide splash screen even if auth fails
      await sdk.actions.ready()
    }
  }

  function signOut() {
    setToken(null)
    setUserData(null)
    signIn() // Re-authenticate
  }

  // Show loading screen while authenticating
  if (isAuthenticating) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Authenticating...</p>
        </div>
      </div>
    )
  }

  // Show error screen if authentication failed
  if (authError && !token) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <p className="error-message">{authError}</p>
          <button onClick={signIn} className="retry-button">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="main-content">
        {currentView === 'game' && (
          <Game sessionId={sessionId} setSessionId={setSessionId} />
        )}
        {currentView === 'stats' && <Stats userData={userData} />}
      </main>
    </div>
  )
}

export default App
