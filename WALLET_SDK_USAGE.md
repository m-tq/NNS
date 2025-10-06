# NNS Wallet SDK Usage

This SDK provides `.nex` domain resolution for wallets and dapps outside of MetaMask Snap.

## Install

In your project, add the SDK as a local dependency or publish it:

```
npm i @nns/wallet-sdk
```

## Resolve a .nex name

```
import { resolveNex } from '@nns/wallet-sdk';

const addr = await resolveNex('alice.nex');
console.log(addr); // 0x... or null
```

You can override defaults:

```
await resolveNex('alice.nex', {
  rpcUrl: 'https://testnet3.rpc.nexus.xyz',
  chainId: 3940,
  network: 'nexusTestnet',
  registryAddress: '0x35481Ed34c3E6446EaafDca622369Df4295dce31',
  defaultResolverAddress: '0x3C7bc6E4C65A194B3Bec187a3D6ef97A61F9DcD5',
  registrarAddress: '0x5d716F4b16A135ca401a428B203A7107AD353950',
});
```