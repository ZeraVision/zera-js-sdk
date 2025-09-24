# ZERA Wallet Creation System

A unified wallet creation system for the ZERA Network supporting Ed25519/Ed448 curves, multiple hash algorithms, and HD wallet functionality following SLIP-0010 standards.

## Quick Start

```javascript
import { createWallet, KEY_TYPE, HASH_TYPE } from './wallet-creation/index.js';

// Create a simple Ed25519 wallet
const wallet = await createWallet({
  keyType: KEY_TYPE.ED25519,
  hashTypes: [HASH_TYPE.SHA3_256],
  mnemonicLength: 24
});

console.log('Address:', wallet.address);
```

**Security Note**: This SDK exposes private keys in wallet objects. Use secure storage in production.

## Standards & Security

- **BIP39**: Mnemonic generation (12, 15, 18, 21, 24 words)
- **SLIP-0010**: HD wallet structure for Ed25519/Ed448 curves
- **SLIP44**: Coin type 1110 for ZERA network

**Derivation Path**: `m/44'/1110'/account'/change'/address'` (all hardened for EdDSA security)

**Important**: This implementation uses SLIP-0010 (not BIP44) due to EdDSA security requirements. Addresses are not compatible with standard BIP44 wallets.

## Features

- **Multiple Key Types**: Ed25519 and Ed448 cryptographic curves
- **Hash Algorithms**: SHA3-256, SHA3-512, and Blake3
- **HD Wallets**: SLIP-0010 hierarchical deterministic wallets
- **All BIP39 Lengths**: 12, 15, 18, 21, and 24-word mnemonic phrases
- **Type Safety**: Enum-based constants for validation

## Architecture

### Key Type Enums
```javascript
import { KEY_TYPE } from './wallet-creation/index.js';

// Use these constants instead of strings
KEY_TYPE.ED25519  // 'ed25519'
KEY_TYPE.ED448    // 'ed448'
```

### Hash Type Enums
```javascript
import { HASH_TYPE } from './wallet-creation/index.js';

// Use these constants instead of strings
HASH_TYPE.SHA3_256  // 'sha3-256'
HASH_TYPE.SHA3_512  // 'sha3-512'
HASH_TYPE.BLAKE3    // 'blake3'
```

### Key Type Prefixes
- `A_` - Ed25519 keys
- `B_` - Ed448 keys

### Hash Type Prefixes
- `a_` - SHA3-256
- `b_` - SHA3-512  
- `c_` - Blake3

### Address Format
The final hash (after applying all hash functions) is encoded to base58, which becomes the wallet address.

### Public Key Formats

The wallet object includes two different public key formats:

#### 1. Public Key Display Format (Human-Readable)
`Key_Hash(es)_pubkeybase58`

Examples:
- `A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb` (Ed25519 + Blake3)
- `B_b_a_5KJvsngHeMby884zrh6A5u6b4SqzZzAb` (Ed448 + SHA3-512 + SHA3-256)

#### 2. Public Key Package (Comprehensive Binary Format)
Base58-encoded binary package including version byte, prefixes, public key, and checksum for validation and network identification. Perfect for network transmission and storage with built-in integrity validation.

**Package Structure:**
```
[Version(1)][KeyPrefix(2)][HashPrefix(2+)][PublicKey(32/57)][Checksum(4)]
```

**Components:**
- **Version Byte**: Network identifier (0x1a for Ed25519, 0x1b for Ed448)
- **Key Prefix**: Key type identifier ("A_" for Ed25519, "B_" for Ed448)
- **Hash Prefix**: Hash type identifier(es) ("a_" for SHA3-256, "b_" for SHA3-512, "c_" for Blake3)
- **Public Key**: Raw public key bytes (32 bytes for Ed25519, 57 bytes for Ed448)
- **Checksum**: 4-byte double SHA256 checksum for integrity validation

**Parser Function:**
```javascript
import { parseZeraPublicKeyPackage } from './src/wallet-creation/index.js';

const parsed = parseZeraPublicKeyPackage(wallet.publicKeyPackage);
console.log('Key Type:', parsed.keyType);        // 'ed25519' or 'ed448'
console.log('Hash Types:', parsed.hashTypes);   // ['blake3', 'sha3-256', ...]
console.log('Public Key:', parsed.publicKey);   // Uint8Array of raw bytes
console.log('Is Valid:', parsed.isValid);       // boolean checksum validation
```

#### Wallet Object Fields
- `privateKey`: Raw 32-byte private key encoded as base58 (e.g., "5KJvsngHeMby884zrh6A5u6b4SqzZzAb")
- `publicKey`: Human-readable identifier with type prefixes (e.g., `A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb`)
- `publicKeyPackage`: Comprehensive binary format with version byte and checksum for validation

## Project Organization

The project follows industry-standard organization:

```
src/wallet-creation/
├── tests/           # Test files (automated testing)
├── examples/        # Simple, focused examples
├── demos/           # Demonstrations
├── *.js             # Source code and utilities
└── README.md        # This file
```

