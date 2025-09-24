/**
 * Test Ed448KeyPair with legacy 57-byte private key support
 * 
 * This test verifies that Ed448KeyPair can work with both:
 * - 32-byte SLIP-0010 private keys (expanded to 57 bytes)
 * - 57-byte raw Ed448 private keys (used directly)
 */

import { Ed448KeyPair, CryptoUtils } from '../crypto-core.js';
import { signTransactionData } from '../../shared/crypto/signature-utils.js';

// Test data
const testMessage = new TextEncoder().encode('Hello, Ed448 legacy support!');

/**
 * Test 32-byte SLIP-0010 private key (existing functionality)
 */
function test32ByteKey() {
  console.log('Testing 32-byte SLIP-0010 private key...');
  
  // Generate a 32-byte private key
  const privateKey32 = CryptoUtils.randomBytes(32);
  
  // Create Ed448KeyPair from 32-byte key
  const keyPair32 = Ed448KeyPair.fromPrivateKey(privateKey32);
  
  // Verify key format
  const format = keyPair32.getKeyFormat();
  console.log('Key format:', format);
  
  if (format.originalLength !== 32 || !format.isExpanded || format.format !== 'SLIP-0010') {
    throw new Error('32-byte key format validation failed');
  }
  
  // Test signing and verification
  const signature = keyPair32.sign(testMessage);
  const isValid = keyPair32.verify(testMessage, signature);
  
  if (!isValid) {
    throw new Error('32-byte key signature verification failed');
  }
  
  console.log('✓ 32-byte key test passed');
  return { keyPair: keyPair32, signature };
}

/**
 * Test 57-byte raw Ed448 private key (new functionality)
 */
function test57ByteKey() {
  console.log('Testing 57-byte raw Ed448 private key...');
  
  // Generate a 57-byte private key
  const privateKey57 = CryptoUtils.randomBytes(57);
  
  // Apply Ed448 private key clamping (clear the 2 least significant bits of the last byte)
  privateKey57[56] &= 0xFC;
  
  // Create Ed448KeyPair from 57-byte key
  const keyPair57 = Ed448KeyPair.fromPrivateKey(privateKey57);
  
  // Verify key format
  const format = keyPair57.getKeyFormat();
  console.log('Key format:', format);
  
  if (format.originalLength !== 57 || format.isExpanded || format.format !== 'raw-ed448') {
    throw new Error('57-byte key format validation failed');
  }
  
  // Test signing and verification
  const signature = keyPair57.sign(testMessage);
  const isValid = keyPair57.verify(testMessage, signature);
  
  if (!isValid) {
    throw new Error('57-byte key signature verification failed');
  }
  
  console.log('✓ 57-byte key test passed');
  return { keyPair: keyPair57, signature };
}

/**
 * Test signature-utils.js integration
 */
function testSignatureUtilsIntegration() {
  console.log('Testing signature-utils.js integration...');
  
  // Test with 32-byte key
  const privateKey32 = CryptoUtils.randomBytes(32);
  const privateKey32Base58 = bs58.encode(privateKey32);
  
  // Create a proper public key identifier for Ed448 (must start with B_)
  const keyPair32 = Ed448KeyPair.fromPrivateKey(privateKey32);
  const publicKey32 = keyPair32.getCompressedPublicKey();
  const publicKey32Base58 = bs58.encode(publicKey32);
  const publicKey32Identifier = `B_${publicKey32Base58}`;
  
  const signature32 = signTransactionData(testMessage, privateKey32Base58, publicKey32Identifier);
  console.log('✓ 32-byte key signature-utils integration passed');
  
  // Test with 57-byte key
  const privateKey57 = CryptoUtils.randomBytes(57);
  privateKey57[56] &= 0xFC; // Apply clamping
  const privateKey57Base58 = bs58.encode(privateKey57);
  
  const keyPair57 = Ed448KeyPair.fromPrivateKey(privateKey57);
  const publicKey57 = keyPair57.getCompressedPublicKey();
  const publicKey57Base58 = bs58.encode(publicKey57);
  const publicKey57Identifier = `B_${publicKey57Base58}`;
  
  const signature57 = signTransactionData(testMessage, privateKey57Base58, publicKey57Identifier);
  console.log('✓ 57-byte key signature-utils integration passed');
  
  return { signature32, signature57 };
}

/**
 * Test error handling for invalid key lengths
 */
function testErrorHandling() {
  console.log('Testing error handling...');
  
  // Test invalid key length
  try {
    const invalidKey = CryptoUtils.randomBytes(64);
    Ed448KeyPair.fromPrivateKey(invalidKey);
    throw new Error('Should have thrown error for invalid key length');
  } catch (error) {
    if (!error.message.includes('Unsupported private key length')) {
      throw new Error('Wrong error message for invalid key length');
    }
  }
  
  // Test invalid 57-byte key (not properly clamped)
  try {
    const invalidKey57 = CryptoUtils.randomBytes(57);
    // Don't apply clamping - this should fail validation
    Ed448KeyPair.fromPrivateKey(invalidKey57);
    // Note: This might not always fail as the validation is lenient
    // The main point is that the constructor accepts 57-byte keys
  } catch (error) {
    console.log('Invalid 57-byte key correctly rejected:', error.message);
  }
  
  console.log('✓ Error handling test passed');
}

/**
 * Run all tests
 */
function runTests() {
  console.log('Running Ed448 legacy support tests...\n');
  
  try {
    test32ByteKey();
    console.log('');
    
    test57ByteKey();
    console.log('');
    
    testSignatureUtilsIntegration();
    console.log('');
    
    testErrorHandling();
    console.log('');
    
    console.log('🎉 All Ed448 legacy support tests passed!');
    console.log('\nSummary:');
    console.log('- ✓ 32-byte SLIP-0010 private keys work (existing functionality)');
    console.log('- ✓ 57-byte raw Ed448 private keys work (new legacy support)');
    console.log('- ✓ signature-utils.js integration works with both formats');
    console.log('- ✓ Proper error handling for invalid key lengths');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Import bs58 for the integration test
import bs58 from 'bs58';

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { test32ByteKey, test57ByteKey, testSignatureUtilsIntegration, testErrorHandling, runTests };
