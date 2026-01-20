# Frontend Integration Guide

This guide explains how to integrate the SemantleStats smart contract with your React frontend.

## Prerequisites

1. Deploy the contract to Base (mainnet or testnet)
2. Get the contract address from deployment
3. Install ethers.js in the frontend (if not already installed)

## Installation

```bash
cd frontend
npm install ethers
```

## Environment Variables

Add the contract address to your frontend `.env` file:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

## Usage Example

### 1. Import the utilities

```javascript
import { submitGameToChain, getStatsFromChain } from '../utils/contract';
import { getAuthState } from '../utils/auth';
import { initializeAuth } from '../utils/auth';
```

### 2. Submit game results when a game finishes

```javascript
async function handleGameComplete(attempts) {
  try {
    // Get user's wallet address
    const authState = await getAuthState();
    if (!authState.address) {
      console.warn('No wallet address available');
      return;
    }

    // Get provider and signer from Base Account SDK
    const baseAccountSDK = initializeAuth();
    const provider = baseAccountSDK.getProvider();
    const signer = provider.getSigner();

    // Submit game to blockchain
    const result = await submitGameToChain(attempts, signer);
    
    console.log('Game submitted to blockchain:', result.hash);
    
    // Show success message to user
    alert(`Game saved to blockchain! Transaction: ${result.hash}`);
  } catch (error) {
    console.error('Failed to save game to blockchain:', error);
    alert(`Failed to save to blockchain: ${error.message}`);
  }
}
```

### 3. Load stats from blockchain

```javascript
async function loadOnChainStats() {
  try {
    const authState = await getAuthState();
    if (!authState.address) {
      return null;
    }

    // Get provider from Base Account SDK
    const baseAccountSDK = initializeAuth();
    const provider = baseAccountSDK.getProvider();

    // Get stats from blockchain
    const onChainStats = await getStatsFromChain(authState.address, provider);
    
    return onChainStats;
  } catch (error) {
    console.error('Failed to load on-chain stats:', error);
    return null;
  }
}
```

### 4. Integration in Game Component

Update your `Game.jsx` component to submit results when a game completes:

```javascript
// In your Game component
import { submitGameToChain } from '../utils/contract';
import { getAuthState } from '../utils/auth';
import { initializeAuth } from '../utils/auth';

// When game completes
const handleGameComplete = async (attempts) => {
  // Save to backend (existing code)
  // ... your existing backend save logic ...

  // Also save to blockchain
  try {
    const authState = await getAuthState();
    if (authState.address) {
      const baseAccountSDK = initializeAuth();
      const provider = baseAccountSDK.getProvider();
      const signer = provider.getSigner();
      
      await submitGameToChain(attempts, signer);
      console.log('Stats saved to blockchain');
    }
  } catch (error) {
    console.error('Blockchain save failed:', error);
    // Don't block the UI if blockchain save fails
  }
};
```

## Error Handling

The contract utilities handle common errors:

- **User rejection**: Transaction was rejected by user
- **Insufficient funds**: Not enough ETH for gas fees
- **Invalid attempts**: Attempts must be between 1 and 65535
- **Network errors**: Connection issues with blockchain

Always wrap contract calls in try-catch blocks and provide user feedback.

## Gas Costs

Submitting a game to the blockchain requires gas fees (paid in ETH). On Base:
- Typical gas cost: ~0.0001 - 0.0005 ETH per transaction
- Users need ETH in their wallet to submit games

Consider:
- Making blockchain submission optional
- Showing gas estimates before submission
- Providing clear messaging about gas costs

## Best Practices

1. **Make it optional**: Don't block game completion if blockchain save fails
2. **Show status**: Display loading states and transaction hashes
3. **Handle errors gracefully**: Provide clear error messages
4. **Cache results**: Don't query blockchain on every render
5. **Test on testnet first**: Use Base Sepolia for testing

## Testing

1. Deploy to Base Sepolia testnet
2. Get test ETH from a faucet
3. Test game submission
4. Verify stats on Basescan
5. Deploy to mainnet after testing
