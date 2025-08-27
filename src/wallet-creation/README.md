# ZERA Wallet Creation System

A comprehensive, unified wallet creation system for the ZERA Network that supports multiple key types, hash algorithms, and HD wallet functionality following BIP44 standards.

## Features

- **Multiple Key Types**: Support for Ed25519 and Ed448 cryptographic curves
- **Flexible Hash Types**: Support for SHA3-256, SHA3-512, and Blake3 hash algorithms
- **Hash Chaining**: Apply multiple hash functions in configurable order (right-to-left)
- **HD Wallet Support**: Full BIP44 hierarchical deterministic wallet support
- **All BIP39 Lengths**: Support for 12, 15, 18, 21, and 24-word mnemonic phrases
- **Flexible Derivation**: Customizable account, change, and address indices
- **Comprehensive Error Handling**: Detailed error messages with error codes and context
- **Backward Compatibility**: Maintains compatibility with existing wallet creation methods
- **Type Safety**: Enum-based constants ensure valid key types and hash types

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

### Public Key Display Format
`Key_Hash(es)_pubkeybase58`

Examples:
- `A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb` (Ed25519 + Blake3)
- `B_b_a_5KJvsngHeMby884zrh6A5u6b4SqzZzAb` (Ed448 + SHA3-512 + SHA3-256)

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

### Import Existing Wallet

```javascript
import { importWallet, KEY_TYPE, HASH_TYPE } from './wallet-creation/index.js';

const wallet = await importWallet({
  mnemonic: 'your twelve word mnemonic phrase here',
  keyType: KEY_TYPE.ED25519,
  hashTypes: [HASH_TYPE.SHA3_256, HASH_TYPE.BLAKE3]
});
```

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
- `importWallet(options)` - Import existing wallet
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
- `buildDerivationPath(options)` - Build BIP44 derivation path
- `getHDWalletInfo()` - Get HD wallet information

#### Hash Utilities
- `getAllHashInfo()` - Get information about all hash functions
- `getSupportedHashTypes()` - Get list of supported hash types

#### Validation Functions
- `isValidKeyType(keyType)` - Validate key type
- `isValidHashType(hashType)` - Validate hash type
- `isValidMnemonicLength(length)` - Validate mnemonic length

## Error Handling

The system provides comprehensive error handling with specific error types:

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

See `example.js` for comprehensive usage examples including:
- Basic wallet creation using enum constants
- Hash type combinations
- HD wallet derivation
- Error handling demonstrations

## BIP44 Implementation

The system implements BIP44 standard with ZERA coin type (1110):

- **Purpose**: 44' (BIP44)
- **Coin Type**: 1110' (ZERA)
- **Account**: 0' (configurable)
- **Change**: 0 or 1 (external/internal)
- **Address Index**: 0+ (configurable)

Default path: `m/44'/1110'/0'/0/0`

## Security Features

- **BIP39 Mnemonics**: Industry-standard mnemonic generation
- **Passphrase Support**: Additional security layer
- **HD Wallets**: Deterministic key derivation
- **Multiple Hash Support**: Configurable cryptographic strength
- **Input Validation**: Comprehensive parameter validation
- **Type Safety**: Enum-based constants prevent invalid inputs

## Dependencies

- `@noble/ed25519` - Ed25519 cryptographic operations
- `@noble/hashes` - Hash functions (SHA3, Blake3)
- `bip32` - HD wallet functionality
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

## Migration from Legacy System

The new system maintains full backward compatibility. Existing code will continue to work while new features are available through the unified factory:

```javascript
// Legacy way (still works)
import { createEd25519Wallet } from './wallet-creation/index.js';
const wallet = await createEd25519Wallet(mnemonic);

// New unified way with enum constants
import { createWallet, KEY_TYPE } from './wallet-creation/index.js';
const wallet = await createWallet({
  keyType: KEY_TYPE.ED25519,
  mnemonic: mnemonic
});
```

## Type Safety Benefits

Using the enum constants provides several benefits:

1. **Prevents Typos**: Can't accidentally use `'ed25519'` instead of `'ed25519'`
2. **IDE Support**: Autocomplete and IntelliSense support
3. **Runtime Validation**: Built-in validation ensures only valid types are accepted
4. **Maintainability**: Centralized constants make updates easier
5. **Documentation**: Constants serve as living documentation

## Contributing

When adding new features:
1. Maintain backward compatibility
2. Add comprehensive error handling
3. Include tests and examples
4. Update documentation
5. Follow the established error handling patterns
6. Use enum constants for all new types
7. Add validation functions for new types
