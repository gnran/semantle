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
    
    // Log Farcaster context fields for debugging
    console.log('=== Farcaster Context Fields ===')
    console.log('Full context:', context)
    console.log('Context keys:', Object.keys(context || {}))
    console.log('User object:', context.user)
    console.log('User object keys:', Object.keys(context.user || {}))
    console.log('User object (JSON):', JSON.stringify(context.user, null, 2))
    console.log('custodyAddress:', context.user.custodyAddress)
    console.log('verifiedAddresses:', context.user.verifiedAddresses)
    console.log('walletAddress:', context.user.walletAddress)
    // Check for alternative field names
    console.log('All user properties:', Object.getOwnPropertyNames(context.user || {}))
    console.log('================================')
    
    // Try to get wallet address using Farcaster SDK's wallet methods
    let address = null
    let walletSource = null
    
    try {
      // Method 1: Try to get Ethereum provider from Farcaster SDK (PRIORITY)
      console.log('=== Checking Farcaster Wallet Provider ===')
      console.log('sdk.wallet exists:', !!sdk.wallet)
      console.log('sdk.wallet methods:', sdk.wallet ? Object.keys(sdk.wallet) : 'N/A')
      
      if (sdk.wallet && typeof sdk.wallet.getEthereumProvider === 'function') {
        console.log('getEthereumProvider function exists')
        const farcasterProvider = sdk.wallet.getEthereumProvider()
        console.log('Farcaster provider:', farcasterProvider)
        console.log('Provider type:', typeof farcasterProvider)
        
        if (farcasterProvider && typeof farcasterProvider.request === 'function') {
          try {
            // First try to get existing accounts (might already be connected)
            console.log('Requesting eth_accounts...')
            const accounts = await farcasterProvider.request({ method: 'eth_accounts' })
            console.log('eth_accounts result:', accounts)
            
            if (accounts && accounts.length > 0) {
              address = accounts[0]
              walletSource = 'farcaster'
              console.log('Found address from eth_accounts:', address)
            } else {
              // If no accounts, request connection
              console.log('No accounts found, requesting eth_requestAccounts...')
              const requestedAccounts = await farcasterProvider.request({ method: 'eth_requestAccounts' })
              console.log('eth_requestAccounts result:', requestedAccounts)
              
              if (requestedAccounts && requestedAccounts.length > 0) {
                address = requestedAccounts[0]
                walletSource = 'farcaster'
                console.log('Found address from eth_requestAccounts:', address)
              } else {
                console.log('No accounts returned from eth_requestAccounts')
              }
            }
          } catch (err) {
            console.log('Farcaster wallet connection failed:', err)
            console.error('Error details:', err)
          }
        } else {
          console.log('Provider request method not available')
        }
      } else {
        console.log('getEthereumProvider function not available')
      }
      console.log('=========================================')
    } catch (err) {
      console.log('Farcaster wallet provider not available:', err)
      console.error('Error details:', err)
    }
    
    // Method 2: Try to get address from Farcaster context fields (fallback)
    if (!address && context.user) {
      console.log('Checking Farcaster context fields for address...')
      console.log('custodyAddress:', context.user.custodyAddress)
      console.log('verifiedAddresses:', context.user.verifiedAddresses)
      console.log('walletAddress:', context.user.walletAddress)
      
      if (context.user.custodyAddress) {
        address = context.user.custodyAddress
        walletSource = 'farcaster_context'
        console.log('Using custodyAddress:', address)
      } else if (context.user.verifiedAddresses && context.user.verifiedAddresses.length > 0) {
        address = context.user.verifiedAddresses[0]
        walletSource = 'farcaster_context'
        console.log('Using verifiedAddresses[0]:', address)
      } else if (context.user.walletAddress) {
        address = context.user.walletAddress
        walletSource = 'farcaster_context'
        console.log('Using walletAddress:', address)
      } else {
        console.log('No address found in Farcaster context fields')
      }
    }

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
            
            // Log Farcaster context fields for debugging
            console.log('=== getAuthState: Farcaster Context Fields ===')
            console.log('Full context:', context)
            console.log('Context keys:', Object.keys(context || {}))
            console.log('User object:', context.user)
            console.log('User object keys:', Object.keys(context.user || {}))
            console.log('User object (JSON):', JSON.stringify(context.user, null, 2))
            console.log('custodyAddress:', context.user.custodyAddress)
            console.log('verifiedAddresses:', context.user.verifiedAddresses)
            console.log('walletAddress:', context.user.walletAddress)
            // Check for alternative field names
            console.log('All user properties:', Object.getOwnPropertyNames(context.user || {}))
            console.log('===============================================')
            
            // Try to get/update wallet address using Farcaster SDK wallet methods
            let address = null
            let walletSource = null
            
            // Method 1: Try Farcaster SDK wallet provider (PRIORITY)
            try {
              if (sdk.wallet && typeof sdk.wallet.getEthereumProvider === 'function') {
                const farcasterProvider = sdk.wallet.getEthereumProvider()
                if (farcasterProvider && typeof farcasterProvider.request === 'function') {
                  const accounts = await farcasterProvider.request({ method: 'eth_accounts' })
                  if (accounts && accounts.length > 0) {
                    address = accounts[0]
                    walletSource = 'farcaster'
                  }
                }
              }
            } catch (err) {
              // Farcaster wallet not available
            }
            
            // Method 2: Try context fields as fallback (Farcaster addresses)
            if (!address && context.user) {
              console.log('getAuthState: Checking Farcaster context fields for address...')
              console.log('custodyAddress:', context.user.custodyAddress)
              console.log('verifiedAddresses:', context.user.verifiedAddresses)
              console.log('walletAddress:', context.user.walletAddress)
              
              if (context.user.custodyAddress) {
                address = context.user.custodyAddress
                walletSource = 'farcaster_context'
                console.log('getAuthState: Using custodyAddress:', address)
              } else if (context.user.verifiedAddresses && context.user.verifiedAddresses.length > 0) {
                address = context.user.verifiedAddresses[0]
                walletSource = 'farcaster_context'
                console.log('getAuthState: Using verifiedAddresses[0]:', address)
              } else if (context.user.walletAddress) {
                address = context.user.walletAddress
                walletSource = 'farcaster_context'
                console.log('getAuthState: Using walletAddress:', address)
              } else {
                console.log('getAuthState: No address found in Farcaster context fields')
              }
            }
            
            // DON'T fallback to Base Account SDK - keep Farcaster wallet only
            
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
