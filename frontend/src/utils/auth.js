/**
 * Base Mini App Authentication Utility
 * Handles Quick Auth authentication using Farcaster's identity system
 * Reference: https://docs.base.org/mini-apps/core-concepts/authentication
 */

import { sdk } from '@farcaster/miniapp-sdk'

// Use environment variable for API URL, fallback to '/api' for local development
const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Store JWT token in memory (not localStorage for security)
let authToken = null
let authState = null

/**
 * Initialize authentication (no-op for Quick Auth)
 */
export function initializeAuth() {
  // Quick Auth doesn't require initialization
  return true
}

/**
 * Connect with Farcaster using Quick Auth
 * @returns {Promise<{fid: number, username?: string, address?: string, connected: boolean, token: string}>}
 */
export async function connectFarcaster() {
  try {
    // Get JWT token from Quick Auth
    const { token } = await sdk.quickAuth.getToken()
    authToken = token

    // Get Farcaster user context for additional info
    const context = await sdk.context
    const username = context?.user?.username || null
    
    // Try to get wallet address from Farcaster context
    let address = null
    if (context?.user) {
      if (context.user.custodyAddress) {
        address = context.user.custodyAddress
      } else if (context.user.verifiedAddresses && context.user.verifiedAddresses.length > 0) {
        address = context.user.verifiedAddresses[0]
      } else if (context.user.walletAddress) {
        address = context.user.walletAddress
      }
    }

    // Verify token with backend and get authenticated user data
    let fid = null
    try {
      // Use regular fetch since sdk.quickAuth.fetch might not be available
      const response = await fetch(`${API_BASE}/auth`, {
        method: 'GET',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      
      if (!response.ok) {
        throw new Error(`Auth verification failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      fid = data.fid
      
      // Update address if provided by backend
      if (data.address) {
        address = data.address
      }
    } catch (err) {
      console.error('Failed to verify token with backend:', err)
      // Still proceed with context data if backend verification fails
      if (context?.user?.fid) {
        fid = context.user.fid
      } else {
        throw new Error('Could not get FID from backend or context')
      }
    }

    // Store auth state
    authState = {
      fid,
      username,
      address: address || null,
      connected: true,
      loginMethod: 'farcaster',
      connectedAt: Date.now(),
      token: token
    }

    // Store minimal auth info in localStorage (without token for security)
    localStorage.setItem('semantle_auth', JSON.stringify({
      fid,
      username,
      address: address || null,
      connected: true,
      loginMethod: 'farcaster',
      connectedAt: Date.now()
    }))

    return authState
  } catch (error) {
    console.error('Failed to connect with Farcaster:', error)
    authToken = null
    authState = null
    throw error
  }
}

/**
 * Connect wallet and authenticate user (uses Quick Auth)
 * @returns {Promise<{address?: string, fid: number, username?: string, connected: boolean}>}
 */
export async function connectWallet() {
  // Use Quick Auth for wallet connections too
  // The wallet address will be available from Farcaster context if connected
  return await connectFarcaster()
}

/**
 * Get current authentication state
 * @returns {Promise<{address?: string, fid?: number, username?: string, loginMethod?: string, connected: boolean}>}
 */
export async function getAuthState() {
  try {
    // Return cached auth state if available
    if (authState && authToken) {
      return { ...authState, connected: true }
    }

    // Check localStorage for saved auth
    const savedAuth = localStorage.getItem('semantle_auth')
    if (savedAuth) {
      const savedState = JSON.parse(savedAuth)
      
      // Try to verify token is still valid
      if (savedState.fid) {
        try {
          // Get fresh context to verify user is still the same
          const context = await sdk.context
          if (context?.user && context.user.fid === savedState.fid) {
            // Update with latest context data
            const updatedState = {
              ...savedState,
              username: context.user.username || savedState.username,
              connected: true
            }
            
            // Try to get wallet address from context
            let address = null
            if (context.user.custodyAddress) {
              address = context.user.custodyAddress
            } else if (context.user.verifiedAddresses && context.user.verifiedAddresses.length > 0) {
              address = context.user.verifiedAddresses[0]
            } else if (context.user.walletAddress) {
              address = context.user.walletAddress
            }
            
            if (address) {
              updatedState.address = address
            }
            
            // Cache the state
            authState = updatedState
            return updatedState
          }
        } catch (err) {
          console.warn('Could not verify auth state:', err)
        }
      }
    }

    // Try to get Farcaster context even if not saved
    try {
      const context = await sdk.context
      if (context?.user) {
        return {
          fid: context.user.fid,
          username: context.user.username,
          connected: false
        }
      }
    } catch (err) {
      // Ignore errors
    }

    return { connected: false }
  } catch (error) {
    console.error('Failed to get auth state:', error)
    return { connected: false }
  }
}

/**
 * Disconnect and clear authentication
 */
export async function disconnectWallet() {
  try {
    authToken = null
    authState = null
    localStorage.removeItem('semantle_auth')
  } catch (error) {
    console.error('Failed to disconnect:', error)
  }
}

/**
 * Get user ID from authenticated Farcaster FID or wallet address
 * @returns {Promise<string>}
 */
export async function getUserId() {
  try {
    const state = await getAuthState()
    
    // Use Farcaster FID as primary user ID (from Quick Auth)
    if (state.fid) {
      return `fid_${state.fid}`
    }
    
    // Fallback to wallet address if available
    if (state.address) {
      return state.address.toLowerCase()
    }
    
    // Last resort: generate a temporary ID (should prompt for auth)
    console.warn('No authenticated user found, using temporary ID')
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  } catch (error) {
    console.error('Failed to get user ID:', error)
    // Fallback to temporary ID
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Get current JWT token (for authenticated API requests)
 * @returns {string|null}
 */
export function getAuthToken() {
  return authToken
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  const state = await getAuthState()
  return state.connected === true && !!state.fid && !!authToken
}
