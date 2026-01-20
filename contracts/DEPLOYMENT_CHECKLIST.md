# Deployment Checklist

## ✅ Wallet Setup (COMPLETED)

- [x] Wallet created: `0x24540f32895f39699b2FD0df942C01ebFCB4Ac71`
- [x] Private key saved to `.env` file
- [x] Wallet info saved to `wallet.json` (gitignored)

## 📋 Next Steps

### 1. Fund Your Wallet

You need ETH to pay for gas fees when deploying the contract.

#### For Base Sepolia (Testnet) - RECOMMENDED FIRST:
1. Go to a Base Sepolia faucet:
   - **Coinbase Faucet**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - **Optimism Faucet**: https://app.optimism.io/faucet
   - **Base Sepolia Faucet**: https://www.alchemy.com/base-sepolia/faucet

2. Enter your wallet address: `0x24540f32895f39699b2FD0df942C01ebFCB4Ac71`

3. Request test ETH (usually 0.1-0.5 ETH is enough)

4. Wait a few minutes for the transaction to confirm

#### For Base Mainnet:
- Send ETH from an exchange (Coinbase, Binance, etc.)
- Or transfer from another wallet
- You'll need at least 0.01-0.05 ETH for deployment

### 2. Verify Wallet Balance

Check your wallet on Basescan:
- **Testnet**: https://sepolia.basescan.org/address/0x24540f32895f39699b2FD0df942C01ebFCB4Ac71
- **Mainnet**: https://basescan.org/address/0x24540f32895f39699b2FD0df942C01ebFCB4Ac71

### 3. Compile the Contract

```bash
cd contracts
npm run compile
```

### 4. Deploy to Testnet (Base Sepolia)

```bash
npm run deploy:baseSepolia
```

This will:
- Deploy the contract
- Save deployment info to `deployments/baseSepolia.json`
- Display the contract address

### 5. Verify the Contract (Optional but Recommended)

After deployment, verify on Basescan:

```bash
npm run verify:baseSepolia <CONTRACT_ADDRESS>
```

### 6. Test the Contract

- Submit a test game via the frontend
- Check stats on Basescan
- Verify events are emitted correctly

### 7. Deploy to Mainnet (After Testing)

Once you've tested on Sepolia:

```bash
npm run deploy:base
```

**⚠️ IMPORTANT**: Only deploy to mainnet after thorough testing!

## 📝 Deployment Info

After deployment, you'll get:
- Contract address
- Transaction hash
- Deployer address

Save the contract address - you'll need it for frontend integration!

## 🔗 Frontend Integration

After deployment, add the contract address to your frontend `.env`:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

## ⚠️ Security Reminders

- ✅ `.env` and `wallet.json` are in `.gitignore`
- ⚠️ Never commit private keys to git
- ⚠️ Never share your private key
- ⚠️ Keep backups in a secure location
- ⚠️ Use testnet first!

## 🆘 Troubleshooting

### "Insufficient funds"
- Fund your wallet with more ETH
- Check you're on the correct network

### "Network error"
- Check RPC URLs in `.env`
- Verify network is accessible

### "Compilation error"
- Run `npm install` to ensure dependencies are installed
- Check Solidity version matches (0.8.20)

## 📚 Resources

- Base Docs: https://docs.base.org/
- Basescan: https://basescan.org/
- Hardhat Docs: https://hardhat.org/docs
