import { 
  validateMnemonic, 
  validateAddress, 
  createBaseWallet, 
  validateKeyType, 
  validateHashTypesArray 
} from '../shared.js';

/**
 * Test 1: Mnemonic validation
 */
async function testMnemonicValidation() {
  console.log('🔑 Test 1: Mnemonic Validation');
  const validMnemonic = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
  const invalidMnemonic = 'invalid mnemonic phrase';
  
  console.log('Valid mnemonic:', validateMnemonic(validMnemonic));
  console.log('Invalid mnemonic:', validateMnemonic(invalidMnemonic));
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
    'm/44\'/1110\'/0\'/0\'/0\''
  );
  console.log('Base wallet created:', JSON.stringify(baseWallet, null, 2));
  console.log('');
}

/**
 * Test 4: Address validation
 */
async function testAddressValidation() {
  console.log('🏠 Test 4: Address Validation');
  
  // Test valid ZERA address format (base58-encoded hashed public key)
  const validAddress = '5KJvsngHeMby884zrh6A5u6b4SqzZzAb'; // Example base58 string
  const invalidAddress1 = 'invalid-address';
  const invalidAddress2 = '';
  const invalidAddress3 = null;
  
  console.log('Valid address validation:', validateAddress(validAddress));
  console.log('Invalid address validation (invalid format):', validateAddress(invalidAddress1));
  console.log('Invalid address validation (empty string):', validateAddress(invalidAddress2));
  console.log('Invalid address validation (null):', validateAddress(invalidAddress3));
  console.log('');
}

/**
 * Test 5: Parameter validation
 */
async function testParameterValidation() {
  console.log('✅ Test 5: Parameter Validation');
  const validMnemonic = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
  
  try {
    validateHashTypesArray(['sha3_256']);
    console.log('Valid hash types passed validation');
  } catch (error) {
    console.log('Unexpected error:', error.message);
  }
  
  try {
    validateHashTypesArray([]);
    console.log('Empty hash types should fail');
  } catch (error) {
    console.log('Expected error caught:', error.message);
  }
  
  try {
    validateHashTypesArray(['invalid']);
    console.log('Invalid hash type should fail');
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
