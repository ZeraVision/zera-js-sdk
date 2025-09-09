/**
 * Tests for ZERA Public Key Package functionality
 * 
 * This test suite validates:
 * - Package generation with different key types and hash combinations
 * - Package parsing and component extraction
 * - Checksum validation and integrity verification
 * - Error handling for invalid packages
 * - Cross-validation between generation and parsing
 */

import { 
  generateZeraPublicKeyPackage, 
  parseZeraPublicKeyPackage, 
  validatePublicKeyPackage
} from '../shared.js';
import { KEY_TYPE, HASH_TYPE } from '../constants.js';

// Simple assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, but got ${actual}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
  }
}

function assertThrows(fn, expectedMessage) {
  try {
    fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (expectedMessage && !error.message.includes(expectedMessage)) {
      throw new Error(`Expected error message to contain "${expectedMessage}", but got "${error.message}"`);
    }
  }
}

// Test functions for the test runner

export async function testGenerateEd25519PackageWithSingleHash() {
  // Create a mock Ed25519 public key (32 bytes)
  const publicKey = new Uint8Array(32).fill(0x42);
  
  const pkg = generateZeraPublicKeyPackage(publicKey, KEY_TYPE.ED25519, [HASH_TYPE.BLAKE3]);
  
  assert(typeof pkg === 'string', 'Package should be a string');
  assert(pkg.length > 50, 'Base58 encoded should be longer than raw bytes');
  
  // Should be valid base58
  try {
    const bs58 = await import('bs58');
    const decoded = bs58.default.decode(pkg);
    assert(decoded.length > 40, 'Minimum package size should be met');
  } catch (error) {
    throw new Error('Package should be valid base58: ' + error.message);
  }
}

export function testGenerateEd448PackageWithMultipleHashes() {
  // Create a mock Ed448 public key (57 bytes)
  const publicKey = new Uint8Array(57).fill(0x43);
  
  const pkg = generateZeraPublicKeyPackage(publicKey, KEY_TYPE.ED448, [HASH_TYPE.SHA3_512, HASH_TYPE.SHA3_256]);
  
  assert(typeof pkg === 'string', 'Package should be a string');
  assert(pkg.length > 80, 'Ed448 + multiple hashes should be longer');
}

export function testThrowErrorForInvalidKeyType() {
  const publicKey = new Uint8Array(32).fill(0x42);
  
  assertThrows(() => {
    generateZeraPublicKeyPackage(publicKey, 'invalid', [HASH_TYPE.BLAKE3]);
  }, 'Invalid key type');
}

export function testThrowErrorForInvalidHashType() {
  const publicKey = new Uint8Array(32).fill(0x42);
  
  assertThrows(() => {
    generateZeraPublicKeyPackage(publicKey, KEY_TYPE.ED25519, ['invalid']);
  }, 'Invalid hash type');
}

export function testThrowErrorForEmptyHashTypes() {
  const publicKey = new Uint8Array(32).fill(0x42);
  
  assertThrows(() => {
    generateZeraPublicKeyPackage(publicKey, KEY_TYPE.ED25519, []);
  }, 'Hash types must be a non-empty array');
}

export function testParseEd25519PackageCorrectly() {
  const publicKey = new Uint8Array(32).fill(0x42);
  const originalPackage = generateZeraPublicKeyPackage(publicKey, KEY_TYPE.ED25519, [HASH_TYPE.BLAKE3]);
  
  const parsed = parseZeraPublicKeyPackage(originalPackage);
  
  assert(parsed.hasOwnProperty('version'), 'Should have version property');
  assertEqual(parsed.keyTypePrefix, 'A_', 'Should have correct key type prefix');
  assertEqual(parsed.hashTypePrefix, 'c_', 'Should have correct hash type prefix');
  assert(parsed.hasOwnProperty('publicKey'), 'Should have publicKey property');
  assert(parsed.hasOwnProperty('checksum'), 'Should have checksum property');
  assertEqual(parsed.isValid, true, 'Should be valid');
  assertEqual(parsed.keyType, 'ed25519', 'Should have correct key type');
  assertDeepEqual(parsed.hashTypes, ['blake3'], 'Should have correct hash types');
  
  // Verify public key matches
  assertDeepEqual(parsed.publicKey, publicKey, 'Public key should match');
}

