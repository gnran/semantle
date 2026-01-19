/**
 * Base Mini App Authentication Utility
 * Handles Coinbase Wallet (Base Account) authentication for Base mini apps
 */

import { createBaseAccountSDK } from '@base-org/account'
import { sdk } from '@farcaster/miniapp-sdk'

// Base mainnet chain ID
const BASE_CHAIN_ID = 8453

// Initialize Base Account SDK
let baseAccountSDK = null
let provider = null
let isInitialized = false

/**
 * Initialize Base Account SDK
 */
export function initializeAuth() {
  if (isInitialized && baseAccountSDK) {
    return baseAccountSDK
  }

  try {
    baseAccountSDK = createBaseAccountSDK({
      appName: 'Semantle',
      appLogoUrl: 'https://semantle.vercel.app/favicon1.png',
      appChainIds: [BASE_CHAIN_ID],
      subAccounts: {
        creation: 'on-connect',
        defaultAccount: 'sub',
        funding: 'spend-permissions'
      }
    })

    provider = baseAccountSDK.getProvider()
    isInitialized = true

    return baseAccountSDK
  } catch (error) {
    console.error('Failed to initialize Base Account SDK:', error)
    throw error
  }
}

/**
 * Connect with Farcaster only (no wallet required)
 * @returns {Promise<{fid: number, username?: string, address?: string, connected: boolean}>}
 */
export async function connectFarcaster() {
  try {
    // Get Farcaster user context
    const context = await sdk.context
    
    if (!context?.user) {
      throw new Error('Farcaster user context not available')
    }

    const fid = context.user.fid
    const username = context.user.username || null
    
    // Try to get wallet address from Farcaster context
    // Check for custodyAddress, verifiedAddresses, or walletAddress fields
    let address = null
    if (context.user.custodyAddress) {
      address = context.user.custodyAddress
    } else if (context.user.verifiedAddresses && context.user.verifiedAddresses.length > 0) {
      // Use first verified address if custody address is not available
      address = context.user.verifiedAddresses[0]
    } else if (context.user.walletAddress) {
      address = context.user.walletAddress
    }
    
    // Also try to get wallet address from Base Account SDK if available
    if (!address) {
      try {
        // Initialize SDK if not already done
        if (!isInitialized) {
          initializeAuth()
        }
        
        if (provider) {
          const accounts = await provider.request({ method: 'eth_accounts' })
          if (accounts && accounts.length > 0) {
            address = accounts[0]
          }
        }
      } catch (err) {
        // Wallet not connected, that's okay for Farcaster-only login
        console.log('No wallet connected via Base Account SDK')
      }
    }

    // Store auth state
    const authState = {
      fid,
      username,
      address: address || null,
      connected: true,
      loginMethod: 'farcaster',
      connectedAt: Date.now()
    }

    localStorage.setItem('semantle_auth', JSON.stringify(authState))

    return authState
  } catch (error) {
    console.error('Failed to connect with Farcaster:', error)
    throw error
  }
}

/**
 * Connect wallet and authenticate user
 * @returns {Promise<{address: string, fid?: number, username?: string}>}
 */
export async function connectWallet() {
  try {
    // Initialize SDK if not already done
    if (!isInitialized) {
      initializeAuth()
    }

    if (!provider) {
      throw new Error('Base Account SDK provider not available')
    }

    // Request account connection
    const accounts = await provider.request({ method: 'eth_requestAccounts' })
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from wallet')
    }

    const address = accounts[0]

    // Get Farcaster user context if available
    let fid = null
    let username = null
    
    try {
      const context = await sdk.context
      if (context?.user) {
        fid = context.user.fid
        username = context.user.username
      }
    } catch (err) {
      console.warn('Could not get Farcaster context:', err)
      // Continue without Farcaster context
    }

    // Store auth state
    const authState = {
      address,
      fid,
      username,
      connected: true,
      loginMethod: 'coinbase',
      connectedAt: Date.now()
    }

    localStorage.setItem('semantle_auth', JSON.stringify(authState))

    return authState
  } catch (error) {
    console.error('Failed to connect wallet:', error)
    throw error
  }
}

