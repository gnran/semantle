import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { sdk } from '@farcaster/miniapp-sdk'
import Game from './components/Game'
import Stats from './components/Stats'
import Header from './components/Header'
import LoadingScreen from './components/LoadingScreen'
import FAQModal from './components/FAQModal'
import ProfileModal from './components/ProfileModal'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('game')
  const [sessionId, setSessionId] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showFAQModal, setShowFAQModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  // Get account from Wagmi (Base Account)
  const { address: walletAddress, isConnected } = useAccount()

  // Notify SDK that app is ready
  useEffect(() => {
    sdk.actions.ready()
  }, [])

  // Get user data from Farcaster Context API
  // Base Account is automatically connected via Wagmi
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const context = await sdk.context
        const user = context.user

        const newUserInfo = {
          fid: user.fid,
          username: user.username,
          displayName: user.displayName,
          pfpUrl: user.pfpUrl,
          walletAddress: walletAddress || null
        }

        setUserInfo(newUserInfo)
      } catch (error) {
        console.error('Error fetching user data:', error)
        // If user is not logged in, use null userInfo
        setUserInfo(null)
      } finally {
        // Hide loading screen once connection process is complete
        setIsLoading(false)
      }
    }

    fetchUserInfo()
  }, [walletAddress])

  const handleLogout = () => {
    // Clear user info (in Wordle, logout just closes modal)
    setShowProfileModal(false)
    // Note: In Farcaster mini apps, user stays logged in to Farcaster
    // We just clear local state if needed
  }

  // Show loading screen while fetching user info
  if (isLoading) {
    return (
      <div className="App">
        <LoadingScreen message="Loading..." />
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
        userInfo={userInfo}
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
