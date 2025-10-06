// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  3940: { // Nexus Testnet
    NNSRegistry: "0x35481Ed34c3E6446EaafDca622369Df4295dce31",
    PublicResolver: "0x3C7bc6E4C65A194B3Bec187a3D6ef97A61F9DcD5",
    NexRegistrar: "0x5d716F4b16A135ca401a428B203A7107AD353950",
  },
  31337: { // Localhost
    NNSRegistry: "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE",
    PublicResolver: "0x68B1D87F95878fE05B998F19b66F4baba5De1aed",
    NexRegistrar: "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d",
  }
};

// Network configuration
export const NETWORK_CONFIG = {
  3940: {
    name: "Nexus Testnet",
    rpcUrl: "https://testnet3.rpc.nexus.xyz",
    explorerUrl: "https://testnet3.explorer.nexus.xyz",
    nativeCurrency: {
      name: "Nexus Token",
      symbol: "NEX",
      decimals: 18,
    },
  },
  31337: {
    name: "Hardhat Local",
    rpcUrl: "http://127.0.0.1:8545",
    explorerUrl: "",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  }
};

// Get contract addresses for current network
export const getContractAddresses = (chainId: number) => {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    console.warn(`No contract addresses found for chainId ${chainId}, using Nexus Testnet as fallback`);
    return CONTRACT_ADDRESSES[3940];
  }
  return addresses;
};

// Get network config for current network
export const getNetworkConfig = (chainId: number) => {
  return NETWORK_CONFIG[chainId as keyof typeof NETWORK_CONFIG] || NETWORK_CONFIG[3940];
};