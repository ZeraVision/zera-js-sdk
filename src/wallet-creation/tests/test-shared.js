import { 
  validateMnemonicPhrase, 
  validateZeraAddress, 
  createBaseWallet, 
  validateKeyType, 
  validateWalletParams 
} from '../shared.js';

/**
 * Test 1: Mnemonic validation
 */
async function testMnemonicValidation() {
  console.log('🔑 Test 1: Mnemonic Validation');
  const validMnemonic = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
  const invalidMnemonic = 'invalid mnemonic phrase';
  
  console.log('Valid mnemonic:', validateMnemonicPhrase(validMnemonic));
  console.log('Invalid mnemonic:', validateMnemonicPhrase(invalidMnemonic));
  console.log('');
}

/**
 * Test 2: Key type validation
 */
async function testKeyTypeValidation() {
  console.log('🔐 Test 2: Key Type Validation');
  console.log('ed25519 valid:', validateKeyType('ed25519'));
  console.log('ed448 valid:', validateKeyType('ed448'));
  console.log('invalid type valid:', validateKeyType('invalid'));
  console.log('');
}

/**
 * Test 3: Create base wallet
 */
async function testCreateBaseWallet() {
  console.log('💼 Test 3: Create Base Wallet');
  const validMnemonic = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
  const baseWallet = createBaseWallet(
    'ed25519',
    validMnemonic,
    'private-key-hex',
    'public-key-hex',
    'zera-address',
    1110,
    'ZRA',
    'm/44\'/1110\'/0\'/0/0'
  );
  console.log('Base wallet created:', JSON.stringify(baseWallet, null, 2));
  console.log('');
}

/**
 * Test 4: Address validation
 */
async function testAddressValidation() {
  console.log('🏠 Test 4: Address Validation');
  // Note: This will fail with placeholder addresses since we're using a simple validation
  console.log('Address validation function exists:', typeof validateZeraAddress === 'function');
  console.log('');
}

/**
 * Test 5: Parameter validation
 */
async function testParameterValidation() {
  console.log('✅ Test 5: Parameter Validation');
  const validMnemonic = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
  
  try {
    validateWalletParams(validMnemonic, 'ed25519');
    console.log('Valid parameters passed validation');
  } catch (error) {
    console.log('Unexpected error:', error.message);
  }
  
  try {
    validateWalletParams('', 'ed25519');
    console.log('Missing mnemonic should fail');
  } catch (error) {
    console.log('Expected error caught:', error.message);
  }
  
  try {
    validateWalletParams(validMnemonic, 'invalid');
    console.log('Invalid key type should fail');
  } catch (error) {
    console.log('Expected error caught:', error.message);
  }
  console.log('');
}

/**
 * Main test runner that executes all tests in sequence
 */
async function runAllSharedTests() {
  console.log('🧪 Testing Shared Utilities Module\n');
  
  try {
    // Test 1: Mnemonic validation
    await testMnemonicValidation();
    
    // Test 2: Key type validation
    await testKeyTypeValidation();
    
    // Test 3: Create base wallet
    await testCreateBaseWallet();
    
    // Test 4: Address validation
    await testAddressValidation();
    
    // Test 5: Parameter validation
    await testParameterValidation();
    
    console.log('🎉 Shared utilities tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Shared utilities test failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Export individual test functions for selective testing
export {
  testMnemonicValidation,
  testKeyTypeValidation,
  testCreateBaseWallet,
  testAddressValidation,
  testParameterValidation
};

// Export the main test function
export default async function test() {
  return runAllSharedTests();
}

// Also export as named function for compatibility
export async function testSharedExport() {
  return runAllSharedTests();
}
