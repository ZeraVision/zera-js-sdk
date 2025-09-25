import { assert } from '../../test-utils/index.js';
import { 
  SUPPORTED_KEY_TYPES, 
  ZERA_TYPE,
  ZERA_TYPE_HEX,
  ZERA_SYMBOL,
  ZERA_NAME,
  SLIP0010_DERIVATION_PATH
} from '../constants.js';

/**
 * Test 1: SUPPORTED_KEY_TYPES
 */
async function testSupportedKeyTypes(): Promise<void> {
  assert.ok(Array.isArray(SUPPORTED_KEY_TYPES), 'SUPPORTED_KEY_TYPES should be an array');
  assert.ok(SUPPORTED_KEY_TYPES.includes('ed25519'), 'SUPPORTED_KEY_TYPES should include ed25519');
  assert.ok(SUPPORTED_KEY_TYPES.includes('ed448'), 'SUPPORTED_KEY_TYPES should include ed448');
  assert.equal(SUPPORTED_KEY_TYPES.length, 2, 'SUPPORTED_KEY_TYPES should have 2 elements');
}

/**
 * Test 2: ZERA Network constants
 */
async function testZeraNetworkConstants(): Promise<void> {
  assert.equal(ZERA_TYPE, 1110, 'ZERA_TYPE should be 1110');
  assert.equal(ZERA_TYPE_HEX, '0x80000456', 'ZERA_TYPE_HEX should be 0x80000456');
  assert.equal(ZERA_SYMBOL, 'ZRA', 'ZERA_SYMBOL should be ZRA');
  assert.equal(ZERA_NAME, 'ZERA', 'ZERA_NAME should be ZRA');
}

/**
 * Test 3: Derivation path
 */
async function testDerivationPath(): Promise<void> {
  assert.equal(SLIP0010_DERIVATION_PATH, 'm/44\'/1110\'/0\'/0\'/0\'', 'SLIP0010_DERIVATION_PATH should be SLIP-0010 format (all hardened)');
}


/**
 * Main test runner that executes all tests in sequence
 */
async function runAllConstantsTests(): Promise<void> {
  console.log('🧪 Testing Constants Module');
  
  try {
    // Test 1: SUPPORTED_KEY_TYPES
    await testSupportedKeyTypes();
    
    // Test 2: ZERA Network constants
    await testZeraNetworkConstants();
    
    // Test 3: Derivation path
    await testDerivationPath();
    
    console.log('✅ All constants tests passed');
  } catch (error) {
    console.error('❌ Constants test failed:', (error as Error).message);
    throw error;
  }
}

// Export individual test functions for selective testing
export {
  testSupportedKeyTypes,
  testZeraNetworkConstants,
  testDerivationPath
};

// Export the main test function
export default async function testConstants(): Promise<void> {
  return runAllConstantsTests();
}

// Also export as named function for compatibility
export async function test(): Promise<void> {
  return runAllConstantsTests();
}