### Running Examples and Demos

```bash
# Run examples (simple, focused)
node examples/basic-usage.js

# Run demos (showcase)
node demos/complete-showcase.js
node demos/unified-curves.js
node demos/enums-showcase.js

# Run tests
npm test -- --module=wallet-creation
```

## Quick Start

### Basic Wallet Creation

```javascript
import { createWallet, KEY_TYPE } from './wallet-creation/index.js';

// Create a simple Ed25519 wallet using enum constants
const wallet = await createWallet({
  keyType: KEY_TYPE.ED25519,
  mnemonicLength: 24
});

console.log('Address:', wallet.address);
console.log('Public Key Format:', wallet.publicKeyFormat);
```

### Wallet with Hash Types

```javascript
import { createWallet, KEY_TYPE, HASH_TYPE } from './wallet-creation/index.js';

// Create Ed25519 wallet with Blake3 hash
const wallet = await createWallet({
  keyType: KEY_TYPE.ED25519,
  hashTypes: [HASH_TYPE.BLAKE3],
  mnemonicLength: 12
});

// Create wallet with hash chain (SHA3-512 -> Blake3)
const wallet2 = await createWallet({
  keyType: KEY_TYPE.ED25519,
  hashTypes: [HASH_TYPE.SHA3_512, HASH_TYPE.BLAKE3], // Applied right to left
  mnemonicLength: 18
});
```

### Import Existing Wallet (Using createWallet)

```javascript
import { createWallet, KEY_TYPE, HASH_TYPE } from './wallet-creation/index.js';

const wallet = await createWallet({
  mnemonic: 'your twelve word mnemonic phrase here',
  keyType: KEY_TYPE.ED25519,
  hashTypes: [HASH_TYPE.SHA3_256, HASH_TYPE.BLAKE3]
});
```

**Note**: The `createWallet` function can be used to import existing wallets by providing an existing mnemonic phrase. This function handles both new wallet creation and existing wallet import based on whether the mnemonic is newly generated or provided by the user.

### HD Wallet with Custom Derivation

```javascript
const wallet = await createWallet({
  keyType: KEY_TYPE.ED25519,
  hashTypes: [HASH_TYPE.BLAKE3],
  mnemonic: 'your mnemonic phrase',
  hdOptions: {
    accountIndex: 1,
    changeIndex: 0,
    addressIndex: 5
  }
});
```

### Derive Multiple Addresses

```javascript
import { deriveMultipleWallets, KEY_TYPE, HASH_TYPE } from './wallet-creation/index.js';

const wallets = await deriveMultipleWallets({
  mnemonic: 'your mnemonic phrase',
  keyType: KEY_TYPE.ED25519,
  hashTypes: [HASH_TYPE.BLAKE3],
  count: 5,
  hdOptions: {
    accountIndex: 0,
    changeIndex: 0,
    addressIndex: 0
  }
});
```

## API Reference

### Constants and Enums

#### Key Types
```javascript
import { KEY_TYPE, VALID_KEY_TYPES } from './wallet-creation/index.js';

KEY_TYPE.ED25519  // 'ed25519'
KEY_TYPE.ED448    // 'ed448'

VALID_KEY_TYPES   // ['ed25519', 'ed448']
```

#### Hash Types
```javascript
import { HASH_TYPE, VALID_HASH_TYPES } from './wallet-creation/index.js';

HASH_TYPE.SHA3_256  // 'sha3-256'
HASH_TYPE.SHA3_512  // 'sha3-512'
HASH_TYPE.BLAKE3    // 'blake3'

VALID_HASH_TYPES     // ['sha3-256', 'sha3-512', 'blake3']
```

#### Mnemonic Lengths
```javascript
import { MNEMONIC_LENGTHS } from './wallet-creation/index.js';

MNEMONIC_LENGTHS  // [12, 15, 18, 21, 24]
```

### WalletFactory Class

The main factory class for creating and managing wallets.

#### Methods

- `createWallet(options)` - Create a new wallet
- `deriveMultipleWallets(options)` - Derive multiple addresses
- `getInfo()` - Get factory information

#### Options Object

```javascript
{
  keyType: KEY_TYPE.ED25519 | KEY_TYPE.ED448,           // Required - use enum constants
  hashTypes: [HASH_TYPE.SHA3_256, HASH_TYPE.BLAKE3],   // Optional, array of hash types
  mnemonic: 'word1 word2...',                           // Optional, generates new if not provided
  mnemonicLength: 12 | 15 | 18 | 21 | 24,              // Optional, default: 24
  passphrase: 'optional passphrase',                     // Optional
  hdOptions: {                                           // Optional
    accountIndex: 0,                                     // Default: 0
    changeIndex: 0 | 1,                                  // Default: 0
    addressIndex: 0                                      // Default: 0
  }
}
```

### Utility Functions