export function testParseEd448PackageWithMultipleHashesCorrectly() {
  const publicKey = new Uint8Array(57).fill(0x43);
  const originalPackage = generateZeraPublicKeyPackage(publicKey, KEY_TYPE.ED448, [HASH_TYPE.SHA3_512, HASH_TYPE.SHA3_256]);
  
  const parsed = parseZeraPublicKeyPackage(originalPackage);
  
  assertEqual(parsed.keyTypePrefix, 'B_', 'Should have correct key type prefix');
  assertEqual(parsed.hashTypePrefix, 'b_a_', 'Should have correct hash type prefix'); // SHA3-512 + SHA3-256
  assertEqual(parsed.keyType, 'ed448', 'Should have correct key type');
  assertDeepEqual(parsed.hashTypes, ['sha3-512', 'sha3-256'], 'Should have correct hash types');
  assertEqual(parsed.isValid, true, 'Should be valid');
  
  // Verify public key matches
  assertDeepEqual(parsed.publicKey, publicKey, 'Public key should match');
}

export function testDetectInvalidChecksum() {
  const publicKey = new Uint8Array(32).fill(0x42);
  const originalPackage = generateZeraPublicKeyPackage(publicKey, KEY_TYPE.ED25519, [HASH_TYPE.BLAKE3]);
  
  // Corrupt the package by changing the last character
  const corruptedPackage = originalPackage.slice(0, -1) + 'X';
  
  const parsed = parseZeraPublicKeyPackage(corruptedPackage);
  assertEqual(parsed.isValid, false, 'Should detect invalid checksum');
}

export function testThrowErrorForInvalidPackageFormat() {
  assertThrows(() => {
    parseZeraPublicKeyPackage('invalid');
  }, 'Failed to parse public key package');
}

export function testThrowErrorForPackageTooShort() {
  assertThrows(() => {
    parseZeraPublicKeyPackage('short');
  }, 'Invalid package length');
}

export function testValidateCorrectPackage() {
  const publicKey = new Uint8Array(32).fill(0x42);
  const pkg = generateZeraPublicKeyPackage(publicKey, KEY_TYPE.ED25519, [HASH_TYPE.BLAKE3]);
  
  assertEqual(validatePublicKeyPackage(pkg), true, 'Should validate correct package');
}

export function testRejectInvalidPackage() {
  assertEqual(validatePublicKeyPackage('invalid'), false, 'Should reject invalid package');
  assertEqual(validatePublicKeyPackage(''), false, 'Should reject empty package');
  assertEqual(validatePublicKeyPackage(null), false, 'Should reject null package');
  assertEqual(validatePublicKeyPackage(undefined), false, 'Should reject undefined package');
}

export function testRejectPackageWithCorruptedChecksum() {
  const publicKey = new Uint8Array(32).fill(0x42);
  const originalPackage = generateZeraPublicKeyPackage(publicKey, KEY_TYPE.ED25519, [HASH_TYPE.BLAKE3]);
  
  const corruptedPackage = originalPackage.slice(0, -1) + 'X';
  assertEqual(validatePublicKeyPackage(corruptedPackage), false, 'Should reject corrupted package');
}

