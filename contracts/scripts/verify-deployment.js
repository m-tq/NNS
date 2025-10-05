const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("Verifying deployment...");
    
    // Load deployment info
    const deploymentInfo = JSON.parse(fs.readFileSync("deployment.json", "utf8"));
    
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", await hre.ethers.provider.getNetwork().then(n => n.chainId));
    
    // Check each contract
    const contracts = deploymentInfo.contracts;
    
    for (const [name, address] of Object.entries(contracts)) {
        console.log(`\nChecking ${name} at ${address}:`);
        
        try {
            const code = await hre.ethers.provider.getCode(address);
            console.log(`  Code length: ${code.length}`);
            console.log(`  Contract exists: ${code !== "0x"}`);
            
            if (code !== "0x") {
                // Try to get the contract instance
                try {
                    const contract = await hre.ethers.getContractAt(name, address);
                    console.log(`  Contract instance created successfully`);
                    
                    // Test a simple function call
                    if (name === "NNSRegistry") {
                        try {
                            const rootOwner = await contract["owner(bytes32)"](hre.ethers.ZeroHash);
                            console.log(`  Root owner: ${rootOwner}`);
                        } catch (error) {
                            console.log(`  Error reading root owner: ${error.message}`);
                        }
                    }
                } catch (error) {
                    console.log(`  Error creating contract instance: ${error.message}`);
                }
            }
        } catch (error) {
            console.log(`  Error checking contract: ${error.message}`);
        }
    }
    
    // Check account balance
    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`\nDeployer balance: ${hre.ethers.formatEther(balance)} NEX`);
    
    // Check latest block
    const latestBlock = await hre.ethers.provider.getBlockNumber();
    console.log(`Latest block: ${latestBlock}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });