/**
 * User ID utility
 * Uses authenticated wallet address or Farcaster FID as user ID
 * Falls back to localStorage-based ID if not authenticated
 */

import { getUserId as getAuthUserId } from './auth'

const USER_ID_KEY = 'semantle_user_id'

/**
 * Get user ID from authenticated wallet or fallback to localStorage
 * @returns {Promise<string>} Unique user ID
 */
export async function getUserId() {
  try {
    // Try to get authenticated user ID first
    const authUserId = await getAuthUserId()
    
    // If we got a real address or FID (not a temp ID), use it
    if (authUserId && !authUserId.startsWith('temp_')) {
      return authUserId
    }
  } catch (error) {
    console.warn('Failed to get authenticated user ID, falling back to localStorage:', error)
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
 * Reset user ID (for testing purposes)
 */
export function resetUserId() {
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem('semantle_auth')
}
