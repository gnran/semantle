import React, { useState, useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import Game from './components/Game'
import Stats from './components/Stats'
import Header from './components/Header'
import { initializeAuth, getAuthState, connectWallet } from './utils/auth'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('game')
  const [sessionId, setSessionId] = useState(null)
  const [authState, setAuthState] = useState({ connected: false })
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    // Hide loading splash screen and display the app
    sdk.actions.ready()
    
    // Initialize Base Account SDK
    try {
      initializeAuth()
    } catch (error) {
      console.error('Failed to initialize auth:', error)
    }

    // Check existing auth state
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const state = await getAuthState()
      setAuthState(state)
    } catch (error) {
      console.error('Failed to check auth state:', error)
    }
  }

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    try {
      const state = await connectWallet()
      setAuthState(state)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      alert('Failed to connect wallet. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="App">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        authState={authState}
        onConnectWallet={handleConnectWallet}
        isConnecting={isConnecting}
      />
      <main className="main-content">
        {currentView === 'game' && (
          <Game sessionId={sessionId} setSessionId={setSessionId} />
        )}
        {currentView === 'stats' && <Stats />}
      </main>
    </div>
  )
}

export default App
