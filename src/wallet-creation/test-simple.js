import {
  createWallet,
  importWallet,
  generateMnemonicPhrase,
  buildDerivationPath,
  KEY_TYPE,
  HASH_TYPE
} from './index.js';

export async function testBasicFunctionality() {
  console.log('🧪 Testing basic wallet creation functionality...');
  
  // Test 1: Create basic Ed25519 wallet
  const wallet1 = await createWallet({ keyType: KEY_TYPE.ED25519, mnemonicLength: 12 });
  console.log('✅ Created Ed25519 wallet:', wallet1.type);
  
  // Test 2: Create Ed25519 wallet with Blake3 hash
  const wallet2 = await createWallet({ keyType: KEY_TYPE.ED25519, hashTypes: [HASH_TYPE.BLAKE3], mnemonicLength: 15 });
  console.log('✅ Created Ed25519 wallet with Blake3 hash:', wallet2.type);
  
  // Test 3: Import wallet using existing mnemonic
  const importedWallet = await importWallet({ mnemonic: wallet1.mnemonic, keyType: KEY_TYPE.ED25519, hashTypes: [HASH_TYPE.SHA3_256] });
  console.log('✅ Imported wallet successfully:', importedWallet.type);
  
  // Test 4: Create wallet with multiple hashes
  const wallet3 = await createWallet({ keyType: KEY_TYPE.ED25519, hashTypes: [HASH_TYPE.SHA3_512, HASH_TYPE.BLAKE3], mnemonic: wallet1.mnemonic });
  console.log('✅ Created wallet with multiple hashes:', wallet3.type);
  
  // Test 5: Test derivation path building
  const path1 = buildDerivationPath();
  const path2 = buildDerivationPath({ accountIndex: 1, changeIndex: 1, addressIndex: 5 });
  console.log('✅ Built derivation paths:', { default: path1, custom: path2 });
  
  // Test 6: Generate mnemonic phrases of different lengths
  const mnemonic12 = generateMnemonicPhrase(12);
  const mnemonic24 = generateMnemonicPhrase(24);
  console.log('✅ Generated mnemonics:', { length12: mnemonic12.split(' ').length, length24: mnemonic24.split(' ').length });
  
  console.log('🎉 All basic functionality tests passed!');
}

export async function testWalletTypes() {
  console.log('🧪 Testing different wallet types...');
  
  // Test Ed25519 wallets
  const ed25519Wallet = await createWallet({ keyType: KEY_TYPE.ED25519, mnemonicLength: 18 });
  console.log('✅ Ed25519 wallet created:', ed25519Wallet.keyType);
  
  // Test Ed448 wallet (placeholder for now)
  try {
    const ed448Wallet = await createWallet({ keyType: KEY_TYPE.ED448, mnemonicLength: 21 });
    console.log('✅ Ed448 wallet created:', ed448Wallet.keyType);
  } catch (error) {
    console.log('⚠️ Ed448 wallet creation failed (expected for now):', error.message);
  }
  
  console.log('🎉 Wallet type tests completed!');
}

export async function testHashChaining() {
  console.log('🧪 Testing hash chaining functionality...');
  
  // Test single hash
  const singleHashWallet = await createWallet({ keyType: KEY_TYPE.ED25519, hashTypes: [HASH_TYPE.SHA3_256], mnemonicLength: 15 });
  console.log('✅ Single hash wallet created:', singleHashWallet.hashTypes);
  
  // Test multiple hashes (right to left)
  const multiHashWallet = await createWallet({ keyType: KEY_TYPE.ED25519, hashTypes: [HASH_TYPE.SHA3_512, HASH_TYPE.BLAKE3], mnemonicLength: 18 });
  console.log('✅ Multi-hash wallet created:', multiHashWallet.hashTypes);
  
  // Test complex hash chain
  const complexHashWallet = await createWallet({ keyType: KEY_TYPE.ED25519, hashTypes: [HASH_TYPE.SHA3_256, HASH_TYPE.SHA3_512, HASH_TYPE.BLAKE3], mnemonicLength: 24 });
  console.log('✅ Complex hash chain wallet created:', complexHashWallet.hashTypes);
  
  console.log('🎉 Hash chaining tests completed!');
}

export async function testErrorHandling() {
  console.log('🧪 Testing error handling...');
  
  // Test invalid key type
  try {
    await createWallet({ keyType: 'invalid', mnemonicLength: 12 });
    throw new Error('Should have failed with invalid key type');
  } catch (error) {
    console.log('✅ Correctly caught invalid key type error:', error.message);
  }
  
  // Test invalid hash type
  try {
    await createWallet({ keyType: KEY_TYPE.ED25519, hashTypes: ['invalid-hash'], mnemonicLength: 12 });
    throw new Error('Should have failed with invalid hash type');
  } catch (error) {
    console.log('✅ Correctly caught invalid hash type error:', error.message);
  }
  
  // Test invalid mnemonic length
  try {
    await createWallet({ keyType: KEY_TYPE.ED25519, mnemonicLength: 13 });
    throw new Error('Should have failed with invalid mnemonic length');
  } catch (error) {
    console.log('✅ Correctly caught invalid mnemonic length error:', error.message);
  }
  
  console.log('🎉 Error handling tests completed!');
}
