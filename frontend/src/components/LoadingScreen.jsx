import React from 'react'
import './LoadingScreen.css'

function LoadingScreen({ message = 'Connecting...' }) {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  )
}

export default LoadingScreen
