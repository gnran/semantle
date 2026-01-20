# SemantleStats Smart Contract

Smart contract for storing Semantle game statistics on the Base blockchain.

## Features

- ✅ Stores user wallet address and game statistics
- ✅ Updates stats when a game finishes (wallet address, total games, avg attempts, best score)
- ✅ Automatically forwards any received ETH to the deployer address

## Contract Overview

The `SemantleStats` contract stores:
- `totalGames`: Total number of games played
- `totalAttempts`: Sum of all attempts across all games
- `bestScore`: Best (minimum) attempts in a single game
- `lastUpdated`: Timestamp of last update

## Setup

1. Install dependencies:
```bash
cd contracts
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Add your private key and configuration to `.env`:
```env
PRIVATE_KEY=your_private_key_here
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_api_key_here
```

## Compilation

```bash
npm run compile
```

## Deployment

### Deploy to Base Sepolia (Testnet)
```bash
npm run deploy:baseSepolia
```

### Deploy to Base Mainnet
```bash
npm run deploy:base
```

### Deploy to Local Hardhat Network
```bash
npm run deploy:local
```

## Contract Verification

After deployment, verify the contract on Basescan:

```bash
npm run verify:baseSepolia <CONTRACT_ADDRESS>
# or
npm run verify:base <CONTRACT_ADDRESS>
```

## Usage

### Submit Game Results

When a user finishes a game, call `submitGame(attempts)`:

```solidity
contract.submitGame(uint16 attempts);
```

### Get User Stats

Retrieve user statistics:

```solidity
(UserStats memory stats, uint256 avgAttempts) = contract.getUserStats(address);
```

The `avgAttempts` is returned as a fixed-point number (multiplied by 100).

## Network Configuration

- **Base Mainnet**: Chain ID 8453
- **Base Sepolia**: Chain ID 84532
- **Hardhat Local**: Chain ID 1337

## Security

- The contract automatically forwards any ETH sent to it to the deployer address
- Only the user's own wallet can submit their game results (via `msg.sender`)
- Deployer address is immutable and set during contract deployment

## Integration

See the frontend integration guide in the main README for connecting this contract to your React application.
