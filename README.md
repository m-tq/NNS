# Nexus Name Service (NNS)

Nexus Name Service is a monorepo that implements domain registration and resolution for `.nex` names, a web UI, smart contracts, a MetaMask Snap, and supporting SDKs/utilities.

## Project Layout

```
NNS/
├── contracts/            # Hardhat project for NNS smart contracts
│   ├── contracts/        # Solidity sources (NNSRegistry, PublicResolver, etc.)
│   ├── scripts/          # Deploy and helper scripts
│   ├── test/             # Contract tests
│   └── hardhat.config.js
├── frontend/             # Vite + React app for NNS UI
│   ├── src/              # Components, providers, lib, config
│   └── package.json
├── metamask-snap/        # MetaMask Snap (NNS utilities inside MetaMask)
│   ├── src/              # Snap source and tests
│   └── package.json
├── eip-3770-nns/         # EIP-3770 utilities adapted for NNS
│   ├── src/
│   └── examples/
├── wallet-sdk/           # Lightweight wallet SDK helpers
└── README.md
```

## Requirements

- Node.js 18+ and npm
- A browser wallet (MetaMask) on Nexus Testnet (Chain ID `3940`)
- Optional: Hardhat and a local Ethereum-compatible RPC for contract work

## Quick Start

Install dependencies for each workspace you plan to use:

```
# Frontend
cd frontend && npm install

# Contracts
cd ../contracts && npm install

# MetaMask Snap
cd ../metamask-snap && npm install

# EIP-3770 NNS utils
cd ../eip-3770-nns && npm install

# Wallet SDK
cd ../wallet-sdk && npm install
```

## Frontend (Web UI)

```
cd frontend
npm run dev
```

- Local dev server runs on a Vite port (e.g., `http://localhost:5175/`).
- Ensure your wallet is connected to Nexus Testnet (`3940`).
- The UI supports sending NEX to either `0x…` addresses or `.nex` domains.
- Transaction feedback appears in a modal with a direct “View on Explorer” link.

## Contracts (Hardhat)

```
cd contracts
npx hardhat test

# Example deploy (adjust network settings as needed)
npx hardhat run scripts/deploy.js --network <yourNetwork>
```

- Key contracts live in `contracts/contracts/` (e.g., `NNSRegistry.sol`, `PublicResolver.sol`).
- After deploying, you can sync addresses to the frontend using helper scripts (e.g., `scripts/update-frontend.js`) or by updating `frontend/src/config/contracts` accordingly.

## MetaMask Snap

```
cd metamask-snap
npm run serve
```

- Open `http://localhost:8080/installer.html` to install/load the Snap in MetaMask.
- The Snap provides `.nex` resolution utilities directly in the wallet context.

## EIP-3770 NNS Utilities

```
cd eip-3770-nns
npm run build
node examples/usage.js
```

- Utilities for resolving and formatting addresses/domains in wallets and dApps.
- See `examples/usage.js` for a minimal end-to-end flow.

## Wallet SDK

Lightweight helpers to integrate NNS domain resolution into wallet flows. Explore `wallet-sdk/src/index.ts` and the `WALLET_SDK_USAGE.md` for patterns and examples.

## Network & Explorer

- Chain: Nexus Testnet (`3940`)
- Explorer: `https://testnet3.explorer.nexus.xyz`

### Deployed Contracts (nexusTestnet)

- `NNSRegistry`: `0x35481Ed34c3E6446EaafDca622369Df4295dce31`
- `PublicResolver`: `0x3C7bc6E4C65A194B3Bec187a3D6ef97A61F9DcD5`
- `NexRegistrar`: `0x5d716F4b16A135ca401a428B203A7107AD353950`
- `.nex` namehash: `0xc0eeb4cc47d0657cda96dad89833396eb827350b2d6c9ad16a9776455adf74dc`

## Troubleshooting

- “Switch network” errors: ensure MetaMask is on Nexus Testnet (`3940`).
- “Insufficient funds”: top up NEX in the active account to cover amount and gas.
- “Transaction pending too long”: use the Explorer link in the modal to verify status; the UI does not block while confirmation is processed.
- Domain resolution:
  - The app first attempts resolver `addr(node)` and `addr(node, 60)` (EVM coin type).
  - If no record exists, it falls back to `NNSRegistry.owner(node)` so valid domains without `addr` can still resolve.

## Contributing

PRs and issues are welcome. Keep changes minimal and consistent with existing patterns. For contract changes, include tests where appropriate.

A decentralized naming service for the Nexus blockchain that allows users to map human-readable names (like `alice.nex`) to Nexus addresses.

## Project Structure

```
NNS/
├── contracts/          # Smart contracts (Hardhat project)
├── frontend/          # React frontend application
└── README.md         # This file
```

## Network Information

- **Chain ID**: 3940
- **Native Token**: Nexus Token (NEX)
- **RPC (HTTP)**: https://testnet3.rpc.nexus.xyz
- **RPC (WebSocket)**: wss://testnet3.rpc.nexus.xyz
- **Explorer**: https://testnet3.explorer.nexus.xyz
- **Faucet**: https://faucets.alchemy.com/faucets/nexus-testnet

## Features

- Register `.nex` domain names
- Resolve names to Nexus addresses
- Reverse resolution (address to name)
- Modern React frontend with dark/light theme
- Built with shadcn/ui components

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- MetaMask or compatible wallet

### Installation

1. Clone the repository
2. Install contract dependencies: `cd contracts && npm install`
3. Install frontend dependencies: `cd frontend && npm install`

### Development

1. Deploy contracts to Nexus testnet
2. Start the frontend development server
3. Connect your wallet to Nexus testnet

## License

MIT