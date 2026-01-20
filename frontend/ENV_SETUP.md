# Frontend Environment Setup

## Required Environment Variables

Create a `.env` file in the `frontend` directory with the following:

```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

## Steps to Set Up

### Option 1: If Contract is Already Deployed

1. Get your contract address from:
   - The deployment output when you ran `npm run deploy:base` or `npm run deploy:baseSepolia`
   - Or check `contracts/deployments/base.json` or `contracts/deployments/baseSepolia.json`

2. Create `.env` file in the `frontend` directory:
   ```bash
   cd frontend
   echo VITE_CONTRACT_ADDRESS=0xYourContractAddress > .env
   ```

3. Replace `0xYourContractAddress` with your actual deployed contract address

### Option 2: If Contract is Not Deployed Yet

1. First, deploy the contract (see `contracts/DEPLOYMENT_CHECKLIST.md`):
   ```bash
   cd contracts
   npm run deploy:baseSepolia  # For testnet
   # or
   npm run deploy:base  # For mainnet
   ```

2. Copy the contract address from the deployment output

3. Create `.env` file in the `frontend` directory:
   ```bash
   cd frontend
   echo VITE_CONTRACT_ADDRESS=0xYourContractAddress > .env
   ```

4. Replace `0xYourContractAddress` with the address from step 2

## Optional Environment Variables

```env
# API URL (defaults to /api for local development)
VITE_API_URL=https://your-backend.railway.app
```

## After Setting Up

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. The contract should now be configured and ready to use!

## Troubleshooting

- **"Contract not configured"**: Make sure `.env` file exists in `frontend` directory and `VITE_CONTRACT_ADDRESS` is set
- **Invalid address**: Make sure the contract address starts with `0x` and is 42 characters long
- **Contract not found**: Make sure you deployed to the correct network (Base mainnet or Base Sepolia testnet)