export function testGenerateAndParsePackagesConsistently() {
  const testCases = [
    { keyType: KEY_TYPE.ED25519, hashTypes: [HASH_TYPE.BLAKE3] },
    { keyType: KEY_TYPE.ED25519, hashTypes: [HASH_TYPE.SHA3_256] },
    { keyType: KEY_TYPE.ED25519, hashTypes: [HASH_TYPE.SHA3_512] },
    { keyType: KEY_TYPE.ED448, hashTypes: [HASH_TYPE.BLAKE3] },
    { keyType: KEY_TYPE.ED448, hashTypes: [HASH_TYPE.SHA3_256, HASH_TYPE.SHA3_512] },
    { keyType: KEY_TYPE.ED25519, hashTypes: [HASH_TYPE.SHA3_512, HASH_TYPE.BLAKE3] }
  ];

  testCases.forEach(({ keyType, hashTypes }) => {
    const keyLength = keyType === KEY_TYPE.ED25519 ? 32 : 57;
    const publicKey = new Uint8Array(keyLength).fill(Math.floor(Math.random() * 256));
    
    const pkg = generateZeraPublicKeyPackage(publicKey, keyType, hashTypes);
    const parsed = parseZeraPublicKeyPackage(pkg);
    
    // Verify all components match
    assertDeepEqual(parsed.publicKey, publicKey, 'Public key should match');
    assertEqual(parsed.keyType, keyType.toLowerCase(), 'Key type should match');
    assertDeepEqual(parsed.hashTypes, hashTypes.map(h => h.toLowerCase().replace('_', '-')), 'Hash types should match');
    assertEqual(parsed.isValid, true, 'Package should be valid');
  });
}

export function testMaintainPackageIntegrityAcrossMultipleParseOperations() {
  const publicKey = new Uint8Array(32).fill(0x42);
  const pkg = generateZeraPublicKeyPackage(publicKey, KEY_TYPE.ED25519, [HASH_TYPE.BLAKE3]);
  
  // Parse multiple times
  const parsed1 = parseZeraPublicKeyPackage(pkg);
  const parsed2 = parseZeraPublicKeyPackage(pkg);
  
  assertDeepEqual(parsed1, parsed2, 'Parsed results should be identical');
  assertEqual(parsed1.isValid, true, 'First parse should be valid');
  assertEqual(parsed2.isValid, true, 'Second parse should be valid');
}

export function testHaveCorrectPackageLengthForEd25519() {
  const publicKey = new Uint8Array(32).fill(0x42);
  const pkg = generateZeraPublicKeyPackage(publicKey, KEY_TYPE.ED25519, [HASH_TYPE.BLAKE3]);
  
  const parsed = parseZeraPublicKeyPackage(pkg);
  
  // Ed25519: version(1) + keyPrefix(2) + hashPrefix(2) + publicKey(32) = 37 bytes data, 41 bytes total
  assertEqual(parsed.dataLength, 37, 'Should have correct data length for Ed25519');
  assertEqual(parsed.packageLength, 41, 'Should have correct package length for Ed25519'); // +4 for checksum
}

export function testHaveCorrectPackageLengthForEd448() {
  const publicKey = new Uint8Array(57).fill(0x43);
  const pkg = generateZeraPublicKeyPackage(publicKey, KEY_TYPE.ED448, [HASH_TYPE.SHA3_512]);
  
  const parsed = parseZeraPublicKeyPackage(pkg);
  
  // Ed448: version(1) + keyPrefix(2) + hashPrefix(2) + publicKey(57) = 62 bytes data, 66 bytes total
  assertEqual(parsed.dataLength, 62, 'Should have correct data length for Ed448');
  assertEqual(parsed.packageLength, 66, 'Should have correct package length for Ed448'); // +4 for checksum
}

export function testHandleMultipleHashTypesCorrectly() {
  const publicKey = new Uint8Array(32).fill(0x42);
  const pkg = generateZeraPublicKeyPackage(publicKey, KEY_TYPE.ED25519, [HASH_TYPE.SHA3_512, HASH_TYPE.SHA3_256]);
  
  const parsed = parseZeraPublicKeyPackage(pkg);
  
  // Multiple hashes: version(1) + keyPrefix(2) + hashPrefix(4) + publicKey(32) = 39 bytes data, 43 bytes total
  assertEqual(parsed.dataLength, 39, 'Should have correct data length for multiple hashes');
  assertEqual(parsed.hashTypePrefix, 'b_a_', 'Should have correct hash type prefix'); // SHA3-512 + SHA3-256
}

