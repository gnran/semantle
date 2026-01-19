/**
 * User ID utility
 * Generates and stores a unique user ID in localStorage
 */

const USER_ID_KEY = 'semantle_user_id'

/**
 * Get or create a unique user ID
 * @returns {string} Unique user ID
 */
export function getUserId() {
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
}
