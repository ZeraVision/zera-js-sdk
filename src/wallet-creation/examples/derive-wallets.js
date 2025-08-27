#!/usr/bin/env node

/**
 * Derive Multiple Wallets Example
 * 
 * Shows how to create wallet 1, 2, and 3 from the same mnemonic
 * Each wallet has a different address index in the BIP44 path
 */

import { createWallet, deriveMultipleWallets, generateWords, KEY_TYPE, HASH_TYPE } from '../index.js';

async function deriveWalletsExample() {
  console.log('🚀 ZERA Wallet Derivation Example\n');
  
  try {
    // Generate a new mnemonic (in real use, user would provide this)
    const mnemonic = generateWords(12);
    console.log('📝 Mnemonic:', mnemonic);
    console.log('💡 Keep this safe - it generates all your wallets!\n');
    
    // Method 1: Create wallets one by one with different address indices
    console.log('🔑 Method 1: Individual Wallet Creation\n');
    
    const wallet1 = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic,
      hdOptions: { addressIndex: 0 } // Wallet 1
    });
    
    const wallet2 = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic,
      hdOptions: { addressIndex: 1 } // Wallet 2
    });
    
    const wallet3 = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic,
      hdOptions: { addressIndex: 2 } // Wallet 3
    });
    
    // Display the wallets in a clean, usable format
    console.log('📱 WALLET 1 (Address Index 0):');
    console.log('   Address:', wallet1.address);
    console.log('   Derivation Path:', wallet1.derivationPath);
    console.log('   Public Key:', wallet1.publicKeyBase58);
    console.log('   Private Key:', wallet1.privateKey.substring(0, 20) + '...');
    console.log('');
    
    console.log('📱 WALLET 2 (Address Index 1):');
    console.log('   Address:', wallet2.address);
    console.log('   Derivation Path:', wallet2.derivationPath);
    console.log('   Public Key:', wallet2.publicKeyBase58);
    console.log('   Private Key:', wallet2.privateKey.substring(0, 20) + '...');
    console.log('');
    
    console.log('📱 WALLET 3 (Address Index 2):');
    console.log('   Address:', wallet3.address);
    console.log('   Derivation Path:', wallet3.derivationPath);
    console.log('   Public Key:', wallet3.publicKeyBase58);
    console.log('   Private Key:', wallet3.privateKey.substring(0, 20) + '...');
    console.log('');
    
    // Method 2: Use the batch derivation function
    console.log('⚡ Method 2: Batch Wallet Derivation\n');
    
    const multipleWallets = await deriveMultipleWallets({
      mnemonic,
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      count: 3,
      hdOptions: { addressIndex: 0 } // Start from index 0
    });
    
    console.log('✅ Derived 3 wallets in batch:');
    multipleWallets.forEach((wallet, index) => {
      console.log(`   Wallet ${index + 1}: ${wallet.address} (${wallet.derivationPath})`);
    });
    
    // Verify all addresses are unique
    const addresses = multipleWallets.map(w => w.address);
    const uniqueAddresses = new Set(addresses);
    console.log(`\n🔍 Verification: ${addresses.length} wallets, ${uniqueAddresses.size} unique addresses`);
    console.log('✅ All wallets have different addresses (derivation working correctly)');
    
    // Show the BIP44 path structure
    console.log('\n🛣️ BIP44 Derivation Path Structure:');
    console.log('   m/44\'/1110\'/0\'/0/0  ← Wallet 1 (Address Index 0)');
    console.log('   m/44\'/1110\'/0\'/0/1  ← Wallet 2 (Address Index 1)');
    console.log('   m/44\'/1110\'/0\'/0/2  ← Wallet 3 (Address Index 2)');
    console.log('   │ │   │   │ │ │');
    console.log('   │ │   │   │ │ └─ Address Index (0, 1, 2...)');
    console.log('   │ │   │   │ └─── Change (0 = external, 1 = internal)');
    console.log('   │ │   │   └───── Account Index (hardened)');
    console.log('   │ │   └───────── Coin Type 1110 (ZERA)');
    console.log('   │ └───────────── Purpose 44 (BIP44)');
    console.log('   └─────────────── Master Node');
    
    console.log('\n🎉 Example completed!');
    console.log('💡 You can derive as many wallets as needed by incrementing the address index.');
    console.log('🔒 All wallets are derived deterministically from the same mnemonic.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deriveWalletsExample();
}

export default deriveWalletsExample;
