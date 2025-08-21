import { 
  createEd25519Wallet, 
  getEd25519WalletInfo,
  importEd25519WalletFromSeed,
  importEd25519WalletFromPrivateKey,
  importEd25519WalletFromPublicKey
} from '../ed25519.js';
import { generateMnemonic } from '../utils.js';
import bs58 from 'bs58';

/**
 * Test 1: Get wallet info
 */
async function testWalletInfo() {
  console.log('📋 Test 1: Wallet Information');
  const walletInfo = getEd25519WalletInfo();
  console.log('ed25519 Info:', JSON.stringify(walletInfo, null, 2));
  console.log('');
}

/**
 * Test 2: Generate mnemonic and create wallet
 */
async function testCreateWallet() {
  console.log('🔐 Test 2: Create ed25519 Wallet');
  const mnemonic = generateMnemonic(24);
  console.log('Generated mnemonic:', mnemonic);
  
  const wallet = await createEd25519Wallet(mnemonic);
  console.log('Wallet created:', JSON.stringify(wallet, null, 2));
  console.log('');
  
  return { wallet, mnemonic };
}

/**
 * Test 3: Verify wallet structure
 */
async function testWalletStructure(wallet) {
  console.log('✅ Test 3: Wallet Structure Validation');
  const requiredFields = ['type', 'mnemonic', 'privateKey', 'publicKey', 'address', 'derivationPath', 'coinType', 'symbol'];
  const missingFields = requiredFields.filter(field => !(field in wallet));
  
  if (missingFields.length === 0) {
    console.log('✅ All required fields present');
  } else {
    console.log('❌ Missing fields:', missingFields);
  }
  
  console.log('Wallet type:', wallet.type);
  console.log('Private key (base58):', wallet.privateKey);
  console.log('Public key (base58):', wallet.publicKey);
  console.log('Address length:', wallet.address.length);
  console.log('');
}

/**
 * Test 4: Create wallet with passphrase
 */
async function testWalletWithPassphrase(mnemonic) {
  console.log('🔐 Test 4: Wallet with Passphrase');
  const passphraseWallet = await createEd25519Wallet(mnemonic, 'my-secure-passphrase');
  console.log('Passphrase wallet created:', JSON.stringify(passphraseWallet, null, 2));
  console.log('');
  
  return passphraseWallet;
}

/**
 * Test 5: Verify different addresses with same mnemonic
 */
async function testAddressUniqueness(wallet, passphraseWallet) {
  console.log('🏠 Test 5: Address Uniqueness');
  console.log('Same mnemonic, no passphrase:', wallet.address);
  console.log('Same mnemonic, with passphrase:', passphraseWallet.address);
  console.log('Addresses different:', wallet.address !== passphraseWallet.address);
  console.log('');
}

/**
 * Test 6: Error handling - invalid mnemonic
 */
async function testInvalidMnemonicError() {
  console.log('❌ Test 6: Error Handling - Invalid Mnemonic');
  try {
    await createEd25519Wallet('invalid mnemonic phrase');
  } catch (error) {
    console.log('Expected error caught:', error.message);
  }
  console.log('');
}

/**
 * Test 7: Import from seed phrase (HD wallet)
 */
async function testImportFromSeed(mnemonic, wallet) {
  console.log('🌱 Test 7: Import from Seed Phrase (HD Wallet)');
  const importedSeedWallet = await importEd25519WalletFromSeed(mnemonic, '', 'm/44\'/1110\'/0\'/0/1');
  console.log('Imported seed wallet:', JSON.stringify(importedSeedWallet, null, 2));
  console.log('Different derivation path, different address:', importedSeedWallet.address !== wallet.address);
  console.log('');
}

/**
 * Test 8: Import from private key
 */
async function testImportFromPrivateKey(wallet) {
  console.log('🔑 Test 8: Import from Private Key');
  const importedPrivateKeyWallet = await importEd25519WalletFromPrivateKey(wallet.privateKey);
  console.log('Imported private key wallet:', JSON.stringify(importedPrivateKeyWallet, null, 2));
  console.log('Same address from private key:', importedPrivateKeyWallet.address === wallet.address);
  console.log('No mnemonic in imported wallet:', importedPrivateKeyWallet.mnemonic === null);
  console.log('');
}

/**
 * Test 9: Import from public key (read-only)
 */
