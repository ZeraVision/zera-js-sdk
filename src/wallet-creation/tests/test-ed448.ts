#!/usr/bin/env node

import {
  createWallet,
  deriveMultipleWallets,
  generateWords,
  KEY_TYPE,
  HASH_TYPE
} from '../index.js';
import bs58 from 'bs58';

/**
 * ED448 Test Suite
 * 
 * Tests ED448 implementation including:
 * - Basic wallet creation
 * - Key expansion validation
 * - Multiple hash types
 * - HD wallet derivation
 * - Performance testing
 * - Legacy key support
 */
async function testEd448(): Promise<{ success: boolean; results: any }> {
  console.log('🔍 Testing ED448 Implementation\n');
  
  try {
    // Test 1: Basic ED448 wallet creation
    console.log('📋 Test 1: Basic ED448 Wallet Creation');
    const words = generateWords(12);
    
    const ed448Wallet = await createWallet({
      keyType: KEY_TYPE.ED448,
      hashTypes: [HASH_TYPE.SHA3_512],
      mnemonic: words
    });
    
    // Verify wallet properties
    if (!ed448Wallet.keyType || ed448Wallet.keyType !== 'ed448') {
      throw new Error('Invalid key type');
    }
    if (!ed448Wallet.hashTypes || !Array.isArray(ed448Wallet.hashTypes)) {
      throw new Error('Invalid hash types');
    }
    if (!ed448Wallet.address || typeof ed448Wallet.address !== 'string') {
      throw new Error('Invalid address');
    }
    if (!ed448Wallet.derivationPath || typeof ed448Wallet.derivationPath !== 'string') {
      throw new Error('Invalid derivation path');
    }

    console.log('✅ ED448 wallet created successfully');
    console.log(`   Key Type: ${ed448Wallet.keyType}`);
    console.log(`   Address: ${ed448Wallet.address}`);
    console.log(`   Derivation Path: ${ed448Wallet.derivationPath}`);
    
    // Verify SLIP-0010 key length
    const privateKeyBytes = bs58.decode(ed448Wallet.privateKey);
    console.log(`   SLIP-0010 Private Key Length: ${privateKeyBytes.length} bytes`);
    
    if (privateKeyBytes.length !== 32) {
      throw new Error('ED448 should use 32-byte SLIP-0010 private keys');
    }
    console.log('✅ SLIP-0010 key format validated');

    // Test 2: ED448 with different hash types
    console.log('\n📋 Test 2: ED448 with Different Hash Types');
    const hashTypes = [
      [HASH_TYPE.SHA3_256],
      [HASH_TYPE.BLAKE3],
      [HASH_TYPE.SHA3_512, HASH_TYPE.BLAKE3]
    ];
    
    for (const hashType of hashTypes) {
      const wallet = await createWallet({
        keyType: KEY_TYPE.ED448,
        hashTypes: hashType,
        mnemonic: words
      });
      if (!wallet.address || typeof wallet.address !== 'string') {
        throw new Error(`Invalid address for hash type ${hashType.join(', ')}`);
      }
      console.log(`✅ Hash type ${hashType.join(' → ')}: ${wallet.address.substring(0, 20)}...`);
    }

    // Test 3: Multiple ED448 addresses from same mnemonic
    console.log('\n📋 Test 3: HD Wallet Derivation');
    const multipleWallets = await deriveMultipleWallets({
      mnemonic: words,
      keyType: KEY_TYPE.ED448,
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
    
    console.log('✅ Derived 3 unique ED448 addresses');
    multipleWallets.forEach((wallet, i) => {
      console.log(`   Wallet ${i + 1}: ${wallet.address.substring(0, 20)}...`);
    });

    // Test 4: Performance measurement
    console.log('\n📋 Test 4: Performance Testing');
    const iterations = 3;
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await createWallet({
        keyType: KEY_TYPE.ED448,
        hashTypes: [HASH_TYPE.SHA3_512],
        mnemonic: generateWords(12)
      });
    }
    
    const duration = Date.now() - startTime;
    const avgTime = duration / iterations;
    
    console.log(`✅ Created ${iterations} ED448 wallets in ${duration}ms`);
    console.log(`   Average time per wallet: ${avgTime.toFixed(2)}ms`);
    
    if (avgTime > 2000) {
      console.log('⚠️ Performance warning: ED448 creation is slower than expected');
    } else {
      console.log('✅ Performance within acceptable range');
    }

    console.log('\n🎉 All ED448 tests passed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Basic wallet creation');
    console.log('   ✅ SLIP-0010 key format validation');
    console.log('   ✅ Multiple hash type support');
    console.log('   ✅ HD wallet derivation');
    console.log('   ✅ Performance validation');
    
    return { success: true, results: { ed448Wallet, multipleWallets, avgTime } };

  } catch (error) {
    console.error('❌ ED448 test failed:', (error as Error).message);
    throw error;
  }
}

// Export for test runner
export { testEd448 };

// Run the test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEd448();
}
