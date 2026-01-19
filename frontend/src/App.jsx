import React, { useState, useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import Game from './components/Game'
import Stats from './components/Stats'
import Header from './components/Header'
import LoadingScreen from './components/LoadingScreen'
import FAQModal from './components/FAQModal'
import ProfileModal from './components/ProfileModal'
import { initializeAuth, getAuthState, connectWallet, connectFarcaster, isAuthenticated } from './utils/auth'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('game')
  const [sessionId, setSessionId] = useState(null)
  const [authState, setAuthState] = useState({ connected: false })
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState('Connecting...')
  const [showFAQModal, setShowFAQModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    // Hide loading splash screen and display the app
    sdk.actions.ready()
    
    // Initialize and auto-connect
    initializeAndConnect()
  }, [])

  const initializeAndConnect = async () => {
    setIsInitializing(true)
    setConnectionMessage('Initializing...')
    
    try {
      // Initialize Base Account SDK
      try {
        initializeAuth()
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      }

      // Check existing auth state first
      setConnectionMessage('Checking authentication...')
      const existingState = await getAuthState()
      const authenticated = await isAuthenticated()
      
      if (authenticated && existingState.connected) {
        // Already authenticated
        setAuthState(existingState)
        setIsInitializing(false)
        return
      }

      // Try to auto-connect
      await autoConnect()
    } catch (error) {
      console.error('Failed to initialize and connect:', error)
      // Even if connection fails, allow user to continue (they might not have wallet)
      setIsInitializing(false)
    }
  }

  const autoConnect = async () => {
    setIsConnecting(true)
    
    try {
      // Try Farcaster first (since we're in a Farcaster mini app)
      setConnectionMessage('Connecting with Farcaster...')
      try {
        const state = await connectFarcaster()
        if (state.connected) {
          setAuthState(state)
          setIsConnecting(false)
          setIsInitializing(false)
          return
        }
      } catch (farcasterError) {
        console.log('Farcaster connection failed, trying Coinbase:', farcasterError)
      }

      // If Farcaster fails, try Coinbase Wallet
      setConnectionMessage('Connecting wallet...')
      try {
        const state = await connectWallet()
        if (state.connected) {
          setAuthState(state)
          setIsConnecting(false)
          setIsInitializing(false)
          return
        }
      } catch (walletError) {
        console.log('Wallet connection failed:', walletError)
      }

      // If both fail, check if we at least have Farcaster context
      setConnectionMessage('Checking Farcaster account...')
      try {
        const context = await sdk.context
        if (context?.user) {
          // We have Farcaster context but no wallet - that's okay
          const state = {
            fid: context.user.fid,
            username: context.user.username,
            address: null,
            connected: true,
            loginMethod: 'farcaster',
            connectedAt: Date.now()
          }
          localStorage.setItem('semantle_auth', JSON.stringify(state))
          setAuthState(state)
        }
      } catch (err) {
        console.log('No Farcaster context available')
      }

    } catch (error) {
      console.error('Auto-connect failed:', error)
    } finally {
      setIsConnecting(false)
      setIsInitializing(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('semantle_auth')
    setAuthState({ connected: false })
    setShowProfileModal(false)
    // Re-attempt auto-connect after logout
    initializeAndConnect()
  }

  // Show loading screen while initializing or connecting
  if (isInitializing || isConnecting) {
    return (
      <div className="App">
        <LoadingScreen message={connectionMessage} />
      </div>
    )
  }

  return (
    <div className="App">
      <Header 
        onFAQClick={() => setShowFAQModal(true)}
        onProfileClick={() => setShowProfileModal(true)}
      />
      <FAQModal 
        isOpen={showFAQModal}
        onClose={() => setShowFAQModal(false)}
      />
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        authState={authState}
        onLogout={handleLogout}
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
