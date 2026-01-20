/**
 * Smart Contract Integration Utility
 * Handles interaction with SemantleStats contract on Base blockchain
 */

import { ethers } from 'ethers';

// Contract ABI (Application Binary Interface)
const CONTRACT_ABI = [
  "function submitGame(uint16 attempts) external",
  "function getUserStats(address user) external view returns (tuple(uint256 totalGames, uint256 totalAttempts, uint256 bestScore, uint256 lastUpdated) stats, uint256 avgAttempts)",
  "function userStats(address) external view returns (uint256 totalGames, uint256 totalAttempts, uint256 bestScore, uint256 lastUpdated)",
  "function deployer() external view returns (address)",
  "event GameSubmitted(address indexed user, uint16 attempts, uint256 totalGames, uint256 totalAttempts, uint256 bestScore, uint256 timestamp)",
  "event FundsForwarded(address indexed from, address indexed to, uint256 amount)"
];

// Contract address - set via environment variable
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

/**
 * Get contract instance
 * @param {ethers.Provider} provider - Ethereum provider
 * @param {ethers.Signer} signer - Ethereum signer (optional, for write operations)
 * @returns {ethers.Contract} Contract instance
 */
export function getContract(provider, signer = null) {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not set. Please set VITE_CONTRACT_ADDRESS environment variable.');
  }
  
  const contractProvider = signer || provider;
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, contractProvider);
}

/**
 * Submit game result to blockchain
 * @param {number} attempts - Number of attempts used in the game
 * @param {ethers.Signer} signer - Ethereum signer (must be connected)
 * @returns {Promise<Object>} Transaction object with hash and receipt
 */
export async function submitGameToChain(attempts, signer) {
  try {
    if (!signer) {
      throw new Error('Signer is required for submitting games');
    }

    if (attempts <= 0 || attempts > 65535) {
      throw new Error('Attempts must be between 1 and 65535');
    }

    const contract = getContract(signer.provider, signer);
    
    // Submit the game
    const tx = await contract.submitGame(attempts);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    return {
      hash: tx.hash,
      receipt,
      success: receipt.status === 1
    };
  } catch (error) {
    console.error('Error submitting game to chain:', error);
    
    // Provide user-friendly error messages
    if (error.code === 'ACTION_REJECTED') {
      throw new Error('Transaction was rejected by user');
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient funds for gas');
    } else if (error.message.includes('Attempts must be > 0')) {
      throw new Error('Invalid number of attempts');
    }
    
    throw error;
  }
}

/**
 * Get user stats from blockchain
 * @param {string} walletAddress - User's wallet address
 * @param {ethers.Provider} provider - Ethereum provider
 * @returns {Promise<Object>} User stats object
 */
export async function getStatsFromChain(walletAddress, provider) {
  try {
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    const contract = getContract(provider);
    const [stats, avgAttemptsX100] = await contract.getUserStats(walletAddress);
    
    // Convert from blockchain format to frontend format
    return {
      walletAddress: walletAddress,
      totalGames: Number(stats.totalGames),
      totalAttempts: Number(stats.totalAttempts),
      averageAttempts: Number(avgAttemptsX100) / 100, // Convert from fixed point
      bestScore: Number(stats.bestScore),
      lastUpdated: stats.lastUpdated > 0 ? new Date(Number(stats.lastUpdated) * 1000) : null
    };
  } catch (error) {
    console.error('Error getting stats from chain:', error);
    
    // Return empty stats if user doesn't exist on chain
    if (error.message.includes('revert') || error.message.includes('execution reverted')) {
      return {
        walletAddress: walletAddress,
        totalGames: 0,
        totalAttempts: 0,
        averageAttempts: 0,
        bestScore: 0,
        lastUpdated: null
      };
    }
    
    throw error;
  }
}

/**
 * Check if user has stats on blockchain
 * @param {string} walletAddress - User's wallet address
 * @param {ethers.Provider} provider - Ethereum provider
 * @returns {Promise<boolean>} True if user has stats
 */
export async function hasStatsOnChain(walletAddress, provider) {
  try {
    const stats = await getStatsFromChain(walletAddress, provider);
    return stats.totalGames > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get contract address
 * @returns {string} Contract address
 */
export function getContractAddress() {
  return CONTRACT_ADDRESS;
}

/**
 * Check if contract is configured
 * @returns {boolean} True if contract address is set
 */
export function isContractConfigured() {
  return CONTRACT_ADDRESS !== '' && ethers.isAddress(CONTRACT_ADDRESS);
}
