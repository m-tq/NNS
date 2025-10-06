import { ethers } from 'ethers';

/**
 * EIP-3770 Address Format Implementation for Nexus Name Service
 * 
 * EIP-3770 defines a standard for encoding addresses with chain information.
 * This implementation extends it to support NNS domain names.
 * 
 * Format: chain:identifier
 * Examples:
 * - nex:alice.nex (NNS domain)
 * - nex:0x742d35Cc6634C0532925a3b8D4C9db96590c6C87 (Nexus address)
 * - eth:0x742d35Cc6634C0532925a3b8D4C9db96590c6C87 (Ethereum address)
 */

export interface EIP3770Address {
  chain: string;
  identifier: string;
  type: 'address' | 'domain';
}

export interface NNSConfig {
  chainId: number;
  rpcUrl: string;
  contracts: {
    registry: string;
    resolver: string;
    registrar: string;
  };
}

export interface ResolvedAddress {
  address: string;
  domain?: string;
  chain: string;
  original: string;
}

// Default NNS configuration for Nexus Testnet
const DEFAULT_NNS_CONFIG: NNSConfig = {
  chainId: 3940,
  rpcUrl: 'https://testnet3.rpc.nexus.xyz',
  contracts: {
    registry: '0xBa418aB87D04b15953E8a730dD0b35A6E2Af8452',
    resolver: '0x6F12133972285D9951D40668D26c4b9Bec79aE3e',
    registrar: '0xAE8aB51360B90057913627E83DB7Fcf496a3D07f'
  }
};

// Chain identifiers mapping
const CHAIN_IDENTIFIERS: Record<string, number> = {
  'eth': 1,        // Ethereum Mainnet
  'gor': 5,        // Goerli Testnet
  'sep': 11155111, // Sepolia Testnet
  'nex': 3940,     // Nexus Testnet
  'nexus': 3939,   // Nexus Mainnet (future)
  'matic': 137,    // Polygon
  'arb': 42161,    // Arbitrum
  'opt': 10        // Optimism
};

// Reverse mapping
const CHAIN_ID_TO_IDENTIFIER: Record<number, string> = Object.fromEntries(
  Object.entries(CHAIN_IDENTIFIERS).map(([k, v]) => [v, k])
);

/**
 * EIP-3770 NNS Implementation
 */
export class EIP3770NNS {
  private nnsConfig: NNSConfig;
  private provider: ethers.JsonRpcProvider;

  constructor(config?: Partial<NNSConfig>) {
    this.nnsConfig = { ...DEFAULT_NNS_CONFIG, ...config };
    this.provider = new ethers.JsonRpcProvider(this.nnsConfig.rpcUrl);
  }

  /**
   * Encode an identifier with chain information
   */
  static encode(chain: string, identifier: string): string {
    return `${chain}:${identifier}`;
  }

  /**
   * Decode an EIP-3770 formatted address
   */
  static decode(encoded: string): EIP3770Address | null {
    const colonIndex = encoded.indexOf(':');
    if (colonIndex === -1) {
      return null;
    }

    const chain = encoded.substring(0, colonIndex);
    const identifier = encoded.substring(colonIndex + 1);

    // Determine type
    const type = this.isAddress(identifier) ? 'address' : 'domain';

    return {
      chain,
      identifier,
      type
    };
  }

  /**
   * Check if string is a valid Ethereum address
   */
  static isAddress(value: string): boolean {
    try {
      return ethers.isAddress(value);
    } catch {
      return false;
    }
  }

  /**
   * Check if string looks like a domain
   */
  static isDomain(value: string): boolean {
    return value.includes('.') && !this.isAddress(value);
  }

  /**
   * Check if string is NNS domain
   */
  static isNNSDomain(value: string): boolean {
    return value.endsWith('.nex');
  }

  /**
   * Get chain ID from chain identifier
   */
  static getChainId(chain: string): number | null {
    return CHAIN_IDENTIFIERS[chain] || null;
  }

  /**
   * Get chain identifier from chain ID
   */
  static getChainIdentifier(chainId: number): string | null {
    return CHAIN_ID_TO_IDENTIFIER[chainId] || null;
  }

  /**
   * Resolve EIP-3770 formatted address to actual address
   */
  async resolve(encoded: string): Promise<ResolvedAddress | null> {
    const decoded = EIP3770NNS.decode(encoded);
    if (!decoded) {
      return null;
    }

    const { chain, identifier, type } = decoded;

    // If it's already an address, return it
    if (type === 'address') {
      return {
        address: identifier,
        chain,
        original: encoded
      };
    }

    // If it's a domain, resolve it
    if (type === 'domain') {
      // Check if it's NNS domain and we're on the right chain
      if (EIP3770NNS.isNNSDomain(identifier) && (chain === 'nex' || chain === 'nexus')) {
        const address = await this.resolveNNSDomain(identifier);
        if (address) {
          return {
            address,
            domain: identifier,
            chain,
            original: encoded
          };
        }
      }
      
      // TODO: Add support for other name services (ENS, etc.)
    }

    return null;
  }

  /**
   * Reverse resolve address to EIP-3770 format
   */
  async reverseResolve(address: string, preferredChain?: string): Promise<string | null> {
    if (!EIP3770NNS.isAddress(address)) {
      return null;
    }

    // Try to reverse resolve to NNS domain
    const domain = await this.reverseResolveNNS(address);
    if (domain) {
      const chain = preferredChain || 'nex';
      return EIP3770NNS.encode(chain, domain);
    }

    // If no domain found, return address with chain
    const chain = preferredChain || EIP3770NNS.getChainIdentifier(this.nnsConfig.chainId) || 'nex';
    return EIP3770NNS.encode(chain, address);
  }

