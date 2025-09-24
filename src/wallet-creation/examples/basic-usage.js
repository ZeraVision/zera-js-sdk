import {
  createWallet,
  deriveMultipleWallets,
  generateWords,
  KEY_TYPE,
  HASH_TYPE
} from '../index.js';

/**
 * Basic Wallet Creation Examples
 * 
 * Simple, focused examples showing core wallet creation functionality.
 * Each example demonstrates a specific concept with minimal setup.
 */
async function demonstrateBasicUsage() {
  console.log('🎯 ZERA Wallet Creation - Basic Examples\n');

  try {
    // Example 1: Simple Ed25519 wallet
    console.log('1️⃣ Basic Ed25519 Wallet');
    const mnemonic = generateWords(12);
    const wallet = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic: mnemonic
    });
    console.log(`   Address: ${wallet.address.substring(0, 20)}...`);
    console.log(`   Key Type: ${wallet.keyType}`);
    console.log(`   Hash Types: ${wallet.hashTypes.join(', ')}`);
    console.log('');

    // Example 2: Different hash algorithm
    console.log('2️⃣ Ed25519 with Blake3 Hash');
    const wallet2 = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.BLAKE3],
      mnemonic: generateWords(12)
    });
    console.log(`   Address: ${wallet2.address.substring(0, 20)}...`);
    console.log(`   Hash Types: ${wallet2.hashTypes.join(', ')}`);
    console.log('');

    // Example 3: Hash chaining
    console.log('3️⃣ Multiple Hash Chaining (SHA3-512 → Blake3)');
    const wallet3 = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_512, HASH_TYPE.BLAKE3],
      mnemonic: generateWords(12)
    });
    console.log(`   Address: ${wallet3.address.substring(0, 20)}...`);
    console.log(`   Hash Chain: ${wallet3.hashTypes.join(' → ')}`);
    console.log('');

    // Example 4: Import existing mnemonic
    console.log('4️⃣ Import Existing Mnemonic');
    const importedWallet = await createWallet({
      mnemonic: mnemonic, // Same mnemonic as wallet 1
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256]
    });
    console.log(`   Same mnemonic, same address: ${wallet.address === importedWallet.address}`);
    console.log('');

    // Example 5: HD wallet derivation
    console.log('5️⃣ HD Wallet Derivation');
    const hdWallets = await deriveMultipleWallets({
      mnemonic: mnemonic,
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.BLAKE3],
      count: 3,
      hdOptions: { addressIndex: 0 }
    });
    console.log(`   Derived ${hdWallets.length} wallets from same mnemonic`);
    console.log(`   All unique addresses: ${new Set(hdWallets.map(w => w.address)).size === 3}`);
    console.log('');

    console.log('✅ All basic examples completed!');
    console.log('\n📚 Key Concepts:');
    console.log('   • Use KEY_TYPE and HASH_TYPE enums for type safety');
    console.log('   • Hash chaining applies right-to-left');
    console.log('   • HD derivation creates multiple addresses from one mnemonic');
    console.log('   • Same mnemonic + same settings = same address');

  } catch (error) {
    console.error('❌ Example failed:', error.message);
  }
}

// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateBasicUsage();
}

export { demonstrateBasicUsage };
