const hre = require("hardhat");

async function main() {
  console.log("Deploying SemantleStats contract...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Get the contract factory
  const SemantleStats = await hre.ethers.getContractFactory("SemantleStats");

  // Deploy the contract
  console.log("Deploying SemantleStats...");
  const semantleStats = await SemantleStats.deploy();

  // Wait for deployment
  await semantleStats.waitForDeployment();
  const contractAddress = await semantleStats.getAddress();

  // Wait a moment for the contract to be fully available
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log("\n✅ SemantleStats deployed successfully!");
  console.log("Contract address:", contractAddress);
  
  // Try to get deployer from contract, fallback to signer address
  let deployerAddress = deployer.address;
  try {
    const contractDeployer = await semantleStats.deployer();
    deployerAddress = contractDeployer;
    console.log("Deployer address (from contract):", deployerAddress);
  } catch (error) {
    console.log("Deployer address (from signer):", deployerAddress);
    console.log("Note: Could not read deployer from contract (this is okay)");
  }
  
  console.log("\nNetwork:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    contractAddress: contractAddress,
    deployer: deployerAddress,
    deployerBalance: (await hre.ethers.provider.getBalance(deployer.address)).toString(),
    timestamp: new Date().toISOString(),
  };

  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📝 Deployment info saved to:", deploymentFile);

  // Instructions for verification
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n📋 To verify the contract on Basescan, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
