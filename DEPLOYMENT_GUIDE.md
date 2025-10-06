# Nexus Name Service (NNS) — Deployment Guide

## Overview

Nexus Name Service (NNS) is a decentralized naming system for the Nexus blockchain that allows users to:
- Register `.nex` domains
- Map domains to wallet addresses
- Transfer domain ownership
- Resolve domains to addresses

## Deployed Contracts

### Nexus Testnet (Chain ID: 3940)

| Contract | Address | Description |
|----------|---------|-------------|
| **NNS Registry** | `0x35481Ed34c3E6446EaafDca622369Df4295dce31` | Core registry for all domains |
| **Public Resolver** | `0x3C7bc6E4C65A194B3Bec187a3D6ef97A61F9DcD5` | Resolver for mapping domains to addresses |
| **Nex Registrar** | `0x5d716F4b16A135ca401a428B203A7107AD353950` | Registrar for `.nex` domains |

### System Configuration
- Registration Fee: 0.01 NEX
- Minimum Duration: 1 year (31,536,000 seconds)
- Maximum Duration: 10 years
- TLD: `.nex`
- `.nex` namehash: `0xc0eeb4cc47d0657cda96dad89833396eb827350b2d6c9ad16a9776455adf74dc`

## Setup: Development Environment

### Prerequisites
- Node.js 18+
- npm (or yarn)
- MetaMask wallet
- NEX tokens for testnet

### 1) Clone Repository
```bash
git clone <repository-url>
cd NNS
```

### 2) Install Dependencies

Contracts:
```bash
cd contracts
npm install
```

Frontend:
```bash
cd ../frontend
npm install
```

MetaMask Snap:
```bash
cd ../metamask-snap
npm install
```

### 3) Environment Configuration (contracts)

Create `.env` file under `contracts`:
```env
NEXUS_PRIVATE_KEY=your_private_key_here_without_0x_prefix
```

## Deployment Process

### 1) Compile Contracts
```bash
cd contracts
npx hardhat compile
```

### 2) Deploy to Nexus Testnet
```bash
npx hardhat run scripts/deploy.js --network nexusTestnet
```

This will write `contracts/deployment.json` with addresses and metadata:
```json
{
  "network": "nexusTestnet",
  "chainId": 3940,
  "contracts": {
    "NNSRegistry": "0x35481Ed34c3E6446EaafDca622369Df4295dce31",
    "PublicResolver": "0x3C7bc6E4C65A194B3Bec187a3D6ef97A61F9DcD5",
    "NexRegistrar": "0x5d716F4b16A135ca401a428B203A7107AD353950"
  },
  "deployer": "<address>",
  "timestamp": "<ISO>",
  "nexNamehash": "0xc0ee...f74dc"
}
```

### 3) Update Frontend Configuration
```bash
node scripts/update-frontend.js
```

This syncs deployed contract addresses into `frontend/src/config/contracts.ts` for the active chain ID.

## Frontend Setup

### 1) Start Development Server
```bash
cd frontend
npm run dev
```

### 2) Access Application
- Local URL: `http://localhost:5175/` (port may vary)
- Ensure MetaMask is connected to Nexus Testnet (Chain ID: 3940)

## Using NNS

### Connect Wallet
- Open the app in your browser
- Click “Connect Wallet”
- Switch to Nexus Testnet (3940) if prompted

### Search Domain
- Enter the desired domain name (minimum 3 characters)
- Click the search button
- The system checks if the domain is available

### Register Domain
- If available, click “Register Domain”
- Confirm the transaction in MetaMask
- Pay the registration fee
- Wait for transaction confirmation

### Manage Domain
- Registered domains appear in the dashboard
- You can transfer ownership or update resolver records

## Network Configuration

### Nexus Testnet
```javascript
{
  chainId: 3940,
  name: "Nexus Testnet",
  rpcUrl: "https://testnet3.rpc.nexus.xyz",
  explorerUrl: "https://testnet3.explorer.nexus.xyz",
  nativeCurrency: {
    name: "Nexus Token",
    symbol: "NEX",
    decimals: 18
  }
}
```

### Add Network to MetaMask
1. Open MetaMask
2. Click “Add Network”
3. Enter the network details above
4. Save and switch to the network

## Testing

### Unit Tests (contracts)
```bash
cd contracts
npx hardhat test
```

### Integration Tests
1. Deploy contracts to a local or test network
2. Start the frontend
3. Test domain registration
4. Test domain transfer
5. Test domain resolution

## Contract Interactions (examples)

### Register Domain
```javascript
const registrar = new ethers.Contract(
  REGISTRAR_ADDRESS,
  NEX_REGISTRAR_ABI,
  signer
);

const tx = await registrar.register(
  "mydomain",
  ownerAddress,
  duration,
  { value: registrationFee }
);
```

### Check Domain Availability
```javascript
const isAvailable = await registrar.available("mydomain");
```

### Get Domain Info
```javascript
const [owner, expires, exists] = await registrar.getDomain("mydomain");
```

## Troubleshooting

1) Transaction Failed
- Ensure you have enough NEX
- Check gas limits
- Confirm the domain is not already registered

2) Network Error
- Make sure you’re on Nexus Testnet (3940)
- Verify the RPC endpoint
- Restart MetaMask if needed

3) Contract Not Found
- Verify contract addresses
- Check the active network
- Confirm deployment completed successfully

### Debug Commands
```bash
# Verify a contract
npx hardhat verify --network nexusTestnet <contract-address>

# Check network connectivity
npx hardhat run scripts/verify-deployment.js --network nexusTestnet
```

## Monitoring

### Explorer
- Nexus Testnet: https://testnet3.explorer.nexus.xyz
- Look up contract addresses to view transactions and events

### Events to Watch
- `DomainRegistered`
- `DomainRenewed`
- `DomainTransferred`

## Security Considerations

1) Private Keys: Never commit private keys to the repository
2) Access Control: Only domain owners can modify records
3) Reentrancy: Contracts use `ReentrancyGuard`
4) Input Validation: All inputs are validated

## Support

If you encounter issues:
1. Check this guide
2. Review error messages
3. Check network status
4. Contact the development team

## Next Steps

1) Deploy to Nexus mainnet
2) Implement subdomain support
3) Add reverse resolution
4) Create a mobile app
5) Integrate with other dApps

---

Last Updated: October 2025
Version: 1.0.0