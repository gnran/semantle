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
 * Connect with Farcaster and get wallet address if available
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
    
    // Log Farcaster context for debugging
    console.log('=== Farcaster Context ===')
    console.log('FID:', fid)
    console.log('Username:', username)
    console.log('Available user fields:', Object.keys(context.user))
    console.log('Full context keys:', Object.keys(context))
    console.log('========================')
    
    // Check if Quick Auth is available (for future use)
    if (sdk.quickAuth) {
      console.log('Quick Auth available:', !!sdk.quickAuth)
      console.log('Quick Auth methods:', Object.keys(sdk.quickAuth || {}))
    }
    
    // Try to get wallet address using Farcaster SDK's wallet provider
    // According to Base docs: https://docs.base.org/mini-apps/core-concepts/authentication
    // Wallet addresses must be obtained through the wallet provider
    let address = null
    let walletSource = null
    
    // Check if wallet methods are available
    console.log('=== Checking Farcaster Wallet Provider ===')
    console.log('sdk.wallet exists:', !!sdk.wallet)
    if (sdk.wallet) {
      console.log('sdk.wallet methods:', Object.keys(sdk.wallet))
      console.log('getEthereumProvider exists:', typeof sdk.wallet.getEthereumProvider === 'function')
    }
    
    try {
      // Method 1: Try to get Ethereum provider from Farcaster SDK
      if (sdk.wallet && typeof sdk.wallet.getEthereumProvider === 'function') {
        console.log('Getting Farcaster Ethereum provider...')
        const farcasterProvider = sdk.wallet.getEthereumProvider()
        console.log('Provider obtained:', !!farcasterProvider)
        console.log('Provider type:', typeof farcasterProvider)
        
        if (farcasterProvider) {
          // Check if provider has request method (EIP-1193 standard)
          if (typeof farcasterProvider.request === 'function') {
            try {
              // First try to get existing accounts (might already be connected)
              console.log('Requesting eth_accounts (checking for connected wallet)...')
              const accounts = await farcasterProvider.request({ method: 'eth_accounts' })
              console.log('eth_accounts result:', accounts)
              
              if (accounts && accounts.length > 0) {
                address = accounts[0]
                walletSource = 'farcaster'
                console.log('✅ Found Farcaster wallet address:', address)
              } else {
                // If no accounts, request connection (this will prompt user)
                console.log('No wallet connected, requesting connection via eth_requestAccounts...')
                try {
                  const requestedAccounts = await farcasterProvider.request({ method: 'eth_requestAccounts' })
                  console.log('eth_requestAccounts result:', requestedAccounts)
                  
                  if (requestedAccounts && requestedAccounts.length > 0) {
                    address = requestedAccounts[0]
                    walletSource = 'farcaster'
                    console.log('✅ Connected Farcaster wallet address:', address)
                  } else {
                    console.log('⚠️ No accounts returned from eth_requestAccounts')
                  }
                } catch (requestErr) {
                  console.log('⚠️ User rejected wallet connection or error:', requestErr.message)
                }
              }
            } catch (err) {
              console.log('❌ Farcaster wallet request failed:', err.message)
              console.error('Error details:', err)
            }
          } else {
            // Try alternative provider methods
            console.log('Provider does not have request method, checking for alternative methods...')
            if (typeof farcasterProvider.send === 'function') {
              console.log('Provider has send method, trying alternative approach...')
              try {
                const result = await farcasterProvider.send('eth_accounts', [])
                if (result && result.length > 0) {
                  address = result[0]
                  walletSource = 'farcaster'
                  console.log('✅ Found address via send method:', address)
                }
              } catch (err) {
                console.log('Alternative send method failed:', err.message)
              }
            }
          }
        } else {
          console.log('⚠️ getEthereumProvider returned null/undefined')
        }
      } else {
        console.log('⚠️ sdk.wallet.getEthereumProvider is not available')
      }
    } catch (err) {
      console.log('❌ Farcaster wallet provider error:', err.message)
      console.error('Error details:', err)
    }
    
    console.log('=== Wallet Provider Check Complete ===')
    console.log('Final address:', address)
    console.log('Wallet source:', walletSource)
    console.log('=====================================')
    
    // Note: Farcaster context does NOT contain wallet address fields
    // Wallet addresses must be obtained through sdk.wallet.getEthereumProvider()

    // Store auth state
    const authState = {
      fid,
      username,
      address: address || null,
      connected: true,
      loginMethod: 'farcaster',
      walletSource: walletSource,
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
      walletSource: 'coinbase',
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
            
            // Try to get/update wallet address using Farcaster SDK wallet provider
            // Note: Wallet addresses are NOT available in context - must use wallet provider
            let address = null
            let walletSource = null
            
            // Try Farcaster SDK wallet provider (only way to get wallet address)
            try {
              if (sdk.wallet && typeof sdk.wallet.getEthereumProvider === 'function') {
                const farcasterProvider = sdk.wallet.getEthereumProvider()
                if (farcasterProvider && typeof farcasterProvider.request === 'function') {
                  const accounts = await farcasterProvider.request({ method: 'eth_accounts' })
                  if (accounts && accounts.length > 0) {
                    address = accounts[0]
                    walletSource = 'farcaster'
                    console.log('getAuthState: Found Farcaster wallet address:', address)
                  } else {
                    console.log('getAuthState: No Farcaster wallet connected')
                  }
                }
              }
            } catch (err) {
              console.log('getAuthState: Farcaster wallet not available:', err.message)
            }
            
            // Note: Farcaster context does NOT contain wallet address fields
            // (custodyAddress, verifiedAddresses, walletAddress don't exist in context)
            
            // Update address if found
            if (address && address !== authState.address) {
              authState.address = address
              authState.walletSource = walletSource
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