async function testImportFromPublicKey(wallet) {
  console.log('🔓 Test 9: Import from Public Key (Read-only)');
  const importedPublicKeyWallet = await importEd25519WalletFromPublicKey(wallet.publicKey);
  console.log('Imported public key wallet:', JSON.stringify(importedPublicKeyWallet, null, 2));
  console.log('Same address from public key:', importedPublicKeyWallet.address === wallet.address);
  console.log('No private key in read-only wallet:', importedPublicKeyWallet.privateKey === null);
  console.log('No mnemonic in read-only wallet:', importedPublicKeyWallet.mnemonic === null);
  console.log('');
}

/**
 * Test 10: Error handling - invalid private key
 */
async function testInvalidPrivateKeyError() {
  console.log('❌ Test 10: Error Handling - Invalid Private Key');
  try {
    await importEd25519WalletFromPrivateKey('invalid-base58-key');
  } catch (error) {
    console.log('Expected error caught:', error.message);
  }
  console.log('');
}

/**
 * Test 11: Error handling - invalid public key
 */
async function testInvalidPublicKeyError() {
  console.log('❌ Test 11: Error Handling - Invalid Public Key');
  try {
    await importEd25519WalletFromPublicKey('invalid-base58-key');
  } catch (error) {
    console.log('Expected error caught:', error.message);
  }
  console.log('');
}

/**
 * Test 12: Base58 validation
 */
async function testBase58Validation(wallet) {
  console.log('🔢 Test 12: Base58 Validation');
  console.log('Private key is valid base58:', bs58.decode(wallet.privateKey).length === 32);
  console.log('Public key is valid base58:', bs58.decode(wallet.publicKey).length === 32);
  console.log('');
}

/**
 * Test 13: Import error handling - wrong key lengths
 */
async function testWrongKeyLengthErrors() {
  console.log('❌ Test 13: Import Error Handling - Wrong Key Lengths');
  
  // Wrong length private key (simulate wrong key type)
  try {
    const wrongLengthKey = bs58.encode(Buffer.alloc(56)); // 56 bytes instead of 32
    await importEd25519WalletFromPrivateKey(wrongLengthKey);
    console.log('❌ Should have thrown error for wrong length private key');
  } catch (error) {
    console.log('✅ Wrong length private key error caught:', error.message);
  }
  
  // Wrong length public key
  try {
    const wrongLengthPubKey = bs58.encode(Buffer.alloc(56)); // 56 bytes instead of 32
    await importEd25519WalletFromPublicKey(wrongLengthPubKey);
    console.log('❌ Should have thrown error for wrong length public key');
  } catch (error) {
    console.log('✅ Wrong length public key error caught:', error.message);
  }
  console.log('');
}

/**
 * Main test runner that executes all tests in sequence
 */
async function runAllEd25519Tests() {
  console.log('🧪 Testing ed25519 Wallet Module\n');
  
  try {
    // Test 1: Get wallet info
    await testWalletInfo();
    
    // Test 2: Generate mnemonic and create wallet
    const { wallet, mnemonic } = await testCreateWallet();
    
    // Test 3: Verify wallet structure
    await testWalletStructure(wallet);
    
    // Test 4: Create wallet with passphrase
    const passphraseWallet = await testWalletWithPassphrase(mnemonic);
    
    // Test 5: Verify different addresses with same mnemonic
    await testAddressUniqueness(wallet, passphraseWallet);
    
    // Test 6: Error handling - invalid mnemonic
    await testInvalidMnemonicError();
    
    // Test 7: Import from seed phrase (HD wallet)
    await testImportFromSeed(mnemonic, wallet);
    
    // Test 8: Import from private key
    await testImportFromPrivateKey(wallet);
    
    // Test 9: Import from public key (read-only)
    await testImportFromPublicKey(wallet);
    
    // Test 10: Error handling - invalid private key
    await testInvalidPrivateKeyError();
    
    // Test 11: Error handling - invalid public key
    await testInvalidPublicKeyError();
    
    // Test 12: Base58 validation
    await testBase58Validation(wallet);
    
    // Test 13: Import error handling - wrong key lengths
    await testWrongKeyLengthErrors();
    
    console.log('🎉 ed25519 tests completed successfully!');
    
  } catch (error) {
    console.error('❌ ed25519 test failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Export individual test functions for selective testing
export {
  testWalletInfo,
  testCreateWallet,
  testWalletStructure,
  testWalletWithPassphrase,
  testAddressUniqueness,
  testInvalidMnemonicError,
  testImportFromSeed,
  testImportFromPrivateKey,
  testImportFromPublicKey,
  testInvalidPrivateKeyError,
  testInvalidPublicKeyError,
  testBase58Validation,
  testWrongKeyLengthErrors
};

// Export the main test function
export default async function test() {
  return runAllEd25519Tests();
}

// Also export as named function for compatibility
export async function testEd25519Export() {
  return runAllEd25519Tests();
}
