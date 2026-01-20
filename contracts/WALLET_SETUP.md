# Wallet Setup Guide

This guide will help you create a wallet for deploying the SemantleStats smart contract.

## Option 1: Generate New Wallet (Recommended for Deployment)

This creates a fresh wallet specifically for contract deployment.

### Step 1: Generate Wallet

```bash
cd contracts
npm install  # If you haven't already
npm run create-wallet
```

This will:
- Create a new random wallet
- Display the address and private key
- Save wallet info to `wallet.json` (not committed to git)

### Step 2: Add Private Key to .env

Copy the private key from the output and add it to your `.env` file:

```bash
# Create .env file if it doesn't exist
cp ENV_EXAMPLE.txt .env

# Edit .env and add:
PRIVATE_KEY=your_private_key_here
```

### Step 3: Fund the Wallet

You need ETH to pay for gas fees when deploying:

#### For Base Sepolia (Testnet):
1. Go to a Base Sepolia faucet:
   - https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - https://app.optimism.io/faucet
2. Enter your wallet address
3. Request test ETH (usually 0.1-0.5 ETH)

#### For Base Mainnet:
1. Send ETH from an exchange (Coinbase, Binance, etc.)
2. Or transfer from another wallet
3. You'll need at least 0.01-0.05 ETH for deployment

### Step 4: Verify Balance

Check your wallet balance:
```bash
# You can check on Basescan:
# https://basescan.org/address/YOUR_ADDRESS (mainnet)
# https://sepolia.basescan.org/address/YOUR_ADDRESS (testnet)
```

## Option 2: Use Existing Wallet (MetaMask/Coinbase Wallet)

If you already have a wallet you want to use:

### Step 1: Export Private Key

**⚠️ WARNING: Exporting private keys can be risky. Only do this if you understand the security implications.**

#### MetaMask:
1. Open MetaMask extension
2. Click account icon → Account Details
3. Click "Export Private Key"
4. Enter your password
5. Copy the private key

#### Coinbase Wallet:
1. Open Coinbase Wallet
2. Settings → Security → Show Private Key
3. Authenticate and copy the private key

### Step 2: Add to .env

```bash
PRIVATE_KEY=your_exported_private_key_here
```

### Step 3: Switch Network

Make sure your wallet is connected to:
- **Base Sepolia** (Chain ID: 84532) for testnet
- **Base** (Chain ID: 8453) for mainnet

## Option 3: Use Hardhat's Built-in Accounts (Local Testing Only)

For local testing, Hardhat provides test accounts automatically. No setup needed!

```bash
npm run deploy:local
```

## Security Best Practices

1. **Never commit private keys to git**
   - `.env` and `wallet.json` are in `.gitignore`
   - Double-check before committing

2. **Use separate wallets**
   - Use a dedicated wallet for deployment
   - Don't use your main wallet with large balances

3. **Start with testnet**
   - Always test on Base Sepolia first
   - Only deploy to mainnet after thorough testing

4. **Backup securely**
   - Save private key in a password manager
   - Or write it down and store in a safe place
   - Never store in plain text files that aren't gitignored

5. **Use environment variables**
   - Never hardcode private keys in scripts
   - Always use `.env` file

## Troubleshooting

### "Insufficient funds for gas"
- Fund your wallet with more ETH
- Check you're on the correct network

### "Invalid private key"
- Make sure you copied the full private key (starts with `0x`)
- No extra spaces or newlines

### "Network not found"
- Check your RPC URLs in `.env`
- Verify network configuration in `hardhat.config.js`

## Next Steps

After setting up your wallet:

1. ✅ Wallet created and funded
2. ✅ Private key in `.env` file
3. ✅ Test on Base Sepolia first
4. ✅ Deploy: `npm run deploy:baseSepolia`
5. ✅ Verify contract on Basescan
6. ✅ Deploy to mainnet when ready

## Quick Reference

```bash
# Generate new wallet
npm run create-wallet

# Deploy to testnet
npm run deploy:baseSepolia

# Deploy to mainnet
npm run deploy:base

# Verify contract
npm run verify:baseSepolia <CONTRACT_ADDRESS>
```
