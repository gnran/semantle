import React, { useState } from 'react'
import './GuessInput.css'

function GuessInput({ onGuess, onValidate, isLoading, disabled }) {
  const [word, setWord] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!word.trim() || isLoading || disabled) return

    const wordLower = word.trim().toLowerCase()
    setIsValidating(true)

    try {
      const isValid = await onValidate(wordLower)
      if (isValid) {
        await onGuess(wordLower)
        setWord('')
      } else {
        alert('Word not in vocabulary. Please try another word.')
      }
    } catch (error) {
      console.error('Validation error:', error)
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <form className="guess-input" onSubmit={handleSubmit}>
      <div className="input-container">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value.toLowerCase())}
          placeholder="Enter a word..."
          className="guess-field"
          disabled={isLoading || isValidating || disabled}
          maxLength={20}
          autoFocus
        />
        <button
          type="submit"
          className="guess-button"
          disabled={isLoading || isValidating || disabled || !word.trim()}
        >
          {isLoading || isValidating ? 'Checking...' : 'Guess'}
        </button>
      </div>
    </form>
  )
}

export default GuessInput
