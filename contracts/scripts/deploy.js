require("dotenv").config();
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Deploying NNS contracts to Nexus testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "NEX");

  // Deploy NNS Registry
  console.log("\n1. Deploying NNS Registry...");
  const NNSRegistry = await ethers.getContractFactory("NNSRegistry");
  const registry = await NNSRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("NNS Registry deployed to:", registryAddress);

  // Deploy Public Resolver
  console.log("\n2. Deploying Public Resolver...");
  const PublicResolver = await ethers.getContractFactory("PublicResolver");
  const resolver = await PublicResolver.deploy(registryAddress);
  await resolver.waitForDeployment();
  const resolverAddress = await resolver.getAddress();
  console.log("Public Resolver deployed to:", resolverAddress);

  // Calculate the namehash for "nex" TLD
  const nexNamehash = ethers.namehash("nex");
  console.log("Nex namehash:", nexNamehash);

  // Set up the "nex" TLD in the registry
  console.log("\n3. Setting up .nex TLD...");
  const nexLabel = ethers.id("nex");
  await registry.setSubnodeOwner(ethers.ZeroHash, nexLabel, deployer.address);
  console.log("Set deployer as owner of .nex TLD");

  // Deploy Nex Registrar
  console.log("\n4. Deploying Nex Registrar...");
  const NexRegistrar = await ethers.getContractFactory("NexRegistrar");
  const registrar = await NexRegistrar.deploy(registryAddress, resolverAddress, nexNamehash);
  await registrar.waitForDeployment();
  const registrarAddress = await registrar.getAddress();
  console.log("Nex Registrar deployed to:", registrarAddress);

  // Set the resolver for .nex TLD first (before transferring ownership)
  console.log("\n5. Setting resolver for .nex TLD...");
  await registry.setResolver(nexNamehash, resolverAddress);
  console.log("Set resolver for .nex TLD");

  // Transfer ownership of .nex TLD to the registrar
  console.log("\n6. Transferring .nex TLD ownership to registrar...");
  await registry.setOwner(nexNamehash, registrarAddress);
  console.log("Transferred .nex TLD ownership to registrar");

  console.log("\n✅ Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("NNS Registry:", registryAddress);
  console.log("Public Resolver:", resolverAddress);
  console.log("Nex Registrar:", registrarAddress);

  console.log("\n🔧 Configuration:");
  console.log("Registration Fee:", ethers.formatEther(await registrar.registrationFee()), "NEX");
  console.log("Min Registration Duration:", (await registrar.MIN_REGISTRATION_DURATION()).toString(), "seconds");

  // Save deployment info
  const deploymentInfo = {
    network: "nexusTestnet",
    chainId: 3940,
    contracts: {
      NNSRegistry: registryAddress,
      PublicResolver: resolverAddress,
      NexRegistrar: registrarAddress
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    nexNamehash: nexNamehash
  };


  fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });