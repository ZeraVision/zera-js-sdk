# ZERA Network Wallet Creation

This module provides wallet creation functionality for the ZERA Network using BIP44 and SLIP44 standards. The codebase is organized into small, maintainable modules for better code organization and testing.

## 🏗️ Architecture

The wallet creation system is organized into the following modules:

```
src/wallet-creation/
├── constants.js          # ZERA Network constants and configuration
├── shared.js            # Shared utilities and common functions
├── ed25519.js           # ed25519 wallet creation logic
├── ed448.js             # ed448 wallet creation logic
├── utils.js             # BIP39 mnemonic generation utilities
├── index.js             # Main interface and exports
├── test.js              # Main test runner
└── tests/               # Individual module tests
    ├── test-constants.js
    ├── test-shared.js
    ├── test-ed25519.js
    ├── test-ed448.js
    └── test-integration.js
```

## ✨ Features

- ✅ **ed25519** key generation and wallet creation
- ✅ **ed448** key generation and wallet creation  
- ✅ **BIP39** mnemonic phrase validation (user must provide)
- ✅ **BIP44** hierarchical deterministic wallet structure
- ✅ **SLIP44** coin type support for ZRA (1110 / 0x80000456)
- ✅ **ZERA Network** specific address generation
- ✅ **Passphrase** support for additional security
- ✅ **Modular architecture** for maintainability
- ✅ **Comprehensive testing** with separate test files

## 📦 Installation

First, install the required dependencies:

```bash
npm install
```

## 🚀 Usage

### Basic Wallet Creation

```javascript
import { createZeraWallet } from './src/wallet-creation/index.js';

// You must provide your own BIP39 mnemonic phrase
const mnemonic = 'your twelve or twenty four word mnemonic phrase here';

// Create an ed25519 wallet
const ed25519Wallet = await createZeraWallet('ed25519', mnemonic);

// Create an ed448 wallet
const ed448Wallet = await createZeraWallet('ed448', mnemonic);
```

### Using the ZeraWallet Class

```javascript
import { ZeraWallet } from './src/wallet-creation/index.js';

const wallet = new ZeraWallet();

// Get wallet information
const info = wallet.getWalletInfo();
console.log(info);

// Get detailed key type information
const keyTypeInfo = wallet.getKeyTypeInfo();
console.log(keyTypeInfo);

// Create wallets with passphrase
const secureWallet = await wallet.createEd25519Wallet(mnemonic, 'my-secure-passphrase');
```

### Utility Functions (Optional)

```javascript
import { 
  generateMnemonic, 
  generatePassphrase, 
  assessPassphraseSecurity 
} from './src/wallet-creation/utils.js';

// Generate a new mnemonic (if you don't have one)
const newMnemonic = generateMnemonic(24); // 24 words for maximum security

// Generate a secure passphrase
const passphrase = generatePassphrase(32);

// Assess passphrase security
const security = assessPassphraseSecurity(passphrase);
console.log('Security score:', security.score);
```

## 🧪 Testing

### Run All Tests
```bash
cd src/wallet-creation
node test.js
```

### Run Individual Module Tests
```bash
# Test constants module
node tests/test-constants.js

# Test shared utilities
node tests/test-shared.js

# Test ed25519 functionality
node tests/test-ed25519.js

# Test ed448 functionality
node tests/test-ed448.js

# Test complete integration
node tests/test-integration.js
```

## 📁 Module Details

### `constants.js`
Contains all ZERA Network specific constants:
- Coin type: 1110 (0x80000456)
- Network name and symbol
- Derivation path: `m/44'/1110'/0'/0/0`
- Address version bytes
- Supported key types

### `shared.js`
Common utilities used across all wallet types:
- Mnemonic validation
- Address generation and validation
- Base wallet object creation
- Parameter validation

### `ed25519.js`
Dedicated ed25519 wallet creation:
- Uses `@noble/ed25519` library
- BIP32 hierarchical derivation
- 32-byte key generation

### `ed448.js`
Dedicated ed448 wallet creation:
- Placeholder implementation (SHA256-based)
- 56-byte key generation
- Higher security level

### `utils.js`
Optional BIP39 utilities:
- Mnemonic generation
- Passphrase generation
- Security assessment
- Validation helpers

## 🔧 Customization

The modular structure makes it easy to customize for ZERA Network's specific requirements:

1. **Address Format**: Modify `generateZeraAddress()` in `shared.js`
2. **ed448 Implementation**: Update `generateEd448PublicKey()` in `ed448.js`
3. **Constants**: Adjust values in `constants.js`
4. **New Key Types**: Add new modules following the existing pattern

## 🔒 Security Considerations

1. **Mnemonic Security**: Users must provide their own secure mnemonic phrases
2. **Passphrase**: Use strong passphrases for additional security
3. **Private Keys**: Never share or expose private keys
4. **Address Validation**: Always validate addresses before transactions
5. **Module Isolation**: Each module has a single responsibility

## 📚 Dependencies

- `@noble/ed25519` - ed25519 cryptographic operations
- `@noble/hashes` - Cryptographic hash functions
- `bip32` - BIP32 hierarchical deterministic wallets
- `bip39` - BIP39 mnemonic validation
- `crypto` - Node.js built-in crypto module

## 🎯 Key Benefits of Modular Design

1. **Maintainability**: Each module has a single responsibility
2. **Testability**: Individual modules can be tested in isolation
3. **Reusability**: Shared functions are centralized
4. **Extensibility**: Easy to add new key types or functionality
5. **Debugging**: Issues can be isolated to specific modules
6. **Code Review**: Smaller files are easier to review

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions related to ZERA Network wallet creation, please refer to the main project documentation.
