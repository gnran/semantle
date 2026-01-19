import React from 'react'
import './GuessList.css'

function GuessList({ guesses, targetWord, isCompleted }) {
  if (guesses.length === 0) {
    return (
      <div className="guess-list-empty">
        <p>No guesses yet. Start guessing to see your results!</p>
      </div>
    )
  }

  // Sort guesses by similarity (highest first) to calculate proximity ranks
  const sortedGuesses = [...guesses].sort((a, b) => b.similarity - a.similarity)

  // Calculate proximity: based on rank position, with decreasing values
  // For very low proximity, we'll show descriptive text
  const calculateProximity = (rank, similarity, maxSimilarity) => {
    if (rank === 1) return 1000
    
    // Use similarity score to calculate proximity more accurately
    // Higher similarity = higher proximity
    // Scale similarity to 0-1000 range
    const normalizedSimilarity = similarity / maxSimilarity
    let proximity = normalizedSimilarity * 1000
    
    // Adjust based on rank to create more realistic distribution
    // Top ranks get very high proximity, lower ranks get lower
    const rankPenalty = (rank - 1) * 2
    proximity = Math.max(0, proximity - rankPenalty)
    
    // For very low proximity, show descriptive text
    if (proximity < 200) return 'cold'
    if (proximity < 500) return 'tepid'
    
    // Round to nearest integer for display
    return Math.round(proximity)
  }
  
  // Get max similarity for proximity calculation
  const maxSimilarity = sortedGuesses.length > 0 ? sortedGuesses[0].similarity : 1

  // Create a map of word to proximity rank (1-based, lower = closer)
  const proximityMap = new Map()
  sortedGuesses.forEach((guess, index) => {
    proximityMap.set(guess.word, index + 1)
  })

  // Find the target word guess if completed
  const targetGuess = isCompleted && targetWord 
    ? guesses.find(g => g.word === targetWord) || { word: targetWord, similarity: 1.0, is_correct: true }
    : null

  // Get sorted list for display (excluding target if showing separately)
  const displayGuesses = sortedGuesses.filter(g => !(isCompleted && g.word === targetWord))

  return (
    <div className="guess-list">
      {targetGuess && (
        <div className="target-word-row">
          <div className="target-word-number">{guesses.length}</div>
          <div className="target-word-text">{targetWord}</div>
          <div className="target-word-similarity">100.00</div>
          <div className="target-word-proximity">
            <span className="proximity-flag">🚩</span>
          </div>
        </div>
      )}
      
      <div className="sort-indicator">Sort - Similarity</div>
      
      <div className="guess-list-header">
        <div className="header-item">#</div>
        <div className="header-item">Guess</div>
        <div className="header-item">Similarity</div>
        <div className="header-item">Proximity</div>
      </div>
      <div className="guess-items">
        {displayGuesses.map((guess, index) => {
          const similarityScore = (guess.similarity * 100).toFixed(2)
          const rank = proximityMap.get(guess.word) || guesses.length
          const proximity = calculateProximity(rank, guess.similarity, maxSimilarity)
          const proximityValue = typeof proximity === 'number' ? proximity : 0
          const isHighProximity = proximityValue >= 500

          return (
            <div
              key={`${guess.word}-${index}`}
              className={`guess-item ${guess.is_correct ? 'correct' : ''}`}
            >
              <div className="guess-rank">{guesses.findIndex(g => g.word === guess.word) + 1}</div>
              <div className="guess-word">
                {guess.word}
              </div>
              <div className="guess-similarity">
                {similarityScore}
              </div>
              <div className="guess-proximity">
                {typeof proximity === 'number' ? (
                  <>
                    <div className={`proximity-bar ${isHighProximity ? 'high' : 'low'}`} 
                         style={{ width: `${(proximity / 1000) * 100}%` }}></div>
                    <span className="proximity-value">{proximity} / 1000</span>
                  </>
                ) : (
                  <span className={`proximity-text ${proximity}`}>({proximity})</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default GuessList
