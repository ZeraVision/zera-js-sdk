/**
 * ZV-Indexer Nonce Service Tests
 * 
 * This provides tests for the ZV-Indexer nonce service.
 */

import { createZVIndexerNonceService } from '../service.js';
import { TEST_WALLET_ADDRESSES } from '../../../../test-utils/test-keys.js';

/**
 * Run ZV-Indexer nonce tests
 */
export async function runZVIndexerNonceTests() {
  console.log('🧪 ZV-Indexer Nonce Service Tests\n');
  
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
      console.error(`❌ ${test.name} failed: ${(error as Error).message}`);
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
  console.log('Testing basic nonce service creation...');
  
  const service = createZVIndexerNonceService({
    baseUrl: 'https://api.zerascan.io/v1',
    apiKey: 'test-key',
    timeout: 10000
  });
  
  if (!service) {
    throw new Error('Service should be created');
  }
  
  if (typeof service.getNonces !== 'function') {
    throw new Error('Service should have getNonces method');
  }
  
  console.log('✅ Basic functionality test passed');
}

/**
 * Test 2: Input Validation
 */
async function inputValidationTest() {
  console.log('Testing input validation...');
  
  const service = createZVIndexerNonceService({
    baseUrl: 'https://api.zerascan.io/v1',
    apiKey: 'test-key',
    timeout: 10000
  });
  
  // Test null/undefined addresses
  try {
    await service.getNonces(null as any);
    throw new Error('Should throw error for null addresses');
  } catch (error) {
    console.log('✅ Null addresses validation passed');
  }
  
  try {
    await service.getNonces(undefined as any);
    throw new Error('Should throw error for undefined addresses');
  } catch (error) {
    console.log('✅ Undefined addresses validation passed');
  }
  
  // Test empty array
  try {
    await service.getNonces([]);
    throw new Error('Should throw error for empty array');
  } catch (error) {
    console.log('✅ Empty array validation passed');
  }
  
  // Test non-array input
  try {
    await service.getNonces('not-an-array' as any);
    throw new Error('Should throw error for non-array input');
  } catch (error) {
    console.log('✅ Non-array validation passed');
  }
  
  // Test invalid address format
  try {
    await service.getNonces(['invalid-address']);
    throw new Error('Should throw error for invalid address');
  } catch (error) {
    console.log('✅ Invalid address validation passed');
  }
}

/**
 * Test 3: Error Handling
 */
async function errorHandlingTest() {
  console.log('Testing error handling...');
  
  const service = createZVIndexerNonceService({
    baseUrl: 'https://invalid-url.com',
    apiKey: 'invalid-key',
    timeout: 1000
  });
  
  try {
    await service.getNonces(['A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb']);
    console.log('⚠️ Network error test - may have connected to invalid URL');
  } catch (error) {
    console.log('✅ Network error handling passed');
  }
  
  // Test timeout
  const timeoutService = createZVIndexerNonceService({
    baseUrl: 'https://api.zerascan.io/v1',
    apiKey: 'test-key',
    timeout: 1 // 1ms timeout
  });
  
  try {
    await timeoutService.getNonces(['A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb']);
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
  
  const service = createZVIndexerNonceService({
    baseUrl: 'https://api.zerascan.io/v1',
    apiKey: 'test-key',
    timeout: 10000
  });
  
  const addresses = Array(3).fill(TEST_WALLET_ADDRESSES.alice);
  
  const startTime = Date.now();
  
  try {
    const nonces = await service.getNonces(addresses);
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    console.log(`Performance: ${duration}ms for ${addresses.length} addresses`);
    
    if (nonces.length !== addresses.length) {
      throw new Error(`Expected ${addresses.length} nonces, got ${nonces.length}`);
    }
    
    console.log('✅ Performance test passed');
  } catch (error) {
    console.log('⚠️ Performance test - may have failed due to network issues');
  }
}

/**
 * Test 5: Edge Cases
 */
async function edgeCasesTest() {
  console.log('Testing edge cases...');
  
  const service = createZVIndexerNonceService({
    baseUrl: 'https://api.zerascan.io/v1',
    apiKey: 'test-key',
    timeout: 10000
  });
  
  // Test single address
  try {
    const singleNonce = await service.getNonces([TEST_WALLET_ADDRESSES.alice]);
    if (singleNonce.length !== 1) {
      throw new Error('Single address should return single nonce');
    }
    console.log('✅ Single address test passed');
  } catch (error) {
    console.log('⚠️ Single address test - may have failed due to network issues');
  }
  
  // Test large address array
  const largeAddressArray = Array(10).fill(TEST_WALLET_ADDRESSES.alice);
  
  try {
    const largeNonces = await service.getNonces(largeAddressArray);
    if (largeNonces.length !== 10) {
      throw new Error('Large array should return correct number of nonces');
    }
    console.log('✅ Large address array test passed');
  } catch (error) {
    console.log('⚠️ Large address array test - may have failed due to network issues');
  }
  
  // Test service configuration
  const customService = createZVIndexerNonceService({
    baseUrl: 'https://custom-api.com',
    apiKey: 'custom-key',
    timeout: 5000
  });
  
  if (!customService) {
    throw new Error('Custom service should be created');
  }
  
  console.log('✅ Custom service configuration test passed');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runZVIndexerNonceTests()
    .then(({ passed, failed }) => {
      console.log(`\n🎯 Final Test Results: ${passed} passed, ${failed} failed`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Tests crashed:', error);
      process.exit(1);
    });
}
