import React from 'react'
import './Header.css'

function Header({ currentView, setCurrentView, authState, onLogout }) {
  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getLoginMethodLabel = () => {
    if (authState.loginMethod === 'farcaster') {
      return 'Farcaster'
    } else if (authState.loginMethod === 'coinbase') {
      return 'Coinbase'
    }
    return 'Connected'
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
              {authState.address && (
                <span className="wallet-address" title={authState.address}>
                  {formatAddress(authState.address)}
                </span>
              )}
              {authState.username && (
                <span className="wallet-username">@{authState.username}</span>
              )}
              {!authState.address && !authState.username && authState.fid && (
                <span className="wallet-username">FID: {authState.fid}</span>
              )}
              <span className="login-method-badge">{getLoginMethodLabel()}</span>
              <button
                className="logout-button"
                onClick={onLogout}
                title="Logout"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="wallet-disconnected">
              <span className="not-connected">Not connected</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
