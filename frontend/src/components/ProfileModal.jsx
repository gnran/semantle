import React, { useState, useEffect, useCallback } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { BrowserProvider } from 'ethers'
import { getStatsFromChain, isContractConfigured } from '../utils/contract'
import './ProfileModal.css'

function ProfileModal({ isOpen, onClose, userInfo, onLogout }) {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadStats = useCallback(async () => {
    if (!userInfo?.walletAddress) {
      setStats(null)
      return
    }

    // Check if contract is configured
    if (!isContractConfigured()) {
      console.warn('Contract not configured, cannot load blockchain stats')
      setStats(null)
      return
    }

    setIsLoading(true)
    try {
      // Get provider from Farcaster SDK (like Wordle)
      const provider = await sdk.wallet.getEthereumProvider()
      if (!provider) {
        throw new Error('Provider not available')
      }

      const browserProvider = new BrowserProvider(provider)
      const blockchainStats = await getStatsFromChain(userInfo.walletAddress, browserProvider)
      
      // Map blockchain stats to display format
      setStats({
        total_games: blockchainStats.totalGames,
        completed_games: blockchainStats.totalGames, // All games on chain are completed
        average_attempts: blockchainStats.averageAttempts,
        best_score: blockchainStats.bestScore > 0 ? blockchainStats.bestScore : null
      })
    } catch (err) {
      console.error('Failed to load stats from blockchain:', err)
      setStats(null)
    } finally {
      setIsLoading(false)
    }
  }, [userInfo?.walletAddress])

  useEffect(() => {
    if (isOpen && userInfo?.walletAddress) {
      loadStats()
    } else if (isOpen && userInfo && !userInfo.walletAddress) {
      // User is connected but doesn't have a wallet address
      setStats(null)
    }
  }, [isOpen, userInfo?.walletAddress, loadStats])

  const formatAddress = (address) => {
    if (!address) return 'Not connected'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getAvatarInitials = () => {
    if (userInfo?.username) {
      return userInfo.username.charAt(0).toUpperCase()
    }
    if (userInfo?.displayName) {
      return userInfo.displayName.charAt(0).toUpperCase()
    }
    if (userInfo?.fid) {
      return 'U'
    }
    return '?'
  }

  if (!isOpen) return null

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>Profile</h2>
          <button className="profile-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="profile-content">
          {userInfo ? (
            <>
              <div className="profile-avatar-section">
                {userInfo.pfpUrl ? (
                  <img
                    src={userInfo.pfpUrl}
                    alt={userInfo.username || userInfo.displayName || 'User'}
                    className="profile-avatar-img"
                  />
                ) : (
                  <div className="profile-avatar">
                    {getAvatarInitials()}
                  </div>
                )}
                {userInfo.displayName && (
                  <div className="profile-username">{userInfo.displayName}</div>
                )}
                {userInfo.username && userInfo.username !== userInfo.displayName && (
                  <div className="profile-username-sub">@{userInfo.username}</div>
                )}
              </div>

              <div className="profile-info">
                <div className="profile-info-item">
                  <span className="profile-info-label">FID:</span>
                  <span className="profile-info-value">
                    {userInfo.fid ? `#${userInfo.fid}` : 'Not available'}
                  </span>
                </div>

                <div className="profile-info-item">
                  <span className="profile-info-label">Wallet Address:</span>
                  <span className="profile-info-value" title={userInfo.walletAddress}>
                    {userInfo.walletAddress ? formatAddress(userInfo.walletAddress) : 'Not connected'}
                  </span>
                </div>
              </div>

              <div className="profile-stats-section">
                <h3>Current Stats {userInfo.walletAddress && <span className="profile-stats-source">(Blockchain)</span>}</h3>
                {!userInfo.walletAddress ? (
                  <div className="profile-stats-empty">
                    Connect your wallet to view blockchain stats.
                  </div>
                ) : isLoading ? (
                  <div className="profile-stats-loading">Loading stats from blockchain...</div>
                ) : stats ? (
                  <div className="profile-stats-grid">
                    <div className="profile-stat-box">
                      <div className="profile-stat-value">{stats.total_games || 0}</div>
                      <div className="profile-stat-label">Total Games</div>
                    </div>
                    <div className="profile-stat-box">
                      <div className="profile-stat-value">{stats.completed_games || 0}</div>
                      <div className="profile-stat-label">Completed</div>
                    </div>
                    <div className="profile-stat-box">
                      <div className="profile-stat-value">{stats.average_attempts ? stats.average_attempts.toFixed(1) : 'N/A'}</div>
                      <div className="profile-stat-label">Avg Attempts</div>
                    </div>
                    <div className="profile-stat-box">
                      <div className="profile-stat-value">{stats.best_score || 'N/A'}</div>
                      <div className="profile-stat-label">Best Score</div>
                    </div>
                  </div>
                ) : (
                  <div className="profile-stats-empty">No statistics available yet. Play some games to see your stats!</div>
                )}
              </div>

              <div className="profile-actions">
                <button className="profile-logout-button" onClick={onLogout}>
                  Close
                </button>
              </div>
            </>
          ) : (
            <div className="profile-not-connected">
              <p>Please connect your account to view your profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileModal
