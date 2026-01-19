import React from 'react'
import './Header.css'

function Header({ currentView, setCurrentView }) {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo" onClick={() => setCurrentView('game')}>
          Semantle
        </h1>
        <nav className="nav">
          <button
            className={`nav-button ${currentView === 'game' ? 'active' : ''}`}
            onClick={() => setCurrentView('game')}
          >
            Game
          </button>
          <button
            className={`nav-button ${currentView === 'stats' ? 'active' : ''}`}
            onClick={() => setCurrentView('stats')}
          >
            Statistics
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
