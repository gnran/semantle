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

function Stats() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

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
        <h2>Your Statistics</h2>
        
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
