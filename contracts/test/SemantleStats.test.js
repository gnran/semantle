const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SemantleStats", function () {
  let semantleStats;
  let deployer;
  let user1;
  let user2;

  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();

    const SemantleStats = await ethers.getContractFactory("SemantleStats");
    semantleStats = await SemantleStats.deploy();
    await semantleStats.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the deployer correctly", async function () {
      expect(await semantleStats.deployer()).to.equal(deployer.address);
    });
  });

  describe("submitGame", function () {
    it("Should submit a game with valid attempts", async function () {
      const tx = await semantleStats.connect(user1).submitGame(5);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      await expect(tx)
        .to.emit(semantleStats, "GameSubmitted")
        .withArgs(user1.address, 5, 1, 5, 5, block.timestamp);

      const stats = await semantleStats.userStats(user1.address);
      expect(stats.totalGames).to.equal(1);
      expect(stats.totalAttempts).to.equal(5);
      expect(stats.bestScore).to.equal(5);
    });

    it("Should reject zero attempts", async function () {
      await expect(
        semantleStats.connect(user1).submitGame(0)
      ).to.be.revertedWith("Attempts must be > 0");
    });

    it("Should update best score when better score is submitted", async function () {
      await semantleStats.connect(user1).submitGame(10);
      await semantleStats.connect(user1).submitGame(5);
      await semantleStats.connect(user1).submitGame(3);

      const stats = await semantleStats.userStats(user1.address);
      expect(stats.bestScore).to.equal(3);
      expect(stats.totalGames).to.equal(3);
      expect(stats.totalAttempts).to.equal(18);
    });

    it("Should track multiple users separately", async function () {
      await semantleStats.connect(user1).submitGame(5);
      await semantleStats.connect(user2).submitGame(10);

      const stats1 = await semantleStats.userStats(user1.address);
      const stats2 = await semantleStats.userStats(user2.address);

      expect(stats1.totalGames).to.equal(1);
      expect(stats2.totalGames).to.equal(1);
      expect(stats1.bestScore).to.equal(5);
      expect(stats2.bestScore).to.equal(10);
    });
  });

  describe("getUserStats", function () {
    it("Should return correct average attempts", async function () {
      await semantleStats.connect(user1).submitGame(10);
      await semantleStats.connect(user1).submitGame(5);
      await semantleStats.connect(user1).submitGame(15);

      const [stats, avgAttempts] = await semantleStats.getUserStats(user1.address);
      expect(stats.totalGames).to.equal(3);
      expect(stats.totalAttempts).to.equal(30);
      expect(avgAttempts).to.equal(1000); // (30 * 100) / 3 = 1000 (10.00)
    });

    it("Should return zero for non-existent user", async function () {
      const [stats, avgAttempts] = await semantleStats.getUserStats(user1.address);
      expect(stats.totalGames).to.equal(0);
      expect(avgAttempts).to.equal(0);
    });
  });

  describe("ETH Forwarding", function () {
    it("Should forward ETH to deployer via receive", async function () {
      const amount = ethers.parseEther("1.0");
      const deployerBalanceBefore = await ethers.provider.getBalance(deployer.address);

      await user1.sendTransaction({
        to: await semantleStats.getAddress(),
        value: amount,
      });

      const deployerBalanceAfter = await ethers.provider.getBalance(deployer.address);
      expect(deployerBalanceAfter).to.be.gt(deployerBalanceBefore);
    });

    it("Should emit FundsForwarded event", async function () {
      const amount = ethers.parseEther("0.5");
      await expect(
        user1.sendTransaction({
          to: await semantleStats.getAddress(),
          value: amount,
        })
      )
        .to.emit(semantleStats, "FundsForwarded")
        .withArgs(user1.address, deployer.address, amount);
    });
  });
});
