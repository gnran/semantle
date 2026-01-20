import React, { useState, useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { BrowserProvider } from 'ethers'
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

  // Notify SDK that app is ready
  useEffect(() => {
    sdk.actions.ready()
  }, [])

  // Get user data from Context API and Wallet (exactly like Wordle)
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const context = await sdk.context
        const user = context.user
        
        let walletAddress = null
        try {
          const provider = await sdk.wallet.getEthereumProvider()
          if (provider) {
            // First try to get already connected accounts (without requesting permission)
            let accounts = await provider.request({ method: 'eth_accounts' })
            
            // If no accounts, try to request (may show user prompt)
            if (!accounts || accounts.length === 0) {
              try {
                accounts = await provider.request({ method: 'eth_requestAccounts' })
              } catch (requestError) {
                // User may reject the request - this is normal
                console.log('User did not provide wallet access')
              }
            }
            
            if (accounts && accounts.length > 0) {
              walletAddress = accounts[0]
            }
          }
        } catch (error) {
          console.warn('Failed to get wallet address:', error)
        }

        const newUserInfo = {
          fid: user.fid,
          username: user.username,
          displayName: user.displayName,
          pfpUrl: user.pfpUrl,
          walletAddress
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
  }, [])

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
