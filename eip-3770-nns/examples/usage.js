/**
 * EIP-3770 NNS Usage Examples
 * 
 * Contoh penggunaan EIP-3770 address format dengan Nexus Name Service
 */

import EIP3770NNS, { EIP3770Utils } from '../dist/index.js';

async function main() {
  console.log('🔗 EIP-3770 NNS Examples\n');

  // Initialize EIP-3770 NNS
  const eip3770 = new EIP3770NNS();

  // ========================================
  // 1. ENCODING & DECODING
  // ========================================
  console.log('📝 1. Encoding & Decoding');
  console.log('========================');

  // Encode domain
  const encodedDomain = EIP3770NNS.encode('nex', 'alice.nex');
  console.log('Encoded domain:', encodedDomain); // nex:alice.nex

  // Encode address
  const encodedAddress = EIP3770NNS.encode('nex', '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87');
  console.log('Encoded address:', encodedAddress); // nex:0x742d35Cc6634C0532925a3b8D4C9db96590c6C87

  // Decode
  const decodedDomain = EIP3770NNS.decode(encodedDomain);
  console.log('Decoded domain:', decodedDomain);
  // { chain: 'nex', identifier: 'alice.nex', type: 'domain' }

  const decodedAddress = EIP3770NNS.decode(encodedAddress);
  console.log('Decoded address:', decodedAddress);
  // { chain: 'nex', identifier: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87', type: 'address' }

  console.log('\n');

  // ========================================
  // 2. RESOLUTION
  // ========================================
  console.log('🔍 2. Resolution');
  console.log('================');

  try {
    // Resolve domain
    const resolved = await eip3770.resolve('nex:alice.nex');
    if (resolved) {
      console.log('Resolved alice.nex:', resolved);
      // {
      //   address: '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
      //   domain: 'alice.nex',
      //   chain: 'nex',
      //   original: 'nex:alice.nex'
      // }
    } else {
      console.log('❌ Could not resolve alice.nex');
    }

    // Resolve address (should return as-is)
    const resolvedAddr = await eip3770.resolve('nex:0x742d35Cc6634C0532925a3b8D4C9db96590c6C87');
    if (resolvedAddr) {
      console.log('Resolved address:', resolvedAddr);
    }

  } catch (error) {
    console.error('Resolution error:', error.message);
  }

  console.log('\n');

  // ========================================
  // 3. REVERSE RESOLUTION
  // ========================================
  console.log('🔄 3. Reverse Resolution');
  console.log('========================');

  try {
    const address = '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87';
    const reversed = await eip3770.reverseResolve(address);
    console.log(`Reverse resolve ${address}:`, reversed);
    // Should return: nex:alice.nex (if reverse record exists)
    // Or: nex:0x742d35Cc6634C0532925a3b8D4C9db96590c6C87

  } catch (error) {
    console.error('Reverse resolution error:', error.message);
  }

  console.log('\n');

  // ========================================
  // 4. BATCH RESOLUTION
  // ========================================
  console.log('📦 4. Batch Resolution');
  console.log('======================');

  const addresses = [
    'nex:alice.nex',
    'nex:bob.nex',
    'nex:0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
    'eth:vitalik.eth'
  ];

  try {
    const batchResults = await eip3770.batchResolve(addresses);
    console.log('Batch resolution results:');
    batchResults.forEach((result, index) => {
      console.log(`  ${addresses[index]} ->`, result ? result.address : 'null');
    });
  } catch (error) {
    console.error('Batch resolution error:', error.message);
  }

  console.log('\n');

  // ========================================
  // 5. VALIDATION
  // ========================================
  console.log('✅ 5. Validation');
  console.log('================');

  const testCases = [
    'nex:alice.nex',
    'eth:vitalik.eth',
    'nex:0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
    'invalid:format',
    'alice.nex', // Missing chain
    'nex:', // Missing identifier
    'unknown:test.domain'
  ];

  testCases.forEach(testCase => {
    const isValid = EIP3770NNS.validate(testCase);
    console.log(`  ${testCase.padEnd(35)} -> ${isValid ? '✅' : '❌'}`);
  });

  console.log('\n');

  // ========================================
  // 6. UTILITY FUNCTIONS
  // ========================================
  console.log('🛠️  6. Utility Functions');
  console.log('========================');

  // Auto format
  const inputs = [
    'alice.nex',
    '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87',
    'vitalik.eth',
    'nex:bob.nex'
  ];

  console.log('Auto formatting:');
  inputs.forEach(input => {
    const formatted = EIP3770Utils.autoFormat(input);
    console.log(`  ${input.padEnd(35)} -> ${formatted}`);
  });

  console.log('\nExtracting identifiers:');
  const eip3770Addresses = [
    'nex:alice.nex',
    'eth:vitalik.eth',
    'nex:0x742d35Cc6634C0532925a3b8D4C9db96590c6C87'
  ];

  eip3770Addresses.forEach(addr => {
    const identifier = EIP3770Utils.extractIdentifier(addr);
    const chain = EIP3770Utils.extractChain(addr);
    console.log(`  ${addr} -> identifier: ${identifier}, chain: ${chain}`);
  });

  console.log('\nNormalization:');
  const unnormalized = [
    'NEX:ALICE.NEX',
    'nex:0x742d35cc6634c0532925a3b8d4c9db96590c6c87', // lowercase address
    'ETH:Vitalik.ETH'
  ];

  unnormalized.forEach(addr => {
    const normalized = EIP3770Utils.normalize(addr);
    console.log(`  ${addr.padEnd(35)} -> ${normalized}`);
  });

  console.log('\n');

  // ========================================
  // 7. CHAIN SUPPORT
  // ========================================
  console.log('🌐 7. Supported Chains');
  console.log('======================');

  const supportedChains = EIP3770NNS.getSupportedChains();
  console.log('Supported chains:');
  Object.entries(supportedChains).forEach(([identifier, chainId]) => {
    console.log(`  ${identifier.padEnd(10)} -> Chain ID: ${chainId}`);
  });

  console.log('\n');

  // ========================================
  // 8. WALLET INTEGRATION EXAMPLE
  // ========================================
  console.log('💳 8. Wallet Integration Example');
  console.log('=================================');

  class ExampleWallet {
    constructor() {
      this.eip3770 = new EIP3770NNS();
    }

    async sendTransaction(to, amount) {
      console.log(`\n📤 Sending ${amount} NEX to: ${to}`);

      // Check if recipient needs resolution
      if (EIP3770Utils.needsResolution(to)) {
        console.log('🔍 Resolving recipient address...');
        
        const resolved = await this.eip3770.resolve(to);
        if (resolved) {
          console.log(`✅ Resolved to: ${resolved.address}`);
          if (resolved.domain) {
            console.log(`📝 Domain: ${resolved.domain}`);
          }
          to = resolved.address;
        } else {
          throw new Error(`❌ Cannot resolve: ${to}`);
        }
      }

      // Simulate transaction
      console.log(`💸 Transaction sent to: ${to}`);
      return { to, amount, txHash: '0x...' };
    }

    async formatAddressForDisplay(address) {
      const reversed = await this.eip3770.reverseResolve(address);
      if (reversed && reversed.includes('.nex')) {
        return EIP3770Utils.extractIdentifier(reversed);
      }
      return `${address.substring(0, 6)}...${address.substring(38)}`;
    }
  }

  // Test wallet integration
  const wallet = new ExampleWallet();

  try {
    // Send to domain
    await wallet.sendTransaction('nex:alice.nex', '1.0');

    // Send to address
    await wallet.sendTransaction('nex:0x742d35Cc6634C0532925a3b8D4C9db96590c6C87', '0.5');

    // Format address for display
    const displayName = await wallet.formatAddressForDisplay('0x742d35Cc6634C0532925a3b8D4C9db96590c6C87');
    console.log(`\n📱 Display name: ${displayName}`);

  } catch (error) {
    console.error('Wallet error:', error.message);
  }

  console.log('\n🎉 Examples completed!');
}

// Run examples
main().catch(console.error);