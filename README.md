# Nexus Name Service (NNS)

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