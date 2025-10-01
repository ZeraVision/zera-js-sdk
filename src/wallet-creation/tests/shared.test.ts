import { 
  createBaseWallet, 
  validateWalletObject,
  sanitizeWalletForLogging,
  createWalletSummary
} from '../shared.js';
import { validateAddress } from '../../shared/crypto/address-utils.js';
import { HASH_TYPE, isValidKeyType } from '../constants.js';
import { validateMnemonic } from 'bip39';
import { validateHashTypes } from '../hash-utils.js';
import { TEST_WALLET_ADDRESSES } from '../../test-utils/keys.test.js';

/**
 * Test 1: Mnemonic validation
 */
async function testMnemonicValidation(): Promise<void> {
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
async function testKeyTypeValidation(): Promise<void> {
  console.log('🔐 Test 2: Key Type Validation');
  console.log('ed25519 valid:', isValidKeyType('ed25519'));
  console.log('ed448 valid:', isValidKeyType('ed448'));
  console.log('invalid type valid:', isValidKeyType('invalid'));
  console.log('');
}

/**
 * Test 3: Create base wallet
 */
async function testCreateBaseWallet(): Promise<void> {
  console.log('💼 Test 3: Create Base Wallet');
  const validMnemonic = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
  const baseWallet = createBaseWallet(
    'hd', // type
    validMnemonic, // mnemonic
    'private-key-hex', // privateKey
    'zera-address', // address
    'public-key-hex', // publicKey
    1110, // coinType
    'ZRA', // symbol
    'm/44\'/1110\'/0\'/0\'/0\'', // derivationPath
    'ed25519', // keyType
    [HASH_TYPE.SHA3_256] // hashTypes
  );
  console.log('Base wallet created:', JSON.stringify(baseWallet, null, 2));
  console.log('');
}

/**
 * Test 4: Address validation
 */
async function testAddressValidation(): Promise<void> {
  console.log('🏠 Test 4: Address Validation');
  
  // Test valid ZERA address format (base58-encoded hashed public key)
  const validAddress = TEST_WALLET_ADDRESSES.alice;
  const invalidAddress1 = 'invalid-address';
  const invalidAddress2 = '';
  const invalidAddress3 = null;
  
  console.log('Valid address validation:', validateAddress(validAddress));
  console.log('Invalid address validation (invalid format):', validateAddress(invalidAddress1));
  console.log('Invalid address validation (empty string):', validateAddress(invalidAddress2));
  // @ts-expect-error: Intentionally testing invalid input for validation
  console.log('Invalid address validation (null):', validateAddress(invalidAddress3 as any));
  console.log('');
}

/**
 * Test 5: Parameter validation
 */
async function testParameterValidation(): Promise<void> {
  console.log('✅ Test 5: Parameter Validation');
  const validMnemonic = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
  
  try {
    validateHashTypes(['sha3_256']);
    console.log('Valid hash types passed validation');
  } catch (error) {
    console.log('Unexpected error:', (error as Error).message);
  }
  
  try {
    validateHashTypes([]);
    console.log('Empty hash types should fail');
  } catch (error) {
    console.log('Expected error caught:', (error as Error).message);
  }
  
  try {
    // @ts-expect-error: Intentionally testing invalid input for validation
    validateHashTypes(['invalid'] as any);
    console.log('Invalid hash type should fail');
  } catch (error) {
    console.log('Expected error caught:', (error as Error).message);
  }
  console.log('');
}

/**
 * Main test runner that executes all tests in sequence
 */
async function runAllSharedTests(): Promise<void> {
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
    console.error('❌ Shared utilities test failed:', (error as Error).message);
    console.error((error as Error).stack);
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
export default async function test(): Promise<void> {
  return runAllSharedTests();
}

// Also export as named function for compatibility
export async function testSharedExport(): Promise<void> {
  return runAllSharedTests();
}