  /**
   * Resolve NNS domain to address
   */
  private async resolveNNSDomain(domain: string): Promise<string | null> {
    try {
      // Calculate namehash
      const node = ethers.namehash(domain);

      // Get resolver from registry
      const registry = new ethers.Contract(
        this.nnsConfig.contracts.registry,
        ['function resolver(bytes32) view returns (address)'],
        this.provider
      );

      const resolverAddress = await registry.resolver(node);
      if (resolverAddress === ethers.ZeroAddress) {
        return null;
      }

      // Get address from resolver
      const resolver = new ethers.Contract(
        resolverAddress,
        ['function addr(bytes32) view returns (address)'],
        this.provider
      );

      const address = await resolver.addr(node);
      return address === ethers.ZeroAddress ? null : address;
    } catch (error) {
      console.error('Error resolving NNS domain:', error);
      return null;
    }
  }

  /**
   * Reverse resolve address to NNS domain
   */
  private async reverseResolveNNS(address: string): Promise<string | null> {
    try {
      // Create reverse node
      const reverseNode = ethers.namehash(
        `${address.toLowerCase().substring(2)}.addr.reverse`
      );

      // Get resolver
      const registry = new ethers.Contract(
        this.nnsConfig.contracts.registry,
        ['function resolver(bytes32) view returns (address)'],
        this.provider
      );

      const resolverAddress = await registry.resolver(reverseNode);
      if (resolverAddress === ethers.ZeroAddress) {
        return null;
      }

      // Get name
      const resolver = new ethers.Contract(
        resolverAddress,
        ['function name(bytes32) view returns (string)'],
        this.provider
      );

      const name = await resolver.name(reverseNode);
      return name || null;
    } catch (error) {
      console.error('Error reverse resolving address:', error);
      return null;
    }
  }

  /**
   * Batch resolve multiple EIP-3770 addresses
   */
  async batchResolve(encoded: string[]): Promise<(ResolvedAddress | null)[]> {
    const promises = encoded.map(addr => this.resolve(addr));
    return Promise.all(promises);
  }

  /**
   * Validate EIP-3770 format
   */
  static validate(encoded: string): boolean {
    const decoded = this.decode(encoded);
    if (!decoded) {
      return false;
    }

    const { chain, identifier, type } = decoded;

    // Check if chain is supported
    if (!CHAIN_IDENTIFIERS[chain]) {
      return false;
    }

    // Validate identifier based on type
    if (type === 'address') {
      return this.isAddress(identifier);
    } else if (type === 'domain') {
      return this.isDomain(identifier);
    }

    return false;
  }

  /**
   * Format address for display
   */
  static formatForDisplay(resolved: ResolvedAddress): string {
    if (resolved.domain) {
      return `${resolved.domain} (${resolved.chain})`;
    }
    return `${resolved.address.substring(0, 6)}...${resolved.address.substring(38)} (${resolved.chain})`;
  }

  /**
   * Get supported chains
   */
  static getSupportedChains(): Record<string, number> {
    return { ...CHAIN_IDENTIFIERS };
  }
}

/**
 * Utility functions for EIP-3770 NNS
 */
export class EIP3770Utils {
  /**
   * Auto-detect and format input
   */
  static autoFormat(input: string, defaultChain: string = 'nex'): string {
    // If already EIP-3770 format, return as is
    if (input.includes(':')) {
      return input;
    }

    // If it's an address, add chain prefix
    if (EIP3770NNS.isAddress(input)) {
      return EIP3770NNS.encode(defaultChain, input);
    }

    // If it's a domain, add chain prefix
    if (EIP3770NNS.isDomain(input)) {
      const chain = EIP3770NNS.isNNSDomain(input) ? 'nex' : defaultChain;
      return EIP3770NNS.encode(chain, input);
    }

    return input;
  }

  /**
   * Extract plain identifier from EIP-3770 format
   */
  static extractIdentifier(encoded: string): string {
    const decoded = EIP3770NNS.decode(encoded);
    return decoded ? decoded.identifier : encoded;
  }

  /**
   * Extract chain from EIP-3770 format
   */
  static extractChain(encoded: string): string | null {
    const decoded = EIP3770NNS.decode(encoded);
    return decoded ? decoded.chain : null;
  }

  /**
   * Check if input needs resolution
   */
  static needsResolution(input: string): boolean {
    const decoded = EIP3770NNS.decode(input);
    if (!decoded) {
      return EIP3770NNS.isDomain(input);
    }
    return decoded.type === 'domain';
  }

  /**
   * Normalize EIP-3770 address
   */
  static normalize(encoded: string): string {
    const decoded = EIP3770NNS.decode(encoded);
    if (!decoded) {
      return encoded;
    }

    const { chain, identifier, type } = decoded;

    // Normalize chain to lowercase
    const normalizedChain = chain.toLowerCase();

    // Normalize identifier
    let normalizedIdentifier = identifier;
    if (type === 'address') {
      normalizedIdentifier = ethers.getAddress(identifier); // Checksum address
    } else if (type === 'domain') {
      normalizedIdentifier = identifier.toLowerCase();
    }

    return EIP3770NNS.encode(normalizedChain, normalizedIdentifier);
  }
}

// Export default instance
export default EIP3770NNS;

// Export types
export type { EIP3770Address, NNSConfig, ResolvedAddress };