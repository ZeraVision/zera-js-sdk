# Zera JavaScript SDK

A modern, ESM-compatible JavaScript SDK for the ZERA Network with support for wallet creation, cryptography, and blockchain operations.

## 🚀 Features

- **Full ESM Support**: Modern ES6+ modules throughout
- **Wallet Creation**: HD wallet generation with BIP32/BIP39/SLIP-0010 compliance
- **Multiple Key Types**: Support for Ed25519 and Ed448 elliptic curves
- **Hash Algorithms**: SHA3-256, SHA3-512, and BLAKE3 cryptographic hashes
- **Protocol Buffers**: Modern @bufbuild/protobuf with direct property access
- **TypeScript Ready**: Full TypeScript support and type definitions

## 📋 Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd zera-js-sdk

# Install dependencies
npm install

# Install proto dependencies
npm run proto:install

# Build protocol buffers
npm run build:proto
```

## 🔧 Development Setup

### Install Global Tools

```bash
# Install buf CLI for modern protobuf management
npm install -g @bufbuild/buf

# Install protoc compiler (if not using buf)
# Windows: Download from https://github.com/protocolbuffers/protobuf/releases
# macOS: brew install protobuf
# Linux: sudo apt-get install protobuf-compiler
```

### Build Commands

```bash
# Build protocol buffers and extract enums
npm run build:proto

# Manual build (if needed)
cd proto && node build.js
```

The build process automatically:
1. Generates protobuf JavaScript files
2. Extracts enum values from the generated files
3. Creates a clean ES module at `src/shared/protobuf-enums.js`

## 📖 Usage

### Basic Wallet Creation

```javascript
import { createWallet, generateMnemonicPhrase } from 'zera-js-sdk';

// Generate a new mnemonic
const mnemonic = generateMnemonicPhrase(24);

// Create a wallet
const wallet = await createWallet({
  keyType: 'ed25519',
  hashTypes: ['sha256'],
  mnemonic: mnemonic
});

console.log('Wallet address:', wallet.address);
```

### Advanced HD Wallet

```javascript
import { WalletFactory } from 'zera-js-sdk';

const factory = new WalletFactory();

const wallet = await factory.createWallet({
  keyType: 'ed25519',
  hashTypes: ['sha3-256', 'blake3'],
  mnemonic: 'your twelve word mnemonic phrase here',
  passphrase: 'optional-passphrase',
  hdOptions: {
    accountIndex: 0,
    changeIndex: 0,
    addressIndex: 0
  }
});
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test modules
npm run test:wallet-creation
npm run test:api
npm run test:transfer

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## 📁 Project Structure

```
zera-js-sdk/
├── src/
│   ├── wallet-creation/     # HD wallet and key generation
│   ├── api/                 # API client and validation
│   ├── coin-txn/            # CoinTXN creation and submission
│   └── test-utils/          # Testing utilities
├── proto/                   # Protocol buffer definitions
│   ├── generated/           # Auto-generated protobuf classes
│   └── txn.proto           # Transaction schema
├── scripts/                 # Build and utility scripts
└── test-runner.js          # Unified test runner
```

## 🔒 Security

- Uses **@noble** libraries for cryptographic operations
- BIP32/BIP39/SLIP-0010 compliant HD wallets
- Secure random number generation
- No deprecated crypto libraries

## 📚 API Reference

### Wallet Creation

- `createWallet(options)` - Create a new wallet
- `generateMnemonicPhrase(length)` - Generate BIP39 mnemonic
- `WalletFactory` - Advanced wallet creation with options

### Key Types

- `ed25519` - Ed25519 elliptic curve (32-byte keys)
- `ed448` - Ed448 elliptic curve (57-byte keys)

### Hash Types

- `sha3-256` - SHA3-256 hash function
- `sha3-512` - SHA3-512 hash function  
- `blake3` - BLAKE3 hash function

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Documentation**: Check the [TESTING.md](TESTING.md) for detailed testing information
- **Standards Compliance**: See [STANDARDS_COMPLIANCE.md](STANDARDS_COMPLIANCE.md)

## 🔄 Migration from CommonJS

This project has been fully modernized from CommonJS to ESM. If you're migrating from an older version:

1. Update Node.js to version 18+
2. Replace `require()` with `import` statements
3. Replace `module.exports` with `export` statements
4. Update your build tools to support ESM
5. Use the new protobuf build system with buf

## 🚀 Performance

- **ESM**: Faster module loading and tree-shaking
- **Modern Crypto**: Optimized cryptographic operations
- **Efficient Protobuf**: Modern serialization with buf
- **Tree Shaking**: Smaller bundle sizes in production
