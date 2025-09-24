#!/usr/bin/env node

import {
  createWallet,
  deriveMultipleWallets,
  generateWords,
  KEY_TYPE,
  HASH_TYPE
} from '../index.js';

/**
 * Test of ED25519 implementation
 */
async function testEd25519() {
  try {
    // Test 1: Basic ED25519 wallet creation
    const words = generateWords(12);
    
    const ed25519Wallet = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic: words
    });
    
    // Verify wallet properties
    if (!ed25519Wallet.keyType || ed25519Wallet.keyType !== 'ed25519') {
      throw new Error('Invalid key type');
    }
    if (!ed25519Wallet.hashTypes || !Array.isArray(ed25519Wallet.hashTypes)) {
      throw new Error('Invalid hash types');
    }
    if (!ed25519Wallet.address || typeof ed25519Wallet.address !== 'string') {
      throw new Error('Invalid address');
    }
    if (!ed25519Wallet.derivationPath || typeof ed25519Wallet.derivationPath !== 'string') {
      throw new Error('Invalid derivation path');
    }

    // Test 2: ED25519 with different hash types
    const hashTypes = [
      [HASH_TYPE.SHA3_256],
      [HASH_TYPE.BLAKE3],
      [HASH_TYPE.SHA3_512, HASH_TYPE.BLAKE3]
    ];
    
    for (const hashType of hashTypes) {
      const wallet = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: hashType,
        mnemonic: words
      });
      if (!wallet.address || typeof wallet.address !== 'string') {
        throw new Error(`Invalid address for hash type ${hashType.join(', ')}`);
      }
    }

    // Test 3: Multiple ED25519 addresses from same mnemonic
    const multipleWallets = await deriveMultipleWallets({
      mnemonic: words,
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      count: 3,
      hdOptions: {
        accountIndex: 0,
        changeIndex: 0,
        addressIndex: 0
      }
    });
    
    if (!Array.isArray(multipleWallets) || multipleWallets.length !== 3) {
      throw new Error('Invalid multiple wallets result');
    }
    
    // Verify all addresses are unique
    const uniqueAddresses = new Set(multipleWallets.map(w => w.address));
    if (uniqueAddresses.size !== 3) {
      throw new Error('All addresses should be unique');
    }
    
    for (let i = 0; i < multipleWallets.length; i++) {
      const wallet = multipleWallets[i];
      if (!wallet.address || typeof wallet.address !== 'string') {
        throw new Error(`Invalid address for wallet ${i + 1}`);
      }
      if (!wallet.derivationPath || typeof wallet.derivationPath !== 'string') {
        throw new Error(`Invalid derivation path for wallet ${i + 1}`);
      }
    }

    // Test 4: Performance measurement (simplified)
    const iterations = 2;
    const ed25519Start = Date.now();
    for (let i = 0; i < iterations; i++) {
      await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic: generateWords(12)
      });
    }
    const ed25519Time = Date.now() - ed25519Start;
    
    // Verify performance is reasonable (should be under 5 seconds for 2 iterations)
    if (ed25519Time > 5000) {
      throw new Error(`Performance too slow: ${ed25519Time}ms for ${iterations} iterations`);
    }

  } catch (error) {
    throw new Error(`ED25519 test failed: ${error.message}`);
  }
}

// Export for test runner
export { testEd25519 };

// Run the test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEd25519();
}
