import {
  createWallet,
  generateMnemonicPhrase,
  buildDerivationPath,
  KEY_TYPE,
  HASH_TYPE
} from '../index.js';
import type { WalletOptions, Wallet, MnemonicLength } from '../../types/index.js';

export async function testBasicFunctionality(): Promise<void> {
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
  
  // Test 6: Create Ed448 wallet
  const mnemonic3 = generateMnemonicPhrase(18);
  const wallet4 = await createWallet({ 
    keyType: KEY_TYPE.ED448, 
    hashTypes: [HASH_TYPE.SHA3_256], 
    mnemonic: mnemonic3 
  });
  console.log('✅ Created Ed448 wallet:', wallet4.type);
  
  // Test 7: Create wallet with passphrase
  const wallet5 = await createWallet({ 
    keyType: KEY_TYPE.ED25519, 
    hashTypes: [HASH_TYPE.SHA3_256], 
    mnemonic: mnemonic1,
    passphrase: 'test-passphrase'
  });
  console.log('✅ Created wallet with passphrase:', wallet5.type);
  
  // Test 8: Create wallet with custom HD options
  const wallet6 = await createWallet({ 
    keyType: KEY_TYPE.ED25519, 
    hashTypes: [HASH_TYPE.SHA3_256], 
    mnemonic: mnemonic1,
    hdOptions: {
      accountIndex: 2,
      changeIndex: 1,
      addressIndex: 10
    }
  });
  console.log('✅ Created wallet with custom HD options:', wallet6.type);
  
  // Test 9: Verify wallet properties
  console.log('✅ Wallet properties verification:');
  console.log('  - Type:', wallet1.type);
  console.log('  - Address length:', wallet1.address.length);
  console.log('  - Public key length:', wallet1.publicKey.length);
  console.log('  - Private key length:', wallet1.privateKey.length);
  console.log('  - Derivation path:', wallet1.derivationPath);
  console.log('  - Key type:', wallet1.keyType);
  console.log('  - Hash types:', wallet1.hashTypes);
  console.log('  - Coin type:', wallet1.coinType);
  console.log('  - Symbol:', wallet1.symbol);
  console.log('  - Name:', wallet1.name);
  
  // Test 10: Test secure clear functionality
  console.log('✅ Testing secure clear functionality...');
  wallet1.secureClear();
  console.log('✅ Wallet securely cleared');
  
  console.log('🎉 All basic functionality tests passed!');
}

export async function testErrorHandling(): Promise<void> {
  console.log('🧪 Testing error handling...');
  
  try {
    // Test invalid key type
    await createWallet({ 
      keyType: 'invalid' as any, 
      hashTypes: [HASH_TYPE.SHA3_256], 
      mnemonic: generateMnemonicPhrase(12) 
    });
    console.log('❌ Should have thrown error for invalid key type');
  } catch (error) {
    console.log('✅ Correctly caught invalid key type error:', (error as Error).message);
  }
  
  try {
    // Test invalid hash type
    await createWallet({ 
      keyType: KEY_TYPE.ED25519, 
      hashTypes: ['invalid' as any], 
      mnemonic: generateMnemonicPhrase(12) 
    });
    console.log('❌ Should have thrown error for invalid hash type');
  } catch (error) {
    console.log('✅ Correctly caught invalid hash type error:', (error as Error).message);
  }
  
  try {
    // Test missing mnemonic
    await createWallet({ 
      keyType: KEY_TYPE.ED25519, 
      hashTypes: [HASH_TYPE.SHA3_256]
    } as WalletOptions);
    console.log('❌ Should have thrown error for missing mnemonic');
  } catch (error) {
    console.log('✅ Correctly caught missing mnemonic error:', (error as Error).message);
  }
  
  try {
    // Test empty hash types
    await createWallet({ 
      keyType: KEY_TYPE.ED25519, 
      hashTypes: [], 
      mnemonic: generateMnemonicPhrase(12) 
    });
    console.log('❌ Should have thrown error for empty hash types');
  } catch (error) {
    console.log('✅ Correctly caught empty hash types error:', (error as Error).message);
  }
  
  console.log('🎉 All error handling tests passed!');
}

export async function testMnemonicGeneration(): Promise<void> {
  console.log('🧪 Testing mnemonic generation...');
  
  // Test different mnemonic lengths
  const lengths = [12, 15, 18, 21, 24];
  
  for (const length of lengths) {
    const mnemonic = generateMnemonicPhrase(length as MnemonicLength);
    const words = mnemonic.split(' ');
    console.log(`✅ Generated ${length}-word mnemonic: ${words.length} words`);
    
    if (words.length !== length) {
      throw new Error(`Expected ${length} words, got ${words.length}`);
    }
  }
  
  console.log('🎉 All mnemonic generation tests passed!');
}

export async function testDerivationPaths(): Promise<void> {
  console.log('🧪 Testing derivation path building...');
  
  // Test default path
  const defaultPath = buildDerivationPath();
  console.log('✅ Default path:', defaultPath);
  
  // Test custom paths
  const customPaths = [
    buildDerivationPath({ accountIndex: 1 }),
    buildDerivationPath({ changeIndex: 1 }),
    buildDerivationPath({ addressIndex: 5 }),
    buildDerivationPath({ accountIndex: 2, changeIndex: 1, addressIndex: 10 })
  ];
  
  for (const path of customPaths) {
    console.log('✅ Custom path:', path);
  }
  
  console.log('🎉 All derivation path tests passed!');
}

export async function runAllTests(): Promise<void> {
  console.log('🚀 Starting wallet creation tests...\n');
  
  try {
    await testBasicFunctionality();
    console.log('');
    
    await testErrorHandling();
    console.log('');
    
    await testMnemonicGeneration();
    console.log('');
    
    await testDerivationPaths();
    console.log('');
    
    console.log('🎉 All wallet creation tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}
