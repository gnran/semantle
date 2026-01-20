/**
 * Smart Contract Integration Utility
 * Handles interaction with SemantleStats contract on Base blockchain
 * Uses Wagmi for Base Account integration
 */

import { isAddress } from 'viem';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from '../providers/WagmiProvider';

// Contract ABI (Application Binary Interface)
const CONTRACT_ABI = [
  {
    name: 'submitGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'attempts', type: 'uint16' }],
    outputs: [],
  },
  {
    name: 'getUserStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        name: 'stats',
        type: 'tuple',
        components: [
          { name: 'totalGames', type: 'uint256' },
          { name: 'totalAttempts', type: 'uint256' },
          { name: 'bestScore', type: 'uint256' },
          { name: 'lastUpdated', type: 'uint256' },
        ],
      },
      { name: 'avgAttempts', type: 'uint256' },
    ],
  },
  {
    name: 'userStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [
      { name: 'totalGames', type: 'uint256' },
      { name: 'totalAttempts', type: 'uint256' },
      { name: 'bestScore', type: 'uint256' },
      { name: 'lastUpdated', type: 'uint256' },
    ],
  },
  {
    name: 'deployer',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
];

// Contract address - set via environment variable
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

/**
 * Submit game result to blockchain using Base Account
 * @param {number} attempts - Number of attempts used in the game
 * @param {string} account - User's account address (from useAccount hook)
 * @returns {Promise<Object>} Transaction object with hash and receipt
 */
export async function submitGameToChain(attempts, account) {
  try {
    if (!account) {
      throw new Error('Account is required for submitting games');
    }

    if (attempts <= 0 || attempts > 65535) {
      throw new Error('Attempts must be between 1 and 65535');
    }

    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not set. Please set VITE_CONTRACT_ADDRESS environment variable.');
    }

    // Submit the game using Wagmi writeContract
    const hash = await writeContract(config, {
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'submitGame',
      args: [attempts],
      account,
    });

    // Wait for transaction confirmation
    const receipt = await waitForTransactionReceipt(config, { hash });

    return {
      hash,
      receipt,
      success: receipt.status === 'success',
    };
  } catch (error) {
    console.error('Error submitting game to chain:', error);

    // Provide user-friendly error messages
    if (error.code === 'ACTION_REJECTED' || error.message?.includes('User rejected')) {
      throw new Error('Transaction was rejected by user');
    } else if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
      throw new Error('Insufficient funds for gas');
    } else if (error.message?.includes('Attempts must be > 0')) {
      throw new Error('Invalid number of attempts');
    }

    throw error;
  }
}

/**
 * Get user stats from blockchain
 * @param {string} walletAddress - User's wallet address
 * @returns {Promise<Object>} User stats object
 */
export async function getStatsFromChain(walletAddress) {
  try {
    if (!walletAddress || !isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not set. Please set VITE_CONTRACT_ADDRESS environment variable.');
    }

    const result = await readContract(config, {
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getUserStats',
      args: [walletAddress],
    });

    // result is [stats object, avgAttempts]
    // stats is an object with properties: totalGames, totalAttempts, bestScore, lastUpdated
    const stats = result[0];
    const avgAttemptsX100 = result[1];

    // Convert from blockchain format to frontend format
    return {
      walletAddress: walletAddress,
      totalGames: Number(stats.totalGames),
      totalAttempts: Number(stats.totalAttempts),
      averageAttempts: Number(avgAttemptsX100) / 100, // Convert from fixed point
      bestScore: Number(stats.bestScore),
      lastUpdated: Number(stats.lastUpdated) > 0 ? new Date(Number(stats.lastUpdated) * 1000) : null,
    };
  } catch (error) {
    console.error('Error getting stats from chain:', error);

    // Return empty stats if user doesn't exist on chain
    if (error.message?.includes('revert') || error.message?.includes('execution reverted')) {
      return {
        walletAddress: walletAddress,
        totalGames: 0,
        totalAttempts: 0,
        averageAttempts: 0,
        bestScore: 0,
        lastUpdated: null,
      };
    }

    throw error;
  }
}

/**
 * Check if user has stats on blockchain
 * @param {string} walletAddress - User's wallet address
 * @returns {Promise<boolean>} True if user has stats
 */
export async function hasStatsOnChain(walletAddress) {
  try {
    const stats = await getStatsFromChain(walletAddress);
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
  return CONTRACT_ADDRESS !== '' && isAddress(CONTRACT_ADDRESS);
}
