// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Nexus Testnet (Chain ID: 3940)
  3940: {
    NNSRegistry: "0xab1a857456A90Cb03a3fe051d55E0A380b705760",
    PublicResolver: "0x7E752dFeB11A36C6166B7D89c5206fa2dbB9684a",
    NexRegistrar: "0xd3C4a92aC99bf4F325a9b2147B92007C76a1a171",
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