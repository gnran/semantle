const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

/**
 * Script to create a new wallet for contract deployment
 * WARNING: Keep the private key secure and never commit it to git!
 */
async function main() {
  console.log("Creating new wallet for deployment...\n");

  // Generate a new random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log("✅ Wallet created successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 WALLET INFORMATION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Address:", wallet.address);
  console.log("Private Key:", wallet.privateKey);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Save to a secure file (not committed to git)
  const walletInfo = {
    address: wallet.address,
    privateKey: wallet.privateKey,
    createdAt: new Date().toISOString(),
    warning: "KEEP THIS FILE SECRET! NEVER COMMIT TO GIT!"
  };

  const walletFile = path.join(__dirname, "..", "wallet.json");
  fs.writeFileSync(walletFile, JSON.stringify(walletInfo, null, 2));
  console.log("💾 Wallet info saved to:", walletFile);
  console.log("⚠️  This file is in .gitignore - keep it secure!\n");

  // Instructions
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 NEXT STEPS:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. Add the private key to your .env file:");
  console.log(`   PRIVATE_KEY=${wallet.privateKey}\n`);
  console.log("2. Fund this wallet with ETH on Base:");
  console.log(`   Address: ${wallet.address}\n`);
  console.log("   - For Base Sepolia (testnet):");
  console.log("     https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
  console.log("     or https://app.optimism.io/faucet\n");
  console.log("   - For Base Mainnet:");
  console.log("     Send ETH from an exchange or another wallet\n");
  console.log("3. Deploy the contract:");
  console.log("   npm run deploy:baseSepolia  (for testnet)");
  console.log("   npm run deploy:base         (for mainnet)\n");
  console.log("⚠️  SECURITY WARNING:");
  console.log("   - Never share your private key");
  console.log("   - Never commit wallet.json or .env to git");
  console.log("   - Keep backups in a secure location");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error creating wallet:", error);
    process.exit(1);
  });
