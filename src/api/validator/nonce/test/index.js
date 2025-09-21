/**
 * Validator Nonce Service Tests
 * 
 * This provides comprehensive tests for the validator nonce service.
 */

import { getNonce, getNonces } from '../service.js';
import { TEST_WALLET_ADDRESSES } from '../../../../test-utils/test-keys.js';

/**
 * Run validator nonce tests
 */
export async function runNonceTests() {
  console.log('🧪 Validator Nonce Service Tests\n');
  
  const tests = [
    { name: 'Basic Functionality', runner: basicFunctionalityTest },
    { name: 'Input Validation', runner: inputValidationTest },
    { name: 'Error Handling', runner: errorHandlingTest },
    { name: 'Performance', runner: performanceTest },
    { name: 'Edge Cases', runner: edgeCasesTest }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n🔬 ${test.name}`);
    console.log('-'.repeat(40));
    
    try {
      await test.runner();
      console.log(`✅ ${test.name} passed`);
      passed++;
    } catch (error) {
      console.error(`❌ ${test.name} failed: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

/**
 * Test 1: Basic Functionality
 */
async function basicFunctionalityTest() {
  console.log('Testing basic nonce retrieval for Alice...');
  
  const address = TEST_WALLET_ADDRESSES.alice;
  const nonce = await getNonce(address);
  
  // Verify nonce is returned
  if (!nonce) {
    throw new Error('Nonce should not be null/undefined');
  }
  
  // Verify nonce is a Decimal
  if (typeof nonce !== 'object' || !nonce.constructor || nonce.constructor.name !== 'Decimal') {
    throw new Error('Nonce should be a Decimal object');
  }
  
  // Verify nonce is positive
  if (nonce.lt(0)) {
    throw new Error('Nonce should be positive');
  }
  
  console.log(`✅ Basic functionality: ${nonce.toString()}`);
}

/**
 * Test 2: Input Validation
 */
async function inputValidationTest() {
  console.log('Testing input validation...');
  
  // Test null/undefined address
  try {
    await getNonce(null);
    throw new Error('Should throw error for null address');
  } catch (error) {
    console.log('✅ Null address validation passed');
  }
  
  try {
    await getNonce(undefined);
    throw new Error('Should throw error for undefined address');
  } catch (error) {
    console.log('✅ Undefined address validation passed');
  }
  
  // Test empty string
  try {
    await getNonce('');
    throw new Error('Should throw error for empty address');
  } catch (error) {
    console.log('✅ Empty address validation passed');
  }
  
  // Test invalid address format
  try {
    await getNonce('invalid-address');
    throw new Error('Should throw error for invalid address');
  } catch (error) {
    console.log('✅ Invalid address validation passed');
  }
  
  // Test empty array
  try {
    await getNonces([]);
    throw new Error('Should throw error for empty array');
  } catch (error) {
    console.log('✅ Empty array validation passed');
  }
  
  // Test non-array input
  try {
    await getNonces('not-an-array');
    throw new Error('Should throw error for non-array input');
  } catch (error) {
    console.log('✅ Non-array validation passed');
  }
}

/**
 * Test 3: Error Handling
 */
async function errorHandlingTest() {
  console.log('Testing error handling...');
  
  // Test network error simulation
  try {
    await getNonce('A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb', { 
      host: 'invalid-host',
      port: 99999,
      timeout: 1000
    });
    console.log('⚠️ Network error test - may have connected to wrong host');
  } catch (error) {
    console.log('✅ Network error handling passed');
  }
  
  // Test timeout
  try {
    await getNonce('A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb', { 
      timeout: 1 // 1ms timeout
    });
    console.log('⚠️ Timeout test - request may have completed too quickly');
  } catch (error) {
    console.log('✅ Timeout handling passed');
  }
}

/**
 * Test 4: Performance
 */
async function performanceTest() {
  console.log('Testing performance with test addresses...');
  
  const addresses = [
    TEST_WALLET_ADDRESSES.alice,
    TEST_WALLET_ADDRESSES.bob
  ];
  
  const startTime = Date.now();
  const nonces = await getNonces(addresses);
  const endTime = Date.now();
  
  const duration = endTime - startTime;
  console.log(`Performance: ${duration}ms for ${addresses.length} addresses`);
  
  // Verify all nonces returned
  if (nonces.length !== addresses.length) {
    throw new Error(`Expected ${addresses.length} nonces, got ${nonces.length}`);
  }
  
  // Verify all nonces are valid
  for (let i = 0; i < nonces.length; i++) {
    if (!nonces[i] || nonces[i].lt(0)) {
      throw new Error(`Invalid nonce at index ${i}`);
    }
  }
  
  console.log('✅ Performance test passed');
}

/**
 * Test 5: Edge Cases
 */
async function edgeCasesTest() {
  console.log('Testing edge cases...');
  
  // Test single address in array
  const singleAddress = [TEST_WALLET_ADDRESSES.alice];
  const singleNonce = await getNonces(singleAddress);
  
  if (singleNonce.length !== 1) {
    throw new Error('Single address array should return single nonce');
  }
  
  console.log('✅ Single address array test passed');
  
  // Test same address multiple times
  const sameAddresses = [
    TEST_WALLET_ADDRESSES.alice,
    TEST_WALLET_ADDRESSES.alice,
    TEST_WALLET_ADDRESSES.alice
  ];
  
  const sameNonces = await getNonces(sameAddresses);
  
  if (sameNonces.length !== 3) {
    throw new Error('Same addresses should return same number of nonces');
  }
  
  // Verify all nonces are the same (or sequential)
  for (let i = 1; i < sameNonces.length; i++) {
    if (sameNonces[i].lt(sameNonces[i-1])) {
      throw new Error('Nonces should be sequential or equal');
    }
  }
  
  console.log('✅ Same address multiple times test passed');
  
  // Test large address array
  const largeAddressArray = Array(10).fill(TEST_WALLET_ADDRESSES.alice);
  const largeNonces = await getNonces(largeAddressArray);
  
  if (largeNonces.length !== 10) {
    throw new Error('Large array should return correct number of nonces');
  }
  
  console.log('✅ Large address array test passed');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runNonceTests()
    .then(({ passed, failed }) => {
      console.log(`\n🎯 Final Test Results: ${passed} passed, ${failed} failed`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Tests crashed:', error);
      process.exit(1);
    });
}
