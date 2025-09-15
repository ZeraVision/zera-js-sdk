#!/usr/bin/env node

import {
  createWallet,
  generateWords,
  KEY_TYPE,
  HASH_TYPE
} from '../index.js';
import bs58 from 'bs58';

/**
 * Simple ED448 test to verify it's working
 */
testEd448Simple();
async function testEd448Simple() {
  console.log('🔍 Testing ED448 implementation...\n');
  
  try {
    // Create ED448 wallet
    const words = generateWords(12);
    console.log('Creating ED448 wallet...');
    
    const ed448Wallet = await createWallet({
      keyType: KEY_TYPE.ED448,
      hashTypes: [HASH_TYPE.SHA3_512],
      mnemonic: words
    });
    
    console.log('✅ ED448 wallet created successfully!');
    console.log(`   Key Type: ${ed448Wallet.keyType}`);
    console.log(`   Address: ${ed448Wallet.address}`);
    console.log(`   Private Key Length: ${ed448Wallet.privateKey.length} characters (base58)`);
    console.log(`   Public Key Identifier: ${ed448Wallet.publicKey}`);
    
    // Decode private key to check actual byte length
    const privateKeyBytes = bs58.decode(ed448Wallet.privateKey);
    console.log(`   Private Key Actual Length: ${privateKeyBytes.length} bytes`);
    
    // Test Ed25519 for comparison
    console.log('\nCreating ED25519 wallet for comparison...');
    const ed25519Wallet = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic: words
    });
    
    const ed25519PrivateKeyBytes = bs58.decode(ed25519Wallet.privateKey);
    console.log(`   ED25519 Private Key Length: ${ed25519PrivateKeyBytes.length} bytes`);
    
    // Verify both use 32-byte SLIP-0010 private keys
    if (privateKeyBytes.length === 32 && ed25519PrivateKeyBytes.length === 32) {
      console.log('\n✅ Both ED448 and ED25519 use 32-byte SLIP-0010 private keys (correct!)');
    } else {
      console.log('\n❌ Private key length mismatch!');
    }
    
    console.log('\n🎉 ED448 test completed successfully!');
    
  } catch (error) {
    console.error('❌ ED448 test failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Run the test
testEd448Simple().catch(console.error);
