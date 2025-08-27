import {
  createWallet,
  deriveMultipleWallets,
  generateWords,
  KEY_TYPE,
  HASH_TYPE
} from './index.js';

/**
 * Clean, simple example of the new unified wallet creation system
 */
async function demonstrateCleanInterface() {
  console.log('🎯 ZERA Wallet Creation - Clean & Simple Interface\n');

  try {
    // 1. Create a simple Ed25519 wallet (generates new mnemonic)
    console.log('1️⃣ Creating Ed25519 wallet...');
    const words1 = generateWords(12);
    console.log('   📝 Generated words:', words1);
    const wallet1 = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic: words1
    });
    console.log('   ✅ Created wallet with address:', wallet1.address.substring(0, 20) + '...');
    console.log('   ✅ Key type:', wallet1.keyType);
    console.log('   ✅ Hash types:', wallet1.hashTypes);
    console.log('   ✅ Mnemonic length:', wallet1.mnemonic.split(' ').length);
    console.log('   ✅ Public key (bytes):', wallet1.publicKey.length, 'bytes');
    console.log('   ✅ Public key (base58):', wallet1.publicKeyFormat.substring(0, 20) + '...');
    console.log('   ✅ Private key (base58):', wallet1.privateKey.substring(0, 20) + '...');
    console.log('');

    // 2. Create Ed25519 wallet with Blake3 hash
    console.log('2️⃣ Creating Ed25519 wallet with Blake3 hash...');
    const words2 = generateWords(15);
    console.log('   📝 Generated words:', words2);
    const wallet2 = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.BLAKE3],
      mnemonic: words2
    });
    console.log('   ✅ Created wallet with address:', wallet2.address.substring(0, 20) + '...');
    console.log('   ✅ Key type:', wallet2.keyType);
    console.log('   ✅ Hash types:', wallet2.hashTypes);
    console.log('   ✅ Mnemonic length:', wallet2.mnemonic.split(' ').length);
    console.log('   ✅ Public key (bytes):', wallet2.publicKey.length, 'bytes');
    console.log('   ✅ Public key (base58):', wallet2.publicKeyFormat.substring(0, 20) + '...');
    console.log('   ✅ Private key (base58):', wallet2.privateKey.substring(0, 20) + '...');
    console.log('');

    // 3. Create wallet with multiple hashes (right to left)
    console.log('3️⃣ Creating wallet with multiple hashes (SHA3-512 → Blake3)...');
    const words3 = generateWords(18);
    console.log('   📝 Generated words:', words3);
    const wallet3 = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_512, HASH_TYPE.BLAKE3],
      mnemonic: words3
    });
    console.log('   ✅ Created wallet with address:', wallet3.address.substring(0, 20) + '...');
    console.log('   ✅ Key type:', wallet3.keyType);
    console.log('   ✅ Hash types:', wallet3.hashTypes);
    console.log('   ✅ Mnemonic length:', wallet3.mnemonic.split(' ').length);
    console.log('   ✅ Public key (bytes):', wallet3.publicKey.length, 'bytes');
    console.log('   ✅ Public key (base58):', wallet3.publicKeyFormat.substring(0, 20) + '...');
    console.log('   ✅ Private key (base58):', wallet3.privateKey.substring(0, 20) + '...');
    console.log('');

    // 4. Create wallet using existing mnemonic (same as import)
    console.log('4️⃣ Creating wallet using existing mnemonic...');
    const importedWallet = await createWallet({
      mnemonic: wallet1.mnemonic,
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256]
    });
    console.log('   ✅ Created wallet from existing mnemonic successfully');
    console.log('   ✅ Different hash produces different address:', wallet1.address !== importedWallet.address);
    console.log('');

    // 5. Derive multiple addresses from same mnemonic
    console.log('5️⃣ Deriving multiple addresses from same mnemonic...');
    const multipleWallets = await deriveMultipleWallets({
      mnemonic: wallet1.mnemonic,
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.BLAKE3],
      count: 3,
      hdOptions: {
        accountIndex: 0,
        changeIndex: 0,
        addressIndex: 0
      }
    });
    console.log('   ✅ Derived 3 wallets from same mnemonic');
    console.log('   ✅ All addresses are unique:', new Set(multipleWallets.map(w => w.address)).size === 3);
    console.log('');

    console.log('🎉 All examples completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Simple, clean interface');
    console.log('   - Generate words first, then specify keyType, hashTypes, and mnemonic');
    console.log('   - Supports all BIP39 mnemonic lengths (12, 15, 18, 21, 24)');
    console.log('   - Flexible hash chaining (right to left)');
    console.log('   - HD wallet support with custom derivation paths');
    console.log('   - Hash types are always required and validated');
    console.log('   - Single createWallet function for both new and existing mnemonics');
    console.log('\n🔑 Key Format Updates:');
    console.log('   - ✅ Private keys now use base58 encoding (not hex)');
    console.log('   - ✅ Public keys now use base58 encoding (not hex)');
    console.log('   - ✅ Public key format: KeyType_HashTypes_base58publickey');
    console.log('   - ✅ Clean wallet object with proper encoding');

  } catch (error) {
    console.error('❌ Example failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('example-clean.js')) {
  demonstrateCleanInterface();
}

export { demonstrateCleanInterface };
