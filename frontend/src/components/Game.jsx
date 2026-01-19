import React, { useState, useEffect } from 'react'
import axios from 'axios'
import GuessInput from './GuessInput'
import GuessList from './GuessList'
import GameInfo from './GameInfo'
import './Game.css'

// Use environment variable for API URL, fallback to '/api' for local development
const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Check if debug mode is enabled (via URL parameter or localStorage)
const isDebugMode = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const urlDebug = urlParams.get('debug') === 'true'
  const storageDebug = localStorage.getItem('semantle_debug') === 'true'
  return urlDebug || storageDebug
}

function Game({ sessionId, setSessionId }) {
  const [gameSession, setGameSession] = useState(null)
  const [guesses, setGuesses] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDaily, setIsDaily] = useState(false)
  const [debugMode, setDebugMode] = useState(isDebugMode())

  useEffect(() => {
    // Check URL for debug parameter and save to localStorage for persistence
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('debug') === 'true') {
      localStorage.setItem('semantle_debug', 'true')
      if (!debugMode) setDebugMode(true)
    } else if (urlParams.get('debug') === 'false') {
      localStorage.removeItem('semantle_debug')
      if (debugMode) setDebugMode(false)
    }
    
    startNewGame(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startNewGame = async (daily = false) => {
    setIsLoading(true)
    setError(null)
    try {
      // #region agent log
      const logData = {
        location: 'Game.jsx:25',
        message: 'Starting new game request',
        data: { daily, apiBase: API_BASE, fullUrl: `${API_BASE}/game/new` },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A'
      };
      fetch('http://127.0.0.1:7243/ingest/fc7a04ce-7d7a-4cb6-a696-c54c9d0711b1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      }).catch(() => {});
      // #endregion
      
      const response = await axios.post(
        `${API_BASE}/game/new?debug=${debugMode}`,
        { daily }
      )
      
      // #region agent log
      const logData2 = {
        location: 'Game.jsx:35',
        message: 'New game request successful',
        data: { status: response.status, hasData: !!response.data },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A'
      };
      fetch('http://127.0.0.1:7243/ingest/fc7a04ce-7d7a-4cb6-a696-c54c9d0711b1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData2)
      }).catch(() => {});
      // #endregion
      
      setGameSession(response.data)
      setSessionId(response.data.session_id)
      setGuesses(response.data.attempts || [])
      setIsDaily(response.data.daily_word)
    } catch (err) {
      // #region agent log
      const logData3 = {
        location: 'Game.jsx:48',
        message: 'New game request failed',
        data: {
          error: err.message,
          code: err.code,
          responseStatus: err.response?.status,
          responseData: err.response?.data,
          requestUrl: err.config?.url,
          requestBaseURL: err.config?.baseURL
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A'
      };
      fetch('http://127.0.0.1:7243/ingest/fc7a04ce-7d7a-4cb6-a696-c54c9d0711b1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData3)
      }).catch(() => {});
      // #endregion
      
      setError('Failed to start new game')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const makeGuess = async (word) => {
    if (!gameSession || gameSession.is_completed) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await axios.post(`${API_BASE}/game/guess`, {
        word: word,
        session_id: gameSession.session_id
      })

      // Update guesses list
      const updatedGuesses = [
        ...guesses,
        {
          word: word,
          similarity: response.data.similarity,
          rank: response.data.rank,
          is_correct: response.data.is_correct
        }
      ]
      setGuesses(updatedGuesses)

      // Update game session
      if (response.data.is_correct) {
        const sessionResponse = await axios.get(
          `${API_BASE}/game/${gameSession.session_id}?debug=${debugMode}`
        )
        setGameSession(sessionResponse.data)
      } else {
        // Update session attempts count
        setGameSession({
          ...gameSession,
          attempts: updatedGuesses
        })
      }
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data.detail || 'Invalid word')
      } else {
        setError('Failed to make guess')
      }
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const validateWord = async (word) => {
    try {
      const response = await axios.get(`${API_BASE}/words/validate/${word}`)
      return response.data.valid
    } catch {
      return false
    }
  }

  return (
    <div className="game-container">
      <div className="game-card">
        <GameInfo
          isDaily={isDaily}
          isCompleted={gameSession?.is_completed}
          attempts={guesses.length}
          targetWord={gameSession?.target_word}
          debugMode={debugMode}
        />

        {error && (
          <div className="error-message" onClick={() => setError(null)}>
            {error}
          </div>
        )}

        {!gameSession?.is_completed && (
          <GuessInput
            onGuess={makeGuess}
            onValidate={validateWord}
            isLoading={isLoading}
            disabled={gameSession?.is_completed}
          />
        )}

        {gameSession?.is_completed && (
          <div className="game-completed">
            <h2>🎉 Congratulations!</h2>
            <p>You found the word: <strong>{gameSession.target_word}</strong></p>
            <p>It took you {guesses.length} attempt{guesses.length !== 1 ? 's' : ''}</p>
            <button
              className="new-game-button"
              onClick={() => startNewGame(false)}
            >
              New Game
            </button>
            <button
              className="daily-game-button"
              onClick={() => startNewGame(true)}
            >
              Daily Challenge
            </button>
          </div>
        )}

        <GuessList guesses={guesses} targetWord={gameSession?.target_word} isCompleted={gameSession?.is_completed} />
      </div>
    </div>
  )
}

export default Game
