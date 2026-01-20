/**
 * Farcaster Mini App Authentication Utility
 * Handles wallet authentication using Farcaster SDK (similar to Wordle implementation)
 */

import { sdk } from '@farcaster/miniapp-sdk'

/**
 * Get Ethereum provider from Farcaster SDK
 * This is the primary method for getting wallet access in Farcaster mini apps
 */
export async function getEthereumProvider() {
  try {
    const provider = await sdk.wallet.getEthereumProvider()
    return provider
  } catch (error) {
    console.error('Failed to get Ethereum provider from Farcaster SDK:', error)
    return null
  }
}

/**
 * Get wallet address from provider
 * Tries to get already connected accounts first, then requests if needed
 */
export async function getWalletAddress(provider) {
  if (!provider) {
    return null
  }

  try {
    // First try to get already connected accounts (without requesting permission)
    let accounts = await provider.request({ method: 'eth_accounts' })
    
    // If no accounts, try to request (may show user prompt)
    if (!accounts || accounts.length === 0) {
      try {
        accounts = await provider.request({ method: 'eth_requestAccounts' })
      } catch (requestError) {
        // User may reject the request - this is normal
        console.log('User did not provide wallet access')
        return null
      }
    }
    
    if (accounts && accounts.length > 0) {
      return accounts[0]
    }
    
    return null
  } catch (error) {
    console.warn('Failed to get wallet address:', error)
    return null
  }
}

/**
 * Connect with Farcaster and get wallet address if available
 * Uses Farcaster SDK directly (similar to Wordle implementation)
 * @returns {Promise<{fid: number, username?: string, displayName?: string, pfpUrl?: string, address?: string, connected: boolean}>}
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
    const displayName = context.user.displayName || null
    const pfpUrl = context.user.pfpUrl || null
    
    // Get wallet address using Farcaster SDK's wallet methods (like Wordle)
    let walletAddress = null
    
    try {
      const provider = await getEthereumProvider()
      if (provider) {
        walletAddress = await getWalletAddress(provider)
      }
    } catch (error) {
      console.warn('Failed to get wallet address:', error)
    }

    // Store auth state
    const authState = {
      fid,
      username,
      displayName,
      pfpUrl,
      address: walletAddress || null,
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
 * Uses Farcaster SDK wallet methods (like Wordle)
 * @returns {Promise<{address: string, fid?: number, username?: string, displayName?: string, pfpUrl?: string}>}
 */
export async function connectWallet() {
  try {
    // Get provider from Farcaster SDK
    const provider = await getEthereumProvider()
    if (!provider) {
      throw new Error('Farcaster wallet provider not available')
    }

    // Get wallet address
    const address = await getWalletAddress(provider)
    if (!address) {
      throw new Error('No wallet address available')
    }

    // Get Farcaster user context if available
    let fid = null
    let username = null
    let displayName = null
    let pfpUrl = null
    
    try {
      const context = await sdk.context
      if (context?.user) {
        fid = context.user.fid
        username = context.user.username
        displayName = context.user.displayName
        pfpUrl = context.user.pfpUrl
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
      displayName,
      pfpUrl,
      connected: true,
      loginMethod: 'farcaster',
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
 * Uses Farcaster SDK directly (like Wordle)
 * @returns {Promise<{address?: string, fid?: number, username?: string, displayName?: string, pfpUrl?: string, loginMethod?: string, connected: boolean}>}
 */
export async function getAuthState() {
  try {
    // Check if already connected (from localStorage)
    const savedAuth = localStorage.getItem('semantle_auth')
    if (savedAuth) {
      const authState = JSON.parse(savedAuth)
      
      // Verify Farcaster context matches
      try {
        const context = await sdk.context
        if (context?.user && context.user.fid === authState.fid) {
          // Update user info from context
          authState.username = context.user.username || authState.username
          authState.displayName = context.user.displayName || authState.displayName
          authState.pfpUrl = context.user.pfpUrl || authState.pfpUrl
          
          // Try to get/update wallet address using Farcaster SDK
          try {
            const provider = await getEthereumProvider()
            if (provider) {
              const address = await getWalletAddress(provider)
              if (address) {
                authState.address = address
              }
            }
          } catch (err) {
            // Wallet not available, that's okay
            console.log('Could not get wallet address:', err)
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

    // Try to get Farcaster context even if not saved
    try {
      const context = await sdk.context
      if (context?.user) {
        // Try to get wallet address
        let walletAddress = null
        try {
          const provider = await getEthereumProvider()
          if (provider) {
            walletAddress = await getWalletAddress(provider)
          }
        } catch (err) {
          // Wallet not available
        }
        
        return {
          fid: context.user.fid,
          username: context.user.username,
          displayName: context.user.displayName,
          pfpUrl: context.user.pfpUrl,
          address: walletAddress,
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
    // Farcaster SDK wallet connection persists until user manually disconnects
    // We just clear our local state
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

/**
 * Get the Ethereum provider (wrapped in ethers BrowserProvider format)
 * Uses Farcaster SDK wallet (like Wordle)
 * @returns {Promise<BrowserProvider|null>} Ethers BrowserProvider or null if not available
 */
export async function getProvider() {
  try {
    const provider = await getEthereumProvider()
    if (!provider) {
      return null
    }

    // Import ethers dynamically to avoid circular dependencies
    const { BrowserProvider } = await import('ethers')
    
    // Wrap the provider in ethers BrowserProvider (like Wordle)
    return new BrowserProvider(provider)
  } catch (error) {
    console.error('Failed to get provider:', error)
    return null
  }
}
