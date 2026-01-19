import React from 'react'
import './LoginModal.css'

function LoginModal({ onFarcasterLogin, onCoinbaseLogin, isConnecting }) {
  return (
    <div className="login-modal-overlay">
      <div className="login-modal">
        <div className="login-modal-header">
          <h2>Welcome to Semantle</h2>
          <p>Choose your login method to continue</p>
        </div>
        
        <div className="login-options">
          <button
            className="login-option farcaster-option"
            onClick={onFarcasterLogin}
            disabled={isConnecting}
          >
            <div className="login-option-icon">🔷</div>
            <div className="login-option-content">
              <h3>Farcaster</h3>
              <p>Sign in with your Farcaster account</p>
            </div>
            {isConnecting && <div className="login-option-loading">...</div>}
          </button>

          <button
            className="login-option coinbase-option"
            onClick={onCoinbaseLogin}
            disabled={isConnecting}
          >
            <div className="login-option-icon">💎</div>
            <div className="login-option-content">
              <h3>Coinbase Wallet</h3>
              <p>Connect your Base wallet</p>
            </div>
            {isConnecting && <div className="login-option-loading">...</div>}
          </button>
        </div>

        <div className="login-modal-footer">
          <p className="login-info">
            Your progress will be saved to your account
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginModal
