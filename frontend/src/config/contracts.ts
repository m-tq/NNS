// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Nexus Testnet (Chain ID: 3940)
  3940: {
    NNSRegistry: "0xA87F122cB8E4490E004B019305438Dcf1849c21f",
    PublicResolver: "0xfCF8B4B0010418af078197E0f901f1d9fd5bb6f5",
    NexRegistrar: "0x7e8F8B3de7053378De2abB412592e0642c05A584",
  },
  // Local development (Hardhat)
  31337: {
    NNSRegistry: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    PublicResolver: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    NexRegistrar: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
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
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[3940];
};

// Get network config for current network
export const getNetworkConfig = (chainId: number) => {
  return NETWORK_CONFIG[chainId as keyof typeof NETWORK_CONFIG] || NETWORK_CONFIG[3940];
};