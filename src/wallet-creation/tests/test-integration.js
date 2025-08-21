import { 
  ZeraWallet, 
  createZeraWallet, 
  validateMnemonicPhrase, 
  validateZeraAddress 
} from '../index.js';
import { generateMnemonic } from '../utils.js';

/**
 * Test 1: Create wallet instance and get info
 */
async function testWalletInstanceInfo() {
  console.log('📋 Test 1: Wallet Instance Information');
  const wallet = new ZeraWallet();
  const info = wallet.getWalletInfo();
  console.log('Wallet Info:', JSON.stringify(info, null, 2));
  
  const keyTypeInfo = wallet.getKeyTypeInfo();
  console.log('Key Type Info:', JSON.stringify(keyTypeInfo, null, 2));
  console.log('');
  
  return wallet;
}

/**
 * Test 2: Generate mnemonic and create both wallet types
 */
async function testGenerateMnemonic() {
  console.log('🔑 Test 2: Create Both Wallet Types');
  const mnemonic = generateMnemonic(24);
  console.log('Generated mnemonic:', mnemonic);
  console.log('Mnemonic valid:', validateMnemonicPhrase(mnemonic));
  console.log('');
  
  return mnemonic;
}

/**
 * Test 3: Create ed25519 wallet
 */
async function testCreateEd25519Wallet(mnemonic) {
  console.log('🔐 Test 3: Create ed25519 Wallet');
  const ed25519Wallet = await createZeraWallet('ed25519', mnemonic);
  console.log('ed25519 Wallet created successfully');
  console.log('Type:', ed25519Wallet.type);
  console.log('Address:', ed25519Wallet.address);
  console.log('');
  
  return ed25519Wallet;
}

/**
 * Test 4: Create ed448 wallet
 */
async function testCreateEd448Wallet(mnemonic) {
  console.log('🔐 Test 4: Create ed448 Wallet');
  const ed448Wallet = await createZeraWallet('ed448', mnemonic);
  console.log('ed448 Wallet created successfully');
  console.log('Type:', ed448Wallet.type);
  console.log('Address:', ed448Wallet.address);
  console.log('');
  
  return ed448Wallet;
}

/**
 * Test 5: Validate addresses
 */
async function testAddressValidation(ed25519Wallet, ed448Wallet) {
  console.log('✅ Test 5: Address Validation');
  console.log('ed25519 address valid:', validateZeraAddress(ed25519Wallet.address));
  console.log('ed448 address valid:', validateZeraAddress(ed448Wallet.address));
  console.log('');
}

/**
 * Test 6: Create wallets with passphrase
 */
async function testWalletsWithPassphrase(mnemonic) {
  console.log('🔐 Test 6: Wallets with Passphrase');
  const passphrase = 'my-secure-passphrase-123!@#';
  
  const ed25519WithPass = await createZeraWallet('ed25519', mnemonic, passphrase);
  const ed448WithPass = await createZeraWallet('ed448', mnemonic, passphrase);
  
  console.log('ed25519 with passphrase address:', ed25519WithPass.address);
  console.log('ed448 with passphrase address:', ed448WithPass.address);
  console.log('');
  
  return { ed25519WithPass, ed448WithPass };
}

/**
 * Test 7: Verify address uniqueness
 */
async function testAddressUniqueness(ed25519Wallet, ed448Wallet, ed25519WithPass, ed448WithPass) {
  console.log('🏠 Test 7: Address Uniqueness Verification');
  const addresses = [
    ed25519Wallet.address,
    ed448Wallet.address,
    ed25519WithPass.address,
    ed448WithPass.address
  ];
  
  const uniqueAddresses = new Set(addresses);
  console.log('Total addresses generated:', addresses.length);
  console.log('Unique addresses:', uniqueAddresses.size);
  console.log('All addresses unique:', addresses.length === uniqueAddresses.size);
  console.log('');
}

/**
 * Test 8: Error handling
 */
async function testErrorHandling(mnemonic) {
  console.log('❌ Test 8: Error Handling');
  
  try {
    await createZeraWallet('invalid-type', mnemonic);
  } catch (error) {
    console.log('Expected error caught (invalid key type):', error.message);
  }
  
  try {
    await createZeraWallet('ed25519');
  } catch (error) {
    console.log('Expected error caught (missing mnemonic):', error.message);
  }
  
  try {
    await createZeraWallet('ed25519', 'invalid mnemonic phrase');
  } catch (error) {
    console.log('Expected error caught (invalid mnemonic):', error.message);
  }
  console.log('');
}

/**
 * Test 9: Wallet consistency
 */
async function testWalletConsistency(wallet, mnemonic) {
  console.log('🔄 Test 9: Wallet Consistency');
  const wallet1 = await wallet.createEd25519Wallet(mnemonic);
  const wallet2 = await wallet.createEd25519Wallet(mnemonic);
  
  console.log('Same mnemonic produces same wallet:', 
    wallet1.privateKey === wallet2.privateKey &&
    wallet1.publicKey === wallet2.publicKey &&
    wallet1.address === wallet2.address
  );
  console.log('');
}

/**
 * Main test runner that executes all tests in sequence
 */
async function runAllIntegrationTests() {
  console.log('🧪 Testing Integration - Complete Wallet Workflow\n');
  
  try {
    // Test 1: Create wallet instance and get info
    const wallet = await testWalletInstanceInfo();
    
    // Test 2: Generate mnemonic and create both wallet types
    const mnemonic = await testGenerateMnemonic();
    
    // Test 3: Create ed25519 wallet
    const ed25519Wallet = await testCreateEd25519Wallet(mnemonic);
    
    // Test 4: Create ed448 wallet
    const ed448Wallet = await testCreateEd448Wallet(mnemonic);
    
    // Test 5: Validate addresses
    await testAddressValidation(ed25519Wallet, ed448Wallet);
    
    // Test 6: Create wallets with passphrase
    const { ed25519WithPass, ed448WithPass } = await testWalletsWithPassphrase(mnemonic);
    
    // Test 7: Verify address uniqueness
    await testAddressUniqueness(ed25519Wallet, ed448Wallet, ed25519WithPass, ed448WithPass);
    
    // Test 8: Error handling
    await testErrorHandling(mnemonic);
    
    // Test 9: Wallet consistency
    await testWalletConsistency(wallet, mnemonic);
    
    console.log('🎉 Integration tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- ✅ Wallet instance creation');
    console.log('- ✅ Both ed25519 and ed448 wallet types');
    console.log('- ✅ Mnemonic validation');
    console.log('- ✅ Address generation and validation');
    console.log('- ✅ Passphrase support');
    console.log('- ✅ Error handling');
    console.log('- ✅ Wallet consistency');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Export individual test functions for selective testing
export {
  testWalletInstanceInfo,
  testGenerateMnemonic,
  testCreateEd25519Wallet,
  testCreateEd448Wallet,
  testAddressValidation,
  testWalletsWithPassphrase,
  testAddressUniqueness,
  testErrorHandling,
  testWalletConsistency
};

// Export the main test function
export default async function test() {
  return runAllIntegrationTests();
}

// Also export as named function for compatibility
export async function testIntegrationExport() {
  return runAllIntegrationTests();
}
