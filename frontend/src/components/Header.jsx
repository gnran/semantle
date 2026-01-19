import React from 'react'
import './Header.css'

function Header({ currentView, setCurrentView, authState, onConnectWallet, isConnecting }) {
  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

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
        <div className="wallet-section">
          {authState.connected ? (
            <div className="wallet-connected">
              <span className="wallet-address" title={authState.address}>
                {formatAddress(authState.address)}
              </span>
              {authState.username && (
                <span className="wallet-username">@{authState.username}</span>
              )}
            </div>
          ) : (
            <button
              className="connect-wallet-button"
              onClick={onConnectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
