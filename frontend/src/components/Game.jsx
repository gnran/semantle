import React, { useState, useEffect } from 'react'
import axios from 'axios'
import GuessInput from './GuessInput'
import GuessList from './GuessList'
import GameInfo from './GameInfo'
import { getUserId } from '../utils/userId'
import './Game.css'

// Use environment variable for API URL, fallback to '/api' for local development
const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Warn in production if API URL is not configured
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn(
    '⚠️ VITE_API_URL is not set! API requests will fail in production. ' +
    'Please set VITE_API_URL environment variable in Vercel to your Railway backend URL.'
  )
}

// Check if debug mode is enabled (via URL parameter or localStorage)
const isDebugMode = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const urlDebug = urlParams.get('debug') === 'true'
  const storageDebug = localStorage.getItem('semantle_debug') === 'true'
  return urlDebug || storageDebug
}

// LocalStorage keys for game state persistence
const GAME_STATE_KEY = 'semantle_game_state'
const GAME_SESSION_KEY = 'semantle_game_session'

function Game({ sessionId, setSessionId }) {
  const [gameSession, setGameSession] = useState(null)
  const [guesses, setGuesses] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDaily, setIsDaily] = useState(false)
  const [debugMode, setDebugMode] = useState(isDebugMode())

  const saveGameState = (session, guessesList) => {
    try {
      localStorage.setItem(GAME_STATE_KEY, JSON.stringify({
        guesses: guessesList,
        timestamp: Date.now()
      }))
      localStorage.setItem(GAME_SESSION_KEY, JSON.stringify(session))
    } catch (err) {
      console.error('Error saving game state:', err)
    }
  }

  const clearGameState = () => {
    localStorage.removeItem(GAME_STATE_KEY)
    localStorage.removeItem(GAME_SESSION_KEY)
  }

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
    
    // Try to restore game state from localStorage
    const restoreGameState = async () => {
      const savedGameState = localStorage.getItem(GAME_STATE_KEY)
      const savedSession = localStorage.getItem(GAME_SESSION_KEY)
      
      if (savedGameState && savedSession) {
        try {
          const gameState = JSON.parse(savedGameState)
          const session = JSON.parse(savedSession)
          
          // Only restore if game is not completed
          if (!session.is_completed) {
            // Verify session still exists on backend
            try {
              const sessionResponse = await axios.get(
                `${API_BASE}/game/${session.session_id}?debug=${debugMode}`
              )
              // Session exists, restore state
              setGameSession(sessionResponse.data)
              setSessionId(session.session_id)
              setGuesses(gameState.guesses || [])
              setIsDaily(session.daily_word || false)
              return
            } catch (err) {
              // Session doesn't exist on backend (likely server restarted), clear saved state
              // Silently handle 404 errors as they're expected when sessions are lost
              if (err.response?.status !== 404) {
                console.error('Error verifying session:', err)
              }
              clearGameState()
            }
          } else {
            // Game was completed, clear saved state
            clearGameState()
          }
        } catch (err) {
          console.error('Error restoring game state:', err)
          // If restoration fails, clear invalid state and start new game
          clearGameState()
        }
      }
      
      // No saved state or game was completed, start new game
      startNewGame(false)
    }
    
    restoreGameState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startNewGame = async (daily = false) => {
    // Clear previous game state
    clearGameState()
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await axios.post(
        `${API_BASE}/game/new?debug=${debugMode}`,
        { daily }
      )
      
      setGameSession(response.data)
      setSessionId(response.data.session_id)
      setGuesses(response.data.attempts || [])
      setIsDaily(response.data.daily_word)
      
      // Save game state to localStorage
      saveGameState(response.data, response.data.attempts || [])
    } catch (err) {
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
      let updatedSession
      if (response.data.is_correct) {
        const sessionResponse = await axios.get(
          `${API_BASE}/game/${gameSession.session_id}?debug=${debugMode}`
        )
        updatedSession = sessionResponse.data
        setGameSession(updatedSession)
        
        // Game completed - clear saved state and save stats with user ID
        clearGameState()
        
        // Save stats with user ID
        try {
          const userId = await getUserId()
          await axios.post(`${API_BASE}/stats/save`, {
            user_id: userId,
            session_id: gameSession.session_id,
            target_word: updatedSession.target_word,
            attempts: updatedGuesses.length,
            completed: true,
            daily_word: updatedSession.daily_word
          })
        } catch (err) {
          console.error('Error saving stats:', err)
        }
      } else {
        // Update session attempts count
        updatedSession = {
          ...gameSession,
          attempts: updatedGuesses
        }
        setGameSession(updatedSession)
        
        // Save updated state
        saveGameState(updatedSession, updatedGuesses)
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
