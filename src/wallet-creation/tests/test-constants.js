import { assert } from '../../test-utils/index.js';
import { 
  SUPPORTED_KEY_TYPES, 
  ZERA_COIN_TYPE,
  ZERA_COIN_TYPE_HEX,
  ZERA_SYMBOL,
  ZERA_NAME,
  DERIVATION_PATH,
  ADDRESS_VERSIONS,
  MIN_ADDRESS_LENGTH
} from '../constants.js';

/**
 * Test constants module
 */
export default async function testConstants() {
  console.log('🧪 Testing Constants Module');
  
  // Test 1: SUPPORTED_KEY_TYPES
  assert.ok(Array.isArray(SUPPORTED_KEY_TYPES), 'SUPPORTED_KEY_TYPES should be an array');
  assert.ok(SUPPORTED_KEY_TYPES.includes('ed25519'), 'SUPPORTED_KEY_TYPES should include ed25519');
  assert.ok(SUPPORTED_KEY_TYPES.includes('ed448'), 'SUPPORTED_KEY_TYPES should include ed448');
  assert.equal(SUPPORTED_KEY_TYPES.length, 2, 'SUPPORTED_KEY_TYPES should have 2 elements');
  
  // Test 2: ZERA Network constants
  assert.equal(ZERA_COIN_TYPE, 1110, 'ZERA_COIN_TYPE should be 1110');
  assert.equal(ZERA_COIN_TYPE_HEX, '0x80000456', 'ZERA_COIN_TYPE_HEX should be 0x80000456');
  assert.equal(ZERA_SYMBOL, 'ZRA', 'ZERA_SYMBOL should be ZRA');
  assert.equal(ZERA_NAME, 'ZERA', 'ZERA_NAME should be ZRA');
  
  // Test 3: Derivation path
  assert.equal(DERIVATION_PATH, 'm/44\'/1110\'/0\'/0/0', 'DERIVATION_PATH should be correct');
  
  // Test 4: Address versions
  assert.equal(ADDRESS_VERSIONS.ed25519, 0x1a, 'ed25519 address version should be 0x1a');
  assert.equal(ADDRESS_VERSIONS.ed448, 0x1b, 'ed448 address version should be 0x1b');
  
  // Test 5: Address validation constants
  assert.equal(MIN_ADDRESS_LENGTH, 25, 'MIN_ADDRESS_LENGTH should be 25');
  
  console.log('✅ All constants tests passed');
}

// Also export as named function for compatibility
export async function test() {
  return testConstants();
}
