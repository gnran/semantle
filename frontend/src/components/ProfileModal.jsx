import React, { useState, useEffect, useCallback } from 'react'
import { getStatsFromChain, isContractConfigured } from '../utils/contract'
import { getProvider } from '../utils/auth'
import './ProfileModal.css'

function ProfileModal({ isOpen, onClose, authState, onLogout }) {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadStats = useCallback(async () => {
    if (!authState.address) {
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
      const provider = await getProvider()
      if (!provider) {
        throw new Error('Provider not available')
      }

      const blockchainStats = await getStatsFromChain(authState.address, provider)
      
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
  }, [authState.address])

  useEffect(() => {
    if (isOpen && authState.connected && authState.address) {
      loadStats()
    } else if (isOpen && authState.connected && !authState.address) {
      // User is connected but doesn't have a wallet address
      setStats(null)
    }
  }, [isOpen, authState.connected, authState.address, loadStats])

  const formatAddress = (address) => {
    if (!address) return 'Not connected'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getAvatarInitials = () => {
    if (authState.username) {
      return authState.username.charAt(0).toUpperCase()
    }
    if (authState.fid) {
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
          {authState.connected ? (
            <>
              <div className="profile-avatar-section">
                <div className="profile-avatar">
                  {getAvatarInitials()}
                </div>
                {authState.username && (
                  <div className="profile-username">@{authState.username}</div>
                )}
              </div>

              <div className="profile-info">
                <div className="profile-info-item">
                  <span className="profile-info-label">FID:</span>
                  <span className="profile-info-value">
                    {authState.fid ? `#${authState.fid}` : 'Not available'}
                  </span>
                </div>

                <div className="profile-info-item">
                  <span className="profile-info-label">Wallet Address:</span>
                  <span className="profile-info-value" title={authState.address}>
                    {authState.address ? formatAddress(authState.address) : 'Not connected'}
                  </span>
                </div>
              </div>

              <div className="profile-stats-section">
                <h3>Current Stats {authState.address && <span className="profile-stats-source">(Blockchain)</span>}</h3>
                {!authState.address ? (
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
                  Logout
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
