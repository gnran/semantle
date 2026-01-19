import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { getUserId } from '../utils/userId'
import './Stats.css'

// Use environment variable for API URL, fallback to '/api' for local development
const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Warn in production if API URL is not configured
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn(
    '⚠️ VITE_API_URL is not set! API requests will fail in production. ' +
    'Please set VITE_API_URL environment variable in Vercel to your Railway backend URL.'
  )
}

function Stats({ userData }) {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    loadStats()
    if (userData?.fid) {
      loadProfile()
    }
  }, [userData])

  async function loadProfile() {
    if (!userData?.fid) return
    
    try {
      // Fetch profile from API using FID
      const response = await fetch(`https://api.web3.bio/profile/farcaster/${userData.fid}`)
      if (response.ok) {
        const data = await response.json()
        setProfile({
          fid: userData.fid,
          username: data.identity || data.displayName || data.username,
          displayName: data.displayName,
          avatar: data.avatar,
          wallet: data.address
        })
      } else {
        // If API fails, set basic profile with just FID
        setProfile({
          fid: userData.fid,
          username: null,
          displayName: null,
          avatar: null,
          wallet: null
        })
      }
    } catch (err) {
      console.error('Failed to fetch profile from API:', err)
      // Set basic profile with just FID as fallback
      setProfile({
        fid: userData.fid,
        username: null,
        displayName: null,
        avatar: null,
        wallet: null
      })
    }
  }

  const loadStats = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const userId = getUserId()
      const response = await axios.get(`${API_BASE}/stats/${userId}`)
      setStats(response.data)
    } catch (err) {
      setError('Failed to load statistics')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="stats-container">
        <div className="stats-card">
          <p>Loading statistics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="stats-container">
        <div className="stats-card">
          <p className="error">{error}</p>
          <button onClick={loadStats}>Retry</button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="stats-container">
        <div className="stats-card">
          <p>No statistics available yet. Play some games to see your stats!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="stats-container">
      <div className="stats-card">
        {/* User Profile Section */}
        {profile && (
          <div className="user-profile">
            <div className="avatar-container">
              {profile.avatar ? (
                <img 
                  src={profile.avatar} 
                  alt="Avatar" 
                  className="user-avatar"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div 
                className="user-avatar-placeholder"
                style={{ display: profile.avatar ? 'none' : 'flex' }}
              >
                {(profile.displayName || profile.username || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="user-info">
              <h2 className="user-name">
                {profile.displayName || profile.username || `FID: ${profile.fid}`}
              </h2>
              <div className="user-details">
                {profile.fid && (
                  <span className="user-fid">FID: {profile.fid}</span>
                )}
                {profile.wallet && (
                  <span 
                    className="user-wallet" 
                    title={profile.wallet}
                    onClick={() => {
                      navigator.clipboard.writeText(profile.wallet)
                      alert('Wallet address copied to clipboard!')
                    }}
                  >
                    {profile.wallet.slice(0, 6)}...{profile.wallet.slice(-4)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        
        <h2 className="stats-title">Your Statistics</h2>
        
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-value">{stats.total_games}</div>
            <div className="stat-label">Total Games</div>
          </div>
          
          <div className="stat-box">
            <div className="stat-value">{stats.completed_games}</div>
            <div className="stat-label">Completed Games</div>
          </div>
          
          <div className="stat-box">
            <div className="stat-value">{stats.average_attempts}</div>
            <div className="stat-label">Avg Attempts</div>
          </div>
          
          <div className="stat-box">
            <div className="stat-value">{stats.best_score || 'N/A'}</div>
            <div className="stat-label">Best Score</div>
          </div>
        </div>

        <div className="games-history">
          <h3>Recent Games</h3>
          {stats.games_history && stats.games_history.length > 0 ? (
            <div className="history-list">
              {stats.games_history.map((game, index) => (
                <div
                  key={index}
                  className={`history-item ${game.completed ? 'completed' : 'incomplete'}`}
                >
                  <div className="history-word">
                    {game.completed ? game.target_word : '???'}
                  </div>
                  <div className="history-details">
                    <span className="history-attempts">
                      {game.attempts} attempt{game.attempts !== 1 ? 's' : ''}
                    </span>
                    {game.daily_word && (
                      <span className="daily-badge">Daily</span>
                    )}
                    {game.completed && (
                      <span className="completed-badge">✓</span>
                    )}
                  </div>
                  <div className="history-date">
                    {new Date(game.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-history">No game history yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Stats
