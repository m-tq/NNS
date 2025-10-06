# Guide Integrasi .nex Domain untuk Wallet Apps

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Implementasi Resolusi Domain](#implementasi-resolusi-domain)
4. [Integrasi dengan Wallet](#integrasi-dengan-wallet)
5. [Contoh Kode](#contoh-kode)
6. [Testing](#testing)
7. [Best Practices](#best-practices)

## Pengenalan

Nexus Name Service (NNS) memungkinkan pengguna untuk menggunakan nama domain yang mudah diingat (seperti `alice.nex`) sebagai pengganti alamat wallet yang panjang dan rumit. Guide ini menjelaskan cara mengintegrasikan dukungan .nex domain ke dalam aplikasi wallet.

## Arsitektur Sistem

### Komponen Utama
- **NNS Registry Contract**: Contract utama yang menyimpan mapping domain ke alamat
- **Resolver Contract**: Contract yang menangani resolusi domain ke alamat wallet
- **Domain Registration**: Sistem untuk mendaftarkan domain baru

### Network Information
- **Network**: Nexus Testnet
- **Chain ID**: 3940
- **RPC URL**: `https://testnet3.rpc.nexus.xyz`
- **Explorer**: `https://testnet3.explorer.nexus.xyz`

## Implementasi Resolusi Domain

### 1. Setup Contract Connection

```javascript
import { ethers } from 'ethers';

// Contract addresses untuk Nexus Testnet
const CONTRACT_ADDRESSES = {
  NexRegistrar: "0x1234567890123456789012345678901234567890", // Ganti dengan alamat sebenarnya
  NexResolver: "0x0987654321098765432109876543210987654321"  // Ganti dengan alamat sebenarnya
};

// ABI untuk resolver contract
const RESOLVER_ABI = [
  "function resolve(string memory name) external view returns (address)",
  "function reverseResolve(address addr) external view returns (string memory)"
];

// Setup provider
const provider = new ethers.JsonRpcProvider('https://testnet3.rpc.nexus.xyz');
const resolverContract = new ethers.Contract(
  CONTRACT_ADDRESSES.NexResolver,
  RESOLVER_ABI,
  provider
);
```

### 2. Fungsi Resolusi Domain

```javascript
/**
 * Resolve .nex domain ke alamat wallet
 * @param {string} domain - Domain name (tanpa .nex suffix)
 * @returns {string|null} - Alamat wallet atau null jika tidak ditemukan
 */
async function resolveDomain(domain) {
  try {
    // Hapus .nex suffix jika ada
    const cleanDomain = domain.replace('.nex', '');
    
    // Panggil contract untuk resolve domain
    const address = await resolverContract.resolve(cleanDomain);
    
    // Check jika address valid (bukan zero address)
    if (address === '0x0000000000000000000000000000000000000000') {
      return null;
    }
    
    return address;
  } catch (error) {
    console.error('Error resolving domain:', error);
    return null;
  }
}

/**
 * Reverse resolve alamat wallet ke domain
 * @param {string} address - Alamat wallet
 * @returns {string|null} - Domain name atau null jika tidak ditemukan
 */
async function reverseResolveDomain(address) {
  try {
    const domain = await resolverContract.reverseResolve(address);
    
    if (!domain || domain === '') {
      return null;
    }
    
    return domain + '.nex';
  } catch (error) {
    console.error('Error reverse resolving address:', error);
    return null;
  }
}
```

### 3. Validasi Domain

```javascript
/**
 * Validasi format domain .nex
 * @param {string} domain - Domain untuk divalidasi
 * @returns {boolean} - True jika valid
 */
function isValidNexDomain(domain) {
  // Check format dasar
  if (!domain || typeof domain !== 'string') {
    return false;
  }
  
  // Hapus .nex suffix untuk validasi
  const cleanDomain = domain.replace('.nex', '');
  
  // Validasi panjang (3-63 karakter)
  if (cleanDomain.length < 3 || cleanDomain.length > 63) {
    return false;
  }
  
  // Validasi karakter (hanya huruf, angka, dan hyphen)
  const validPattern = /^[a-z0-9-]+$/;
  if (!validPattern.test(cleanDomain)) {
    return false;
  }
  
  // Tidak boleh dimulai atau diakhiri dengan hyphen
  if (cleanDomain.startsWith('-') || cleanDomain.endsWith('-')) {
    return false;
  }
  
  return true;
}
```

## Integrasi dengan Wallet

### 1. Input Field Enhancement

```javascript
/**
 * Enhanced input field yang mendukung resolusi domain
 */
class AddressInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: '',
      resolvedAddress: null,
      isResolving: false,
      error: null
    };
  }

  async handleInputChange(value) {
    this.setState({ inputValue: value, error: null });
    
    // Check jika input adalah domain .nex
    if (value.endsWith('.nex') && isValidNexDomain(value)) {
      this.setState({ isResolving: true });
      
      try {
        const resolvedAddress = await resolveDomain(value);
        
        if (resolvedAddress) {
          this.setState({ 
            resolvedAddress,
            isResolving: false 
          });
          
          // Callback ke parent component
          this.props.onAddressResolved(resolvedAddress);
        } else {
          this.setState({ 
            error: 'Domain tidak ditemukan',
            isResolving: false 
          });
        }
      } catch (error) {
        this.setState({ 
          error: 'Error resolving domain',
          isResolving: false 
        });
      }
    } else if (ethers.isAddress(value)) {
      // Input adalah alamat valid
      this.setState({ resolvedAddress: value });
      this.props.onAddressResolved(value);
    } else {
      // Reset state jika input tidak valid
      this.setState({ resolvedAddress: null });
      this.props.onAddressResolved(null);
    }
  }

  render() {
    const { inputValue, resolvedAddress, isResolving, error } = this.state;
    
    return (
      <div className="address-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => this.handleInputChange(e.target.value)}
          placeholder="Masukkan alamat atau domain .nex"
          className={error ? 'error' : ''}
        />
        
        {isResolving && (
          <div className="resolving-indicator">
            Resolving domain...
          </div>
        )}
        
        {resolvedAddress && inputValue.endsWith('.nex') && (
          <div className="resolved-address">
            Resolved to: {resolvedAddress}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    );
  }
}
```

### 2. Address Display Enhancement

```javascript
/**
 * Enhanced address display yang menampilkan domain jika tersedia
 */
async function enhancedAddressDisplay(address) {
  try {
    // Coba reverse resolve alamat ke domain
    const domain = await reverseResolveDomain(address);
    
    if (domain) {
      return {
        display: domain,
        full: address,
        type: 'domain'
      };
    } else {
      // Tampilkan alamat dengan format pendek
      return {
        display: `${address.slice(0, 6)}...${address.slice(-4)}`,
        full: address,
        type: 'address'
      };
    }
  } catch (error) {
    // Fallback ke alamat biasa
    return {
      display: `${address.slice(0, 6)}...${address.slice(-4)}`,
      full: address,
      type: 'address'
    };
  }
}
```

### 3. Transaction Enhancement

```javascript
/**
 * Enhanced transaction function yang mendukung domain
 */
async function sendTransaction(to, amount, options = {}) {
  let resolvedAddress = to;
  
  // Jika 'to' adalah domain, resolve dulu
  if (to.endsWith('.nex')) {
    if (!isValidNexDomain(to)) {
      throw new Error('Invalid .nex domain format');
    }
    
    resolvedAddress = await resolveDomain(to);
    
    if (!resolvedAddress) {
      throw new Error('Domain not found');
    }
  }
  
  // Validasi alamat hasil resolve
  if (!ethers.isAddress(resolvedAddress)) {
    throw new Error('Invalid address');
  }
  
  // Lanjutkan dengan transaksi normal
  const transaction = {
    to: resolvedAddress,
    value: ethers.parseEther(amount.toString()),
    ...options
  };
  
  return await wallet.sendTransaction(transaction);
}
```

## Testing

### 1. Unit Tests

```javascript
describe('NNS Integration', () => {
  test('should resolve valid domain', async () => {
    const address = await resolveDomain('alice');
    expect(ethers.isAddress(address)).toBe(true);
  });
  
  test('should return null for non-existent domain', async () => {
    const address = await resolveDomain('nonexistentdomain123');
    expect(address).toBeNull();
  });
  
  test('should validate domain format correctly', () => {
    expect(isValidNexDomain('alice.nex')).toBe(true);
    expect(isValidNexDomain('test-domain.nex')).toBe(true);
    expect(isValidNexDomain('ab.nex')).toBe(false); // too short
    expect(isValidNexDomain('-invalid.nex')).toBe(false); // starts with hyphen
  });
});
```

### 2. Integration Tests

```javascript
describe('Wallet Integration', () => {
  test('should send transaction to domain', async () => {
    const mockWallet = createMockWallet();
    const result = await sendTransaction('alice.nex', 1.0);
    
    expect(result.to).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
  
  test('should display domain instead of address', async () => {
    const display = await enhancedAddressDisplay('0x1234...');
    expect(display.type).toBe('domain');
    expect(display.display).toContain('.nex');
  });
});
```

## Best Practices

### 1. Caching
- Implementasikan caching untuk hasil resolusi domain untuk mengurangi calls ke blockchain
- Cache TTL yang disarankan: 5-10 menit

```javascript
const domainCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

async function cachedResolveDomain(domain) {
  const cacheKey = domain.toLowerCase();
  const cached = domainCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.address;
  }
  
  const address = await resolveDomain(domain);
  
  domainCache.set(cacheKey, {
    address,
    timestamp: Date.now()
  });
  
  return address;
}
```

### 2. Error Handling
- Selalu handle error dengan graceful fallback
- Berikan feedback yang jelas kepada user
- Log error untuk debugging

### 3. User Experience
- Tampilkan loading indicator saat resolving domain
- Konfirmasi alamat yang di-resolve sebelum transaksi
- Berikan opsi untuk melihat alamat penuh

### 4. Security
- Selalu validasi input domain
- Verifikasi hasil resolusi sebelum transaksi
- Implementasikan rate limiting untuk mencegah spam

### 5. Performance
- Gunakan batch requests jika memungkinkan
- Implementasikan lazy loading untuk daftar domain
- Optimize untuk mobile devices

## Contoh Implementasi Lengkap

Lihat file `src/components/nns-interface.tsx` dalam repository ini untuk contoh implementasi lengkap yang mencakup:
- Resolusi domain real-time
- UI yang user-friendly
- Error handling yang komprehensif
- Integration dengan MetaMask

## Support dan Dokumentasi

Untuk pertanyaan lebih lanjut atau support, silakan:
1. Buka issue di repository GitHub
2. Hubungi tim development melalui Discord
3. Baca dokumentasi lengkap di website resmi

## Changelog

### v1.0.0
- Initial release
- Basic domain resolution
- Wallet integration examples
- Testing framework

---

*Guide ini akan terus diupdate seiring dengan perkembangan NNS ecosystem.*