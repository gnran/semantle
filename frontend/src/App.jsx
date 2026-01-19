import React, { useState, useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import Game from './components/Game'
import Stats from './components/Stats'
import Header from './components/Header'
import LoginModal from './components/LoginModal'
import FAQModal from './components/FAQModal'
import ProfileModal from './components/ProfileModal'
import { initializeAuth, getAuthState, connectWallet, connectFarcaster, isAuthenticated, disconnectWallet } from './utils/auth'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('game')
  const [sessionId, setSessionId] = useState(null)
  const [authState, setAuthState] = useState({ connected: false })
  const [isConnecting, setIsConnecting] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showFAQModal, setShowFAQModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

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
    setIsCheckingAuth(true)
    try {
      const state = await getAuthState()
      setAuthState(state)
      const authenticated = await isAuthenticated()
      setShowLoginModal(!authenticated)
    } catch (error) {
      console.error('Failed to check auth state:', error)
      setShowLoginModal(true)
    } finally {
      setIsCheckingAuth(false)
    }
  }

  const handleFarcasterLogin = async () => {
    setIsConnecting(true)
    try {
      const state = await connectFarcaster()
      setAuthState(state)
      setShowLoginModal(false)
    } catch (error) {
      console.error('Failed to connect with Farcaster:', error)
      alert('Failed to connect with Farcaster. Please make sure you are using the app within a Farcaster client.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleCoinbaseLogin = async () => {
    setIsConnecting(true)
    try {
      const state = await connectWallet()
      setAuthState(state)
      setShowLoginModal(false)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      alert('Failed to connect wallet. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleLogout = async () => {
    await disconnectWallet()
    setAuthState({ connected: false })
    setShowLoginModal(true)
    setShowProfileModal(false)
  }

  if (isCheckingAuth) {
    return (
      <div className="App">
        <div className="loading-screen">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      {showLoginModal && (
        <LoginModal
          onFarcasterLogin={handleFarcasterLogin}
          onCoinbaseLogin={handleCoinbaseLogin}
          isConnecting={isConnecting}
        />
      )}
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
