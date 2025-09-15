# Scripts Directory

This directory contains utility scripts for the ZERA JS SDK.

## generate-test-keys.js

Generates real ED25519 and ED448 key pairs using the wallet creation module and updates the `src/test-utils/test-keys.js` file with the generated data.

### Usage

```bash
node scripts/generate-test-keys.js
```

### What it does

1. **Generates Real Keys**: Creates actual ED25519 and ED448 wallets using proper BIP39 mnemonics
2. **Uses Different Hash Types**: Each person uses different hash algorithms:
   - **Alice**: BLAKE3 (prefixes: `A_c_`, `B_c_`)
   - **Bob**: SHA3_256 + SHA3_512 (prefixes: `A_a_b_`, `B_a_b_`)
   - **Charlie**: SHA3_512 + SHA3_256 (prefixes: `A_b_a_`, `B_b_a_`)
   - **Jesse**: SHA3_256 (output-only recipient with provided address)
3. **Extracts Key Data**: Gets private keys, public key identifiers, and derived addresses
4. **Updates Test File**: Automatically updates `src/test-utils/test-keys.js` with the new keys
5. **Provides Summary**: Shows all generated addresses for verification

### Generated Data Structure

The script generates keys for three test personas (alice, bob, charlie) for both key types:

```javascript
// ED25519 Keys with different hash types
ED25519_TEST_KEYS = {
  alice: {
    privateKey: 'AJ8bNx8iYeVjBLAy5s2M6FfvWzFt26S3b2MsdxpfqnPT',
    publicKey: 'A_c_2Sbe89QBcCxmeu5LMEUUQBfnX3r2W1W3RVbcZAphcXC2', // BLAKE3
    address: '8mDFNM7Hxi2vaztoBzmFwkx6myUJDBjVsdTAb83M76vH'
  },
  bob: {
    privateKey: '5m2bpycKkUmwGjJ54L2cMMk6wfvchCPKg7j9L61wS7DV',
    publicKey: 'A_a_b_4TzsZXiHhEeEMjE5BcKvDEQ6eLUtRuK3CCLNLSLZymyf', // SHA3_256 + SHA3_512
    address: 'CcmdvCu9fz7usYjaWrcA6iwffPUeu5KtM6hcnQNTS9px'
  },
  charlie: {
    privateKey: 'AhUCfZ5u4paLgPPi8oiJxnbxN6SucgUuAH6aXPPpaCPx',
    publicKey: 'A_b_a_vMgtWDr9ZzTWviBPhyNTpnWRED1yrG7TtQ5h7y1DqhR', // SHA3_512 + SHA3_256
    address: '2V9uqjSNrvdQtRoGZQRjEYoyYURzEhBKPH2kBLK3SkWmxxNhDWRzBbB3nyTZTDSeT9PNrjr4dJydJXT8yNocx7Tx'
  }
};

// ED448 Keys with different hash types
ED448_TEST_KEYS = {
  alice: {
    privateKey: '7fedxjzsZp7tqHk2PzcYuUd8Z8qxGLMS46kbR3DvqTCy',
    publicKey: 'B_c_U8LfyPpagcrDVm7gVMhfwvJdfLoYzZqY1RyaNHCziqjD96LZPyrks58BspgNmkiv7biAfNmbfbhuvF', // BLAKE3
    address: '38J2aZoi2gpbSZH3GUPyreNxntAUXeQG2XPMbVifmsPk'
  },
  bob: {
    privateKey: 'Ft3hcbig9Ua2Aouwskhj8z53HHriNqS4qmDBDQ6J75pF',
    publicKey: 'B_a_b_AygkMwL1iY9xv4ayamgnkdDWHHdFwCi6QNkmyKpshN5Y6MTVvPnyYmPKXm3zMRYM1ngimkN8hkJFeF', // SHA3_256 + SHA3_512
    address: '5oyfvRALS1g8qRVFeSj7aPViK1SdjwzXrdZTZK1x4X6a'
  },
  charlie: {
    privateKey: '5ieMPMr1DNvW59vrLjCK3QLL4MCExCNYGdR2yF3RCP7g',
    publicKey: 'B_b_a_QYKoKDrtBN2F2euL4pak23w4jcSjaE8eRg3eLkz6W1ud2dvffazD3e3RnEnz5XJhsWaYm2PqkDzfcs', // SHA3_512 + SHA3_256
    address: '2z3p4RE1N6eUjy1viUnCgbz2dj1mgoZDb3EZFyFj32oZKgJmSBHfxATBc8fHnMvi9X9SwfuqKQjg2kHP9QuyUSNd'
  }
};
```

### Test Wallet Addresses

All test addresses are derived from real wallets:

```javascript
export const TEST_WALLET_ADDRESSES = {
  alice: '7AC43j5mVxGZDZraaDN3Guz68rRoh2S7P6VXcS8GGJ8b',
  bob: 'G5F1NDFmpLsym7TvAt67Ju1jzRL2mPLxev25JFi7ZSWt',
  charlie: 'AMdCPzvcLFyPBBebsfBfXdzsaGCKrENq76fa4xLNFoJqR8Bfvgedi3D8GTNTw77Unw1meKR297z2263ooLX5kYi',
  jesse: 'WYEKj2jB1exPn7BStQ7WBkr8WpST9x3iT7gvoPjyZcYAP'
};
```

### Key Features

- **Real Cryptographic Keys**: Uses actual wallet creation with proper entropy
- **Multiple Hash Types**: Each person uses different hash algorithm combinations for comprehensive testing
- **Proper Address Derivation**: Addresses are derived from public keys using the address-utils module
- **Universal Test Support**: Generated keys work with all test utilities (`getTestInput`, `getTestOutput`, etc.)

### When to Regenerate

Regenerate test keys when:
- Starting a new test environment
- Need fresh keys for security testing
- Keys become compromised (unlikely for test keys)
- Want to test with different key combinations

### Security Note

These are **test keys only** and should never be used in production. They are designed for consistent testing across the SDK modules.