#### HD Utilities
- `generateMnemonicPhrase(length)` - Generate new mnemonic
- `buildDerivationPath(options)` - Build SLIP-0010 derivation path
- `getHDWalletInfo()` - Get HD wallet information

#### Hash Utilities
- `getAllHashInfo()` - Get information about all hash functions
- `getSupportedHashTypes()` - Get list of supported hash types

#### Validation Functions
- `isValidKeyType(keyType)` - Validate key type
- `isValidHashType(hashType)` - Validate hash type
- `isValidMnemonicLength(length)` - Validate mnemonic length

## Error Handling

The system provides error handling with specific error types:

- `InvalidKeyTypeError` - Invalid key type specified
- `InvalidHashTypeError` - Invalid hash type specified
- `InvalidMnemonicLengthError` - Invalid mnemonic length
- `InvalidMnemonicError` - Invalid mnemonic phrase
- `InvalidDerivationPathError` - Invalid derivation path
- `MissingParameterError` - Required parameter missing

Each error includes:
- Descriptive message
- Error code
- Context details
- Timestamp

## Examples

See `example.js` for usage examples including:
- Basic wallet creation using enum constants
- Hash type combinations
- HD wallet derivation
- Error handling demonstrations

## Standards Compliance

### SLIP-0010 Implementation

The system implements SLIP-0010 standard with ZERA coin type (1110):

- **Purpose**: 44' (SLIP-0010 hardened structure)
- **Coin Type**: 1110' (ZERA)
- **Account**: 0' (configurable)
- **Change**: 0' or 1' (external/internal, both hardened)
- **Address Index**: 0' (configurable, always hardened)

Default path: `m/44'/1110'/0'/0'/0'` (all hardened for Ed25519/Ed448)

### BIP39 Compliance

- Full support for all standard mnemonic lengths (12, 15, 18, 21, 24 words)
- Passphrase support for additional entropy
- Industry-standard wordlist and validation

### BIP44 vs SLIP-0010 Clarification

While the path structure follows BIP44 format (`m/44'/coin'/account'/change'/address'`), the implementation strictly follows SLIP-0010 requirements:

- **BIP44**: Allows mixed hardened/normal derivation
- **SLIP-0010**: Requires full hardening for Ed25519/Ed448 curves
- **ZERA Implementation**: SLIP-0010 compliant with BIP44-style path structure

## Security Features

- **BIP39 Mnemonics**: Industry-standard mnemonic generation
- **Passphrase Support**: Additional security layer
- **HD Wallets**: Deterministic key derivation
- **Multiple Hash Support**: Configurable cryptographic strength
- **Input Validation**: Parameter validation
- **Type Safety**: Enum-based constants prevent invalid inputs

## Dependencies

- `@noble/curves` - Ed25519 and Ed448 cryptographic operations
- `@noble/hashes` - Hash functions (SHA3, Blake3)
- SLIP-0010 - HD wallet functionality for Ed25519/Ed448
- `bip39` - Mnemonic generation and validation
- `bs58` - Base58 encoding

## Testing

Run the example file to test the system:

```bash
node src/wallet-creation/example.js
```

Run the simple test:

```bash
node src/wallet-creation/test-simple.js
```



## Type Safety Benefits

Using the enum constants provides several benefits:

1. **Prevents Typos**: Can't accidentally use `'ed25519'` instead of `'ed25519'`
2. **IDE Support**: Autocomplete and IntelliSense support
3. **Runtime Validation**: Built-in validation ensures only valid types are accepted
4. **Maintainability**: Centralized constants make updates easier
5. **Documentation**: Constants serve as living documentation

## Glossary

### Cryptographic Terms

- **Ed25519**: Elliptic curve digital signature algorithm using Curve25519
- **Ed448**: Elliptic curve digital signature algorithm using Curve448
- **Hardened Derivation**: Key derivation where parent public key cannot derive child keys (indicated by ')
- **Hierarchical Deterministic (HD) Wallet**: Wallet that can derive multiple keys from a single seed
- **Mnemonic Phrase**: Sequence of words used to generate a cryptographic seed
- **Seed**: Byte array derived from mnemonic, used as root for HD key derivation
- **SLIP-0010**: Standard for HD wallets using Ed25519/Ed448 curves
- **BIP44**: Bitcoin Improvement Proposal defining multi-account HD wallet structure
- **BIP39**: Bitcoin Improvement Proposal defining mnemonic generation

### Path Components

- **Purpose**: First component indicating wallet structure (44' for BIP44-style)
- **Coin Type**: Network identifier (1110' for ZERA)
- **Account**: Multi-account wallet index
- **Change**: Address type (0' for external, 1' for internal)
- **Address Index**: Sequential address within account

## References

### Standards Documentation

- [BIP39 - Mnemonic Generation](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP44 - Multi-Account HD Wallet Structure](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [SLIP-0010 - HD Wallet for Ed25519/Ed448](https://github.com/satoshilabs/slips/blob/master/slip-0010.md)
- [SLIP44 - Registered Coin Types](https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
