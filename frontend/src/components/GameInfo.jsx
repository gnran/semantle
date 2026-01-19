import React from 'react'
import './GameInfo.css'

function GameInfo({ isDaily, isCompleted, attempts, targetWord, debugMode = false }) {
  return (
    <div className="game-info">
      <div className="info-header">
        <h2>{isDaily ? '📅 Daily Challenge' : 'New Game'}</h2>
        {isCompleted && (
          <div className="completed-badge">Completed!</div>
        )}
        {debugMode && (
          <div className="debug-badge" title="Debug mode enabled - target word is visible">
            🐛 Debug
          </div>
        )}
      </div>
      <div className="info-stats">
        <div className="stat-item">
          <span className="stat-label">Attempts:</span>
          <span className="stat-value">{attempts}</span>
        </div>
        {targetWord && (
          <div className="stat-item">
            <span className="stat-label">Target Word:</span>
            <span className={`stat-value target-word ${debugMode && !isCompleted ? 'debug-word' : ''}`}>
              {targetWord}
            </span>
          </div>
        )}
      </div>
      {!isCompleted && (
        <p className="game-instructions">
          Guess words and find the secret word based on semantic similarity!
          Higher similarity scores mean you're closer to the target word.
        </p>
      )}
    </div>
  )
}

export default GameInfo
