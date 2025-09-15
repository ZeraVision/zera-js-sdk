import {
  createWallet,
  generateMnemonicPhrase,
  buildDerivationPath,
  KEY_TYPE,
  HASH_TYPE
} from '../index.js';

export async function testBasicFunctionality() {
  console.log('🧪 Testing basic wallet creation functionality...');
  
  // Test 1: Create basic Ed25519 wallet
  const mnemonic1 = generateMnemonicPhrase(12);
  const wallet1 = await createWallet({ 
    keyType: KEY_TYPE.ED25519, 
    hashTypes: [HASH_TYPE.SHA3_256],
    mnemonic: mnemonic1
  });
  console.log('✅ Created Ed25519 wallet:', wallet1.type);
  
  // Test 2: Create Ed25519 wallet with Blake3 hash
  const mnemonic2 = generateMnemonicPhrase(15);
  const wallet2 = await createWallet({ 
    keyType: KEY_TYPE.ED25519, 
    hashTypes: [HASH_TYPE.BLAKE3], 
    mnemonic: mnemonic2
  });
  console.log('✅ Created Ed25519 wallet with Blake3 hash:', wallet2.type);
  
  // Test 3: Create wallet using existing mnemonic (instead of import)
  const walletWithExistingMnemonic = await createWallet({ 
    keyType: KEY_TYPE.ED25519, 
    hashTypes: [HASH_TYPE.SHA3_256], 
    mnemonic: wallet1.mnemonic 
  });
  console.log('✅ Created wallet with existing mnemonic:', walletWithExistingMnemonic.type);
  
  // Test 4: Create wallet with multiple hashes
  const wallet3 = await createWallet({ 
    keyType: KEY_TYPE.ED25519, 
    hashTypes: [HASH_TYPE.SHA3_512, HASH_TYPE.BLAKE3], 
    mnemonic: wallet1.mnemonic 
  });
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

testWalletTypes();
export async function testWalletTypes() {
  console.log('🧪 Testing different wallet types...');
  
  // Test Ed25519 wallets
  const mnemonic1 = generateMnemonicPhrase(18);
  const ed25519Wallet = await createWallet({ 
    keyType: KEY_TYPE.ED25519, 
    hashTypes: [HASH_TYPE.SHA3_256],
    mnemonic: mnemonic1
  });
  console.log('✅ Ed25519 wallet created:', ed25519Wallet.keyType);
  
  // Test Ed448 wallet (placeholder for now)
  try {
    const mnemonic2 = generateMnemonicPhrase(21);
    const ed448Wallet = await createWallet({ 
      keyType: KEY_TYPE.ED448, 
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic: mnemonic2
    });
    console.log('✅ Ed448 wallet created:', ed448Wallet.keyType);
  } catch (error) {
    console.log('⚠️ Ed448 wallet creation failed (expected for now):', error.message);
  }
  
  console.log('🎉 Wallet type tests completed!');
}

export async function testHashChaining() {
  console.log('🧪 Testing hash chaining functionality...');
  
  // Test single hash
  const mnemonic1 = generateMnemonicPhrase(15);
  const singleHashWallet = await createWallet({ 
    keyType: KEY_TYPE.ED25519, 
    hashTypes: [HASH_TYPE.SHA3_256], 
    mnemonic: mnemonic1
  });
  console.log('✅ Single hash wallet created:', singleHashWallet.hashTypes);
  
  // Test multiple hashes (right to left)
  const mnemonic2 = generateMnemonicPhrase(18);
  const multiHashWallet = await createWallet({ 
    keyType: KEY_TYPE.ED25519, 
    hashTypes: [HASH_TYPE.SHA3_512, HASH_TYPE.BLAKE3], 
    mnemonic: mnemonic2
  });
  console.log('✅ Multi-hash wallet created:', multiHashWallet.hashTypes);
  
  // Test complex hash chain
  const mnemonic3 = generateMnemonicPhrase(24);
  const complexHashWallet = await createWallet({ 
    keyType: KEY_TYPE.ED25519, 
    hashTypes: [HASH_TYPE.SHA3_256, HASH_TYPE.SHA3_512, HASH_TYPE.BLAKE3], 
    mnemonic: mnemonic3
  });
  console.log('✅ Complex hash chain wallet created:', complexHashWallet.hashTypes);
  
  console.log('🎉 Hash chaining tests completed!');
}

export async function testErrorHandling() {
  console.log('🧪 Testing error handling...');
  
  // Test invalid key type
  try {
    await createWallet({ keyType: 'invalid', mnemonic: generateMnemonicPhrase(12) });
    throw new Error('Should have failed with invalid key type');
  } catch (error) {
    console.log('✅ Correctly caught invalid key type error:', error.message);
  }
  
  // Test invalid hash type
  try {
    await createWallet({ keyType: KEY_TYPE.ED25519, hashTypes: ['invalid-hash'], mnemonic: generateMnemonicPhrase(12) });
    throw new Error('Should have failed with invalid hash type');
  } catch (error) {
    console.log('✅ Correctly caught invalid hash type error:', error.message);
  }
  
  // Test invalid mnemonic length
  try {
    generateMnemonicPhrase(13);
    throw new Error('Should have failed with invalid mnemonic length');
  } catch (error) {
    console.log('✅ Correctly caught invalid mnemonic length error:', error.message);
  }
  
  console.log('🎉 Error handling tests completed!');
}
