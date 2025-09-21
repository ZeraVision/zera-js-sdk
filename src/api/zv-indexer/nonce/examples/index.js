/**
 * ZV-Indexer Nonce Service Examples
 * 
 * This provides comprehensive examples for the ZV-Indexer nonce service.
 */

import { createZVIndexerNonceService } from '../service.js';
import { TEST_WALLET_ADDRESSES } from '../../../../test-utils/test-keys.js';

/**
 * Run ZV-Indexer nonce examples
 */
export async function runZVIndexerNonceExamples() {
  console.log('🔬 ZV-Indexer Nonce Service Examples\n');
  
  const examples = [
    { name: 'Basic Usage', runner: basicUsageExample },
    { name: 'Advanced Features', runner: advancedFeaturesExample },
    { name: 'Error Handling', runner: errorHandlingExample },
    { name: 'Performance', runner: performanceExample },
    { name: 'Integration', runner: integrationExample }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const example of examples) {
    console.log(`\n📚 ${example.name}`);
    console.log('-'.repeat(40));
    
    try {
      await example.runner();
      console.log(`✅ ${example.name} passed`);
      passed++;
    } catch (error) {
      console.error(`❌ ${example.name} failed: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

/**
 * Example 1: Basic Usage
 */
async function basicUsageExample() {
  console.log('Creating ZV-Indexer nonce service for Alice...');
  
  const service = createZVIndexerNonceService({
    baseUrl: 'https://api.zerascan.io/v1',
    apiKey: 'your-api-key',
    timeout: 10000
  });
  
  const addresses = [TEST_WALLET_ADDRESSES.alice];
  const nonces = await service.getNonces(addresses);
  
  console.log(`Addresses: ${addresses.length}`);
  console.log(`Nonces: ${nonces.length}`);
  console.log(`First nonce: ${nonces[0].toString()}`);
  
  if (!nonces[0] || nonces[0].lt(0)) {
    throw new Error('Invalid nonce returned');
  }
}

/**
 * Example 2: Advanced Features
 */
async function advancedFeaturesExample() {
  console.log('Testing advanced features with test addresses...');
  
  const service = createZVIndexerNonceService({
    baseUrl: 'https://api.zerascan.io/v1',
    apiKey: 'your-api-key',
    timeout: 5000,
    retries: 3
  });
  
  const addresses = [
    TEST_WALLET_ADDRESSES.alice,
    TEST_WALLET_ADDRESSES.bob,
    TEST_WALLET_ADDRESSES.charlie
  ];
  
  const nonces = await service.getNonces(addresses);
  
  console.log(`Batch request for ${addresses.length} addresses`);
  for (let i = 0; i < addresses.length; i++) {
    console.log(`  ${addresses[i]} → ${nonces[i].toString()}`);
  }
  
  if (nonces.length !== addresses.length) {
    throw new Error('Nonce count mismatch');
  }
}

/**
 * Example 3: Error Handling
 */
async function errorHandlingExample() {
  console.log('Testing error handling...');
  
  const service = createZVIndexerNonceService({
    baseUrl: 'https://invalid-url.com',
    apiKey: 'invalid-key',
    timeout: 1000
  });
  
  try {
    await service.getNonces([TEST_WALLET_ADDRESSES.alice]);
    console.log('⚠️ Error handling test - may have connected to invalid URL');
  } catch (error) {
    console.log(`✅ Caught expected error: ${error.message}`);
  }
  
  try {
    await service.getNonces([]);
    throw new Error('Should have thrown error for empty array');
  } catch (error) {
    console.log(`✅ Caught expected error: ${error.message}`);
  }
}

/**
 * Example 4: Performance
 */
async function performanceExample() {
  console.log('Testing performance with test addresses...');
  
  const service = createZVIndexerNonceService({
    baseUrl: 'https://api.zerascan.io/v1',
    apiKey: 'your-api-key',
    timeout: 10000
  });
  
  const addresses = Array(5).fill(TEST_WALLET_ADDRESSES.alice);
  
  const startTime = Date.now();
  const nonces = await service.getNonces(addresses);
  const endTime = Date.now();
  
  const duration = endTime - startTime;
  console.log(`Performance: ${duration}ms for ${addresses.length} addresses`);
  console.log(`Average per address: ${Math.round(duration / addresses.length)}ms`);
  
  if (nonces.length !== addresses.length) {
    throw new Error('Nonce count mismatch');
  }
}

/**
 * Example 5: Integration
 */
async function integrationExample() {
  console.log('Testing integration with test addresses...');
  
  const service = createZVIndexerNonceService({
    baseUrl: 'https://api.zerascan.io/v1',
    apiKey: 'your-api-key',
    timeout: 10000
  });
  
  const address = TEST_WALLET_ADDRESSES.alice;
  const nonces = await service.getNonces([address]);
  
  console.log(`Retrieved nonce: ${nonces[0].toString()}`);
  
  // Simulate transaction creation
  const mockTransaction = {
    from: address,
    to: TEST_WALLET_ADDRESSES.bob,
    amount: '100.50',
    nonce: nonces[0].toString(),
    timestamp: Date.now()
  };
  
  console.log('Mock transaction created:');
  console.log(`  From: ${mockTransaction.from}`);
  console.log(`  To: ${mockTransaction.to}`);
  console.log(`  Amount: ${mockTransaction.amount}`);
  console.log(`  Nonce: ${mockTransaction.nonce}`);
  
  if (!nonces[0] || nonces[0].lt(0)) {
    throw new Error('Invalid nonce for transaction');
  }
  
  console.log('✅ Integration test passed');
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runZVIndexerNonceExamples()
    .then(({ passed, failed }) => {
      console.log(`\n🎯 Final Results: ${passed} passed, ${failed} failed`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Examples crashed:', error);
      process.exit(1);
    });
}
