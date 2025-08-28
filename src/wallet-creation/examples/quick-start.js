#!/usr/bin/env node

/**
 * Quick Start Example - ZERA Wallet Creation
 *
 * Shows how to create Ed25519 and Ed448 wallets with HD derivation
 * for the first 3 usable wallets
 */

import { createWallet, generateWords, KEY_TYPE, HASH_TYPE } from '../index.js';

quickStart(); // User manually added this call

async function quickStart() {
  console.log('🚀 ZERA Wallet Creation - Quick Start\n');

  try {
    // Generate a new mnemonic (12 words = 128 bits entropy)
    const mnemonic = generateWords(12);
    console.log('📝 Generated mnemonic:', mnemonic);
    console.log('💡 Keep this safe - it\'s your master key!\n');

    // ===== ED25519 WALLETS =====
    console.log('🔑 Creating Ed25519 Wallets (3 addresses)...');
    console.log('   Using SHA3-256 hash for Ed25519\n');
    
    for (let i = 0; i < 3; i++) {
      const ed25519Wallet = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic,
        hdOptions: { addressIndex: i } // This creates wallet 0, 1, 2
      });

      console.log(`✅ Ed25519 Wallet ${i + 1}:`);
      console.log(`   Address: ${ed25519Wallet.address}`);
      console.log(`   Derivation Path: ${ed25519Wallet.derivationPath}`);
      console.log(`   Public Key (Base58): ${ed25519Wallet.publicKeyBase58.substring(0, 20)}...`);
      console.log(`   Extended Public Key: ${ed25519Wallet.extendedPublicKey.substring(0, 20)}...`);
      console.log(`   Depth: ${ed25519Wallet.depth}`);
      console.log(`   Index: ${ed25519Wallet.index}`);
      console.log('');
    }

    // ===== ED448 WALLETS =====
    console.log('🔐 Creating Ed448 Wallets (3 addresses)...');
    console.log('   Using BLAKE3 hash for Ed448\n');
    
    for (let i = 0; i < 3; i++) {
      const ed448Wallet = await createWallet({
        keyType: KEY_TYPE.ED448,
        hashTypes: [HASH_TYPE.BLAKE3],
        mnemonic,
        hdOptions: { addressIndex: i } // This creates wallet 0, 1, 2
      });

      console.log(`✅ Ed448 Wallet ${i + 1}:`);
      console.log(`   Address: ${ed448Wallet.address}`);
      console.log(`   Derivation Path: ${ed448Wallet.derivationPath}`);
      console.log(`   Public Key (Base58): ${ed448Wallet.publicKeyBase58.substring(0, 20)}...`);
      console.log(`   Extended Public Key: ${ed448Wallet.extendedPublicKey.substring(0, 20)}...`);
      console.log(`   Depth: ${ed448Wallet.depth}`);
      console.log(`   Index: ${ed448Wallet.index}`);
      console.log('');
    }

    // ===== SUMMARY =====
    console.log('🎉 Quick start completed!');
    console.log('📊 Summary:');
    console.log(`   • Created ${3} Ed25519 wallets with SHA3-256 hash`);
    console.log(`   • Created ${3} Ed448 wallets with BLAKE3 hash`);
    console.log(`   • All wallets derived from the same 12-word mnemonic`);
    console.log(`   • Each wallet has a unique address and derivation path`);
    console.log(`   • Full SLIP-0010 compliance with hardened derivation`);
    console.log(`   • Extended keys (xpub/xpriv) for each wallet`);
    console.log('\n💡 You now have 6 fully functional HD wallets!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run if this file is executed directly (kept for demos, but quickStart() is called above)
if (import.meta.url === `file://${process.argv[1]}`) {
  quickStart();
}

export default quickStart;
