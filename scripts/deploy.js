const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment of Real Estate Platform on Avalanche...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // 1. Deploy ComplianceRegistry
  console.log("\n📋 Deploying ComplianceRegistry...");
  const ComplianceRegistry = await hre.ethers.getContractFactory("ComplianceRegistry");
  const complianceRegistry = await ComplianceRegistry.deploy(deployer.address);
  await complianceRegistry.waitForDeployment();
  console.log("ComplianceRegistry deployed to:", complianceRegistry.target);

  // 2. Deploy TitleNFT
  console.log("\n🏠 Deploying TitleNFT...");
  const TitleNFT = await hre.ethers.getContractFactory("TitleNFT");
  const titleNFT = await TitleNFT.deploy(deployer.address);
  await titleNFT.waitForDeployment();
  console.log("TitleNFT deployed to:", titleNFT.target);

  // 3. Deploy Fractionalizer
  console.log("\n🔀 Deploying Fractionalizer...");
  const Fractionalizer = await hre.ethers.getContractFactory("Fractionalizer");
  const fractionalizer = await Fractionalizer.deploy(
    titleNFT.target,
    complianceRegistry.target,
    deployer.address
  );
  await fractionalizer.waitForDeployment();
  console.log("Fractionalizer deployed to:", fractionalizer.target);

  // 4. Deploy RentPoolMerkle (using USDC as example stablecoin)
  console.log("\n💰 Deploying RentPoolMerkle...");
  const RentPoolMerkle = await hre.ethers.getContractFactory("RentPoolMerkle");
  // Note: You'll need to deploy or use an existing stablecoin contract
  // For now, using a placeholder address - replace with actual stablecoin
  const stablecoinAddress = "0xA0b86a33E6441b8c4C8C0E123456789012345678"; // Replace with actual USDC address
  const rentPool = await RentPoolMerkle.deploy(stablecoinAddress);
  await rentPool.waitForDeployment();
  console.log("RentPoolMerkle deployed to:", rentPool.target);

  // 5. Grant necessary roles
  console.log("\n🔐 Setting up roles...");
  
  // Grant MINTER_ROLE to Fractionalizer for TitleNFT
  await titleNFT.grantRole(await titleNFT.MINTER_ROLE(), fractionalizer.target);
  console.log("✅ Granted MINTER_ROLE to Fractionalizer");

  // Grant BURNER_ROLE to Fractionalizer for TitleNFT
  await titleNFT.grantRole(await titleNFT.BURNER_ROLE(), fractionalizer.target);
  console.log("✅ Granted BURNER_ROLE to Fractionalizer");

  // 6. Display deployment summary
  console.log("\n🎉 Deployment Summary:");
  console.log("=====================================");
  console.log("ComplianceRegistry:", complianceRegistry.target);
  console.log("TitleNFT:", titleNFT.target);
  console.log("Fractionalizer:", fractionalizer.target);
  console.log("RentPoolMerkle:", rentPool.target);
  console.log("=====================================");

  // 7. Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    contracts: {
      ComplianceRegistry: complianceRegistry.target,
      TitleNFT: titleNFT.target,
      Fractionalizer: fractionalizer.target,
      RentPoolMerkle: rentPool.target
    },
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync(
    `deployments/${hre.network.name}-${Date.now()}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📄 Deployment info saved to deployments/ folder");
  console.log("\n✨ Real Estate Platform successfully deployed on Avalanche!");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