/**
 * Get current authentication state
 * @returns {Promise<{address?: string, fid?: number, username?: string, loginMethod?: string, connected: boolean}>}
 */
export async function getAuthState() {
  try {
    // Initialize provider if not already done
    if (!isInitialized) {
      try {
        initializeAuth()
      } catch (err) {
        console.warn('Could not initialize auth SDK:', err)
      }
    }

    // Check if already connected
    const savedAuth = localStorage.getItem('semantle_auth')
    if (savedAuth) {
      const authState = JSON.parse(savedAuth)
      
      // If logged in with Farcaster only, verify Farcaster context
      if (authState.loginMethod === 'farcaster') {
        try {
          const context = await sdk.context
          if (context?.user && context.user.fid === authState.fid) {
            // Update username if available
            authState.username = context.user.username || authState.username
            
            // Try to get/update wallet address from Farcaster context
            let address = null
            if (context.user.custodyAddress) {
              address = context.user.custodyAddress
            } else if (context.user.verifiedAddresses && context.user.verifiedAddresses.length > 0) {
              address = context.user.verifiedAddresses[0]
            } else if (context.user.walletAddress) {
              address = context.user.walletAddress
            }
            
            // Also try to get wallet address from Base Account SDK if not found
            if (!address) {
              try {
                if (!isInitialized) {
                  initializeAuth()
                }
                if (provider) {
                  const accounts = await provider.request({ method: 'eth_accounts' })
                  if (accounts && accounts.length > 0) {
                    address = accounts[0]
                  }
                }
              } catch (err) {
                // Wallet not connected, that's okay
              }
            }
            
            // Update address if found
            if (address && address !== authState.address) {
              authState.address = address
            }
            
            localStorage.setItem('semantle_auth', JSON.stringify(authState))
            return { ...authState, connected: true }
          } else {
            // Farcaster context changed or unavailable, clear auth
            localStorage.removeItem('semantle_auth')
            return { connected: false }
          }
        } catch (err) {
          console.warn('Could not verify Farcaster connection:', err)
          // If we can't verify, assume still connected (might be temporary issue)
          return { ...authState, connected: true }
        }
      }
      
      // If logged in with Coinbase wallet, verify wallet connection
      if (authState.loginMethod === 'coinbase' && authState.address) {
        if (provider) {
          try {
            const accounts = await provider.request({ method: 'eth_accounts' })
            if (accounts && accounts.length > 0 && accounts[0] === authState.address) {
              // Update Farcaster context if available
              try {
                const context = await sdk.context
                if (context?.user) {
                  authState.fid = context.user.fid
                  authState.username = context.user.username
                  localStorage.setItem('semantle_auth', JSON.stringify(authState))
                }
              } catch (err) {
                // Ignore Farcaster context errors
              }
              
              return { ...authState, connected: true }
            }
          } catch (err) {
            console.warn('Could not verify wallet connection:', err)
          }
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
 * Disconnect wallet
 */
export async function disconnectWallet() {
  try {
    localStorage.removeItem('semantle_auth')
    
    if (provider) {
      // Base Account SDK doesn't have a standard disconnect method
      // The connection persists until user manually disconnects in wallet
      // We just clear our local state
    }
  } catch (error) {
    console.error('Failed to disconnect wallet:', error)
  }
}

/**
 * Get user ID from authenticated wallet address or Farcaster FID
 * @returns {Promise<string>}
 */
export async function getUserId() {
  try {
    const authState = await getAuthState()
    
    // Prefer wallet address as user ID (Coinbase login)
    if (authState.address) {
      return authState.address.toLowerCase()
    }
    
    // Use Farcaster FID (Farcaster login)
    if (authState.fid) {
      return `fid_${authState.fid}`
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
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  const authState = await getAuthState()
  return authState.connected === true && (!!authState.address || !!authState.fid)
}
