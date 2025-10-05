const fs = require("fs");
const path = require("path");

async function updateFrontendConfig() {
  try {
    // Read deployment info
    const deploymentPath = path.join(__dirname, "..", "deployment.json");
    if (!fs.existsSync(deploymentPath)) {
      console.error("❌ deployment.json not found. Please run deployment first.");
      process.exit(1);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    console.log("📖 Reading deployment info...");
    console.log("Network:", deployment.network);
    console.log("Chain ID:", deployment.chainId);

    // Read current frontend config
    const frontendConfigPath = path.join(__dirname, "..", "..", "frontend", "src", "config", "contracts.ts");
    if (!fs.existsSync(frontendConfigPath)) {
      console.error("❌ Frontend config file not found:", frontendConfigPath);
      process.exit(1);
    }

    let configContent = fs.readFileSync(frontendConfigPath, "utf8");
    console.log("📖 Reading frontend config...");

    // Update contract addresses for the deployed network
    const chainId = deployment.chainId;
    const contracts = deployment.contracts;

    // Replace the placeholder addresses with actual deployed addresses
    const updatedConfig = configContent.replace(
      new RegExp(`(${chainId}:\\s*{[^}]*NNSRegistry:\\s*")[^"]*(")`),
      `$1${contracts.NNSRegistry}$2`
    ).replace(
      new RegExp(`(${chainId}:\\s*{[^}]*PublicResolver:\\s*")[^"]*(")`),
      `$1${contracts.PublicResolver}$2`
    ).replace(
      new RegExp(`(${chainId}:\\s*{[^}]*NexRegistrar:\\s*")[^"]*(")`),
      `$1${contracts.NexRegistrar}$2`
    );

    // If the above regex doesn't work, try a more specific approach
    if (updatedConfig === configContent) {
      // Find the section for this chain ID and update it
      const chainSection = `${chainId}: {`;
      const chainIndex = configContent.indexOf(chainSection);
      
      if (chainIndex !== -1) {
        // Find the end of this chain section
        let braceCount = 0;
        let endIndex = chainIndex;
        for (let i = chainIndex; i < configContent.length; i++) {
          if (configContent[i] === '{') braceCount++;
          if (configContent[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }

        // Replace the entire section
        const newSection = `${chainId}: {
    NNSRegistry: "${contracts.NNSRegistry}",
    PublicResolver: "${contracts.PublicResolver}",
    NexRegistrar: "${contracts.NexRegistrar}",
  }`;

        configContent = configContent.substring(0, chainIndex) + newSection + configContent.substring(endIndex);
      }
    } else {
      configContent = updatedConfig;
    }

    // Write updated config
    fs.writeFileSync(frontendConfigPath, configContent);
    console.log("✅ Frontend config updated successfully!");
    console.log("📋 Updated addresses:");
    console.log("  NNS Registry:", contracts.NNSRegistry);
    console.log("  Public Resolver:", contracts.PublicResolver);
    console.log("  Nex Registrar:", contracts.NexRegistrar);

  } catch (error) {
    console.error("❌ Error updating frontend config:", error.message);
    process.exit(1);
  }
}

updateFrontendConfig();