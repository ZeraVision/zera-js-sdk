#!/usr/bin/env node

/**
 * Quick Start Example - ZERA Wallet Creation
 * 
 * The simplest way to create a single wallet
 */

import { createWallet, generateWords, KEY_TYPE, HASH_TYPE } from '../index.js';

quickStart();

async function quickStart() {
  console.log('🚀 ZERA Wallet Creation - Quick Start\n');
  
  try {
    // Generate a new mnemonic
    const mnemonic = generateWords(12);
    console.log('📝 Generated mnemonic:', mnemonic);
    console.log('💡 Keep this safe - it\'s your master key!\n');
    
    // Create an Ed25519 wallet with SHA3-256
    console.log('🔑 Creating Ed25519 wallet...');
    const wallet = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic
    });
    
    console.log('✅ Wallet created successfully!\n');
    console.log('📱 WALLET DETAILS:');
    console.log('   Address:', wallet.address);
    console.log('   Public Key:', wallet.publicKeyBase58);
    console.log('   Derivation Path:', wallet.derivationPath);
    console.log('   Key Type:', wallet.keyType);
    console.log('   Hash Types:', wallet.hashTypes.join(', '));
    console.log('   Extended Private Key:', wallet.extendedPrivateKey.substring(0, 20) + '...');
    console.log('   Extended Public Key:', wallet.extendedPublicKey.substring(0, 20) + '...');
    
    console.log('\n🎉 Quick start completed!');
    console.log('💡 You now have a fully functional HD wallet with BIP44 compliance.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  quickStart();
}

export default quickStart;
