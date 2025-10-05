# Nexus Name Service (NNS) - Deployment Guide

## 📋 Overview

Nexus Name Service (NNS) adalah sistem penamaan domain terdesentralisasi untuk Nexus blockchain yang memungkinkan pengguna untuk:
- Mendaftarkan domain `.nex` 
- Menghubungkan domain dengan alamat wallet
- Transfer kepemilikan domain
- Resolusi domain ke alamat

## 🚀 Deployed Contracts

### Nexus Testnet (Chain ID: 3940)

| Contract | Address | Description |
|----------|---------|-------------|
| **NNS Registry** | `0x3b3511fe9E580DE668a1338a4E9DB70f10e44109` | Core registry untuk semua domain |
| **Public Resolver** | `0x15bec143cCD00A98B755a649ED43c64630f7Acee` | Resolver untuk mapping domain ke alamat |
| **Nex Registrar** | `0xEb969f9A20be36691ffefAAFE0572B8B458DFA0E` | Registrar untuk domain .nex |

### Konfigurasi Sistem
- **Registration Fee**: 0.01 NEX
- **Minimum Duration**: 1 tahun (31,536,000 detik)
- **Maximum Duration**: 10 tahun
- **TLD**: `.nex`

## 🛠 Setup Development Environment

### Prerequisites
- Node.js 18+ 
- npm atau yarn
- MetaMask wallet
- NEX tokens untuk testnet

### 1. Clone Repository
```bash
git clone <repository-url>
cd NNS
```

### 2. Install Dependencies

#### Backend (Smart Contracts)
```bash
cd contracts
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 3. Environment Configuration

Buat file `.env` di folder `contracts`:
```env
NEXUS_PRIVATE_KEY=your_private_key_here_without_0x_prefix
```

## 📦 Deployment Process

### 1. Compile Contracts
```bash
cd contracts
npx hardhat compile
```

### 2. Deploy to Nexus Testnet
```bash
npx hardhat run scripts/deploy.js --network nexus
```

### 3. Update Frontend Configuration
```bash
node scripts/update-frontend.js
```

## 🌐 Frontend Setup

### 1. Start Development Server
```bash
cd frontend
npm run dev
```

### 2. Access Application
- URL: `http://localhost:5173`
- Pastikan MetaMask terhubung ke Nexus Testnet

## 📱 Cara Menggunakan NNS

### 1. Connect Wallet
- Buka aplikasi di browser
- Klik "Connect MetaMask"
- Pastikan terhubung ke Nexus Testnet (Chain ID: 3940)

### 2. Search Domain
- Masukkan nama domain yang diinginkan (minimal 3 karakter)
- Klik tombol search
- Sistem akan mengecek ketersediaan domain

### 3. Register Domain
- Jika domain tersedia, klik "Register Domain"
- Konfirmasi transaksi di MetaMask
- Bayar fee registrasi (0.01 NEX)
- Tunggu konfirmasi transaksi

### 4. Manage Domain
- Domain yang terdaftar akan muncul di dashboard
- Anda dapat transfer kepemilikan atau update resolver

## 🔧 Network Configuration

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
1. Buka MetaMask
2. Klik "Add Network"
3. Masukkan detail network di atas
4. Simpan dan switch ke network

## 🧪 Testing

### Unit Tests
```bash
cd contracts
npx hardhat test
```

### Integration Tests
1. Deploy contracts ke local network
2. Start frontend
3. Test registrasi domain
4. Test transfer domain
5. Test resolusi domain

## 📊 Contract Interactions

### Register Domain
```javascript
const registrarContract = new ethers.Contract(
  REGISTRAR_ADDRESS,
  NEX_REGISTRAR_ABI,
  signer
);

const tx = await registrarContract.register(
  "mydomain",
  ownerAddress,
  duration,
  { value: registrationFee }
);
```

### Check Domain Availability
```javascript
const isAvailable = await registrarContract.available("mydomain");
```

### Get Domain Info
```javascript
const [owner, expires, exists] = await registrarContract.getDomain("mydomain");
```

## 🔍 Troubleshooting

### Common Issues

1. **Transaction Failed**
   - Pastikan balance NEX cukup
   - Check gas limit
   - Pastikan domain belum terdaftar

2. **Network Error**
   - Pastikan terhubung ke Nexus Testnet
   - Check RPC endpoint
   - Restart MetaMask jika perlu

3. **Contract Not Found**
   - Pastikan alamat contract benar
   - Check network yang aktif
   - Verify deployment

### Debug Commands
```bash
# Check contract deployment
npx hardhat verify --network nexus <contract-address>

# Check network connection
npx hardhat run scripts/check-network.js --network nexus
```

## 📈 Monitoring

### Block Explorer
- Nexus Testnet: https://testnet3.explorer.nexus.xyz
- Search contract addresses untuk melihat transaksi

### Events
Monitor events dari contracts:
- `DomainRegistered`
- `DomainRenewed` 
- `DomainTransferred`

## 🔐 Security Considerations

1. **Private Keys**: Jangan commit private keys ke repository
2. **Access Control**: Hanya owner yang bisa mengubah konfigurasi
3. **Reentrancy**: Contracts menggunakan ReentrancyGuard
4. **Input Validation**: Semua input divalidasi

## 📞 Support

Jika mengalami masalah:
1. Check dokumentasi ini
2. Review error messages
3. Check network status
4. Contact development team

## 🎯 Next Steps

1. Deploy ke mainnet Nexus
2. Implement subdomain support
3. Add reverse resolution
4. Create mobile app
5. Integrate with other dApps

---

**Last Updated**: December 2024
**Version**: 1.0.0