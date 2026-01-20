/**
 * User ID utility
 * Uses Base Account address or Farcaster FID as user ID
 * Falls back to localStorage-based ID if not authenticated
 */

import { sdk } from '@farcaster/miniapp-sdk'

const USER_ID_KEY = 'semantle_user_id'

/**
 * Get user ID from Base Account or Farcaster FID
 * Note: This function should be called from a component that has access to Wagmi hooks
 * For components, use useAccount hook directly and get FID from Farcaster SDK
 * @returns {Promise<string>} Unique user ID
 */
export async function getUserId() {
  try {
    // Try to get Farcaster FID first
    const context = await sdk.context
    if (context?.user?.fid) {
      return `fid_${context.user.fid}`
    }
  } catch (error) {
    console.warn('Failed to get Farcaster FID:', error)
  }

  // Fallback to localStorage-based ID
  let userId = localStorage.getItem(USER_ID_KEY)
  
  if (!userId) {
    // Generate a unique ID using timestamp and random number
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(USER_ID_KEY, userId)
  }
  
  return userId
}

/**
 * Get user ID from Base Account address (for use in components with Wagmi)
 * @param {string} address - Base Account address from useAccount hook
 * @returns {Promise<string>} User ID (address or FID)
 */
export async function getUserIdFromAccount(address) {
  // Prefer Base Account address if available
  if (address) {
    return address.toLowerCase()
  }

  // Fallback to FID
  try {
    const context = await sdk.context
    if (context?.user?.fid) {
      return `fid_${context.user.fid}`
    }
  } catch (error) {
    console.warn('Failed to get Farcaster FID:', error)
  }

  // Last resort: localStorage
  let userId = localStorage.getItem(USER_ID_KEY)
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(USER_ID_KEY, userId)
  }
  
  return userId
}

/**
 * Reset user ID (for testing purposes)
 */
export function resetUserId() {
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem('semantle_auth')
}
