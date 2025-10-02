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

// Call the function when this file is run
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

    // Example 5: HD wallet derivation (ED25519)
    console.log('5️⃣ HD Wallet Derivation (ED25519)');
    const hdWallets = await deriveMultipleWallets({
      mnemonic: mnemonic,
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.BLAKE3],
      count: 3,
      hdOptions: { addressIndex: 0 }
    });
    console.log(`   Derived ${hdWallets.length} ED25519 wallets from same mnemonic`);
    console.log(`   All unique addresses: ${new Set(hdWallets.map(w => w.address)).size === 3}`);
    console.log('');

    // Example 5b: HD wallet derivation (ED448)
    console.log('5️⃣b HD Wallet Derivation (ED448)');
    const ed448HdWallets = await deriveMultipleWallets({
      mnemonic: mnemonic,
      keyType: KEY_TYPE.ED448,
      hashTypes: [HASH_TYPE.SHA3_512],
      count: 3,
      hdOptions: { addressIndex: 0 }
    });
    console.log(`   Derived ${ed448HdWallets.length} ED448 wallets from same mnemonic`);
    console.log(`   All unique addresses: ${new Set(ed448HdWallets.map(w => w.address)).size === 3}`);
    console.log('   Note: ED448 addresses are different from ED25519 addresses');
    console.log('');

    // Example 6: ED448 wallet (higher security)
    console.log('6️⃣ ED448 Wallet (Higher Security)');
    const ed448Wallet = await createWallet({
      keyType: KEY_TYPE.ED448,
      hashTypes: [HASH_TYPE.SHA3_512],
      mnemonic: generateWords(12)
    });
    console.log(`   Address: ${ed448Wallet.address.substring(0, 20)}...`);
    console.log(`   Key Type: ${ed448Wallet.keyType}`);
    console.log(`   Hash Types: ${ed448Wallet.hashTypes.join(', ')}`);
    console.log('   Note: ED448 provides higher security than ED25519');
    console.log('');

    console.log('✅ All basic examples completed!');
    console.log('\n📚 Key Concepts:');
    console.log('   • Use KEY_TYPE and HASH_TYPE enums for type safety');
    console.log('   • Hash chaining applies right-to-left');
    console.log('   • HD derivation creates multiple addresses from one mnemonic');
    console.log('   • Same mnemonic + same settings = same address');
    console.log('   • ED448 provides higher security than ED25519 (larger keys)');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Example failed:', errorMessage);
  }
}