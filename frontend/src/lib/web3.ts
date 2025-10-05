import { ethers } from 'ethers'

// Nexus Testnet configuration
export const NEXUS_TESTNET = {
  chainId: 3940,
  name: 'Nexus Testnet',
  currency: 'NEX',
  rpcUrl: 'https://testnet3.rpc.nexus.xyz',
  blockExplorer: 'https://testnet3.explorer.nexus.xyz'
}

// Contract ABIs (simplified for demo)
export const NNS_REGISTRY_ABI = [
  "function setRecord(bytes32 node, address owner, address resolver, uint64 ttl) external",
  "function setOwner(bytes32 node, address owner) external",
  "function setResolver(bytes32 node, address resolver) external",
  "function owner(bytes32 node) external view returns (address)",
  "function resolver(bytes32 node) external view returns (address)",
  "function recordExists(bytes32 node) external view returns (bool)"
]

export const PUBLIC_RESOLVER_ABI = [
  "function setAddr(bytes32 node, address addr) external",
  "function addr(bytes32 node) external view returns (address)",
  "function setName(bytes32 node, string calldata name) external",
  "function name(bytes32 node) external view returns (string)",
  "function setText(bytes32 node, string calldata key, string calldata value) external",
  "function text(bytes32 node, string calldata key) external view returns (string)"
]

export const NEX_REGISTRAR_ABI = [
  "function register(string calldata name, address owner, uint256 duration) external payable",
  "function renew(string calldata name, uint256 duration) external payable",
  "function transfer(string calldata name, address to) external",
  "function available(string calldata name) external view returns (bool)",
  "function getDomain(string calldata name) external view returns (address owner, uint256 expires, bool exists)",
  "function registrationFee() external view returns (uint256)",
  "function domains(bytes32 label) external view returns (address owner, uint256 expires, bool exists)",
  "function setRegistrationFee(uint256 newFee) external",
  "function setReserved(string calldata name, bool isReserved) external"
]

// Utility functions
export function namehash(name: string): string {
  let node = '0x0000000000000000000000000000000000000000000000000000000000000000'
  if (name !== '') {
    const labels = name.split('.')
    for (let i = labels.length - 1; i >= 0; i--) {
      node = ethers.keccak256(ethers.concat([node, ethers.keccak256(ethers.toUtf8Bytes(labels[i]))]))
    }
  }
  return node
}

export function isValidDomain(name: string): boolean {
  if (!name || name.length < 3) return false
  if (!/^[a-z0-9-]+$/.test(name)) return false
  if (name.startsWith('-') || name.endsWith('-')) return false
  return true
}

export async function addNexusNetwork() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed')
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${NEXUS_TESTNET.chainId.toString(16)}`,
        chainName: NEXUS_TESTNET.name,
        nativeCurrency: {
          name: NEXUS_TESTNET.currency,
          symbol: NEXUS_TESTNET.currency,
          decimals: 18
        },
        rpcUrls: [NEXUS_TESTNET.rpcUrl],
        blockExplorerUrls: [NEXUS_TESTNET.blockExplorer]
      }]
    })
  } catch (error) {
    console.error('Failed to add Nexus network:', error)
    throw error
  }
}

export async function switchToNexusNetwork() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed')
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${NEXUS_TESTNET.chainId.toString(16)}` }]
    })
  } catch (error: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      await addNexusNetwork()
    } else {
      throw error
    }
  }
}