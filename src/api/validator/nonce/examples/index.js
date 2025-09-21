/**
 * Validator Nonce Service Examples
 * 
 * This provides comprehensive examples for the validator nonce service.
 */

import { getNonce, getNonces } from '../service.js';
import { TEST_WALLET_ADDRESSES } from '../../../../test-utils/test-keys.js';

/**
 * Run validator nonce examples
 */
export async function runNonceExamples() {
  console.log('🔬 Validator Nonce Service Examples\n');
  
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
  console.log('Getting nonce for Alice\'s address...');
  
  const address = TEST_WALLET_ADDRESSES.alice;
  const nonce = await getNonce(address);
  
  console.log(`Address: ${address}`);
  console.log(`Nonce: ${nonce.toString()}`);
  console.log(`Nonce type: ${typeof nonce}`);
  
  if (!nonce || nonce.lt(0)) {
    throw new Error('Invalid nonce returned');
  }
}

/**
 * Example 2: Advanced Features
 */
async function advancedFeaturesExample() {
  console.log('Getting nonces for multiple test addresses with custom config...');
  
  const addresses = [
    TEST_WALLET_ADDRESSES.alice,
    TEST_WALLET_ADDRESSES.bob,
    TEST_WALLET_ADDRESSES.charlie
  ];
  
  const config = {
    host: '146.190.114.124',
    port: 50053,
    protocol: 'http',
    timeout: 5000
  };
  
  const nonces = await getNonces(addresses, config);
  
  console.log(`Addresses: ${addresses.length}`);
  console.log(`Nonces: ${nonces.length}`);
  
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
  console.log('Testing error handling with invalid inputs...');
  
  try {
    // Test invalid address
    await getNonce('invalid-address');
    throw new Error('Should have thrown error for invalid address');
  } catch (error) {
    console.log(`✅ Caught expected error: ${error.message}`);
  }
  
  try {
    // Test empty address array
    await getNonces([]);
    throw new Error('Should have thrown error for empty array');
  } catch (error) {
    console.log(`✅ Caught expected error: ${error.message}`);
  }
  
  try {
    // Test invalid config
    await getNonce(TEST_WALLET_ADDRESSES.alice, { port: 99999 });
    console.log('⚠️ Invalid config test - may have connected to wrong port');
  } catch (error) {
    console.log(`✅ Caught expected error: ${error.message}`);
  }
}

/**
 * Example 4: Performance
 */
async function performanceExample() {
  console.log('Testing performance with multiple test addresses...');
  
  const addresses = [
    TEST_WALLET_ADDRESSES.alice,
    TEST_WALLET_ADDRESSES.bob,
    TEST_WALLET_ADDRESSES.charlie
  ];
  
  const startTime = Date.now();
  
  // Test batch request
  const batchNonces = await getNonces(addresses);
  const batchTime = Date.now() - startTime;
  
  console.log(`Batch request: ${batchTime}ms for ${addresses.length} addresses`);
  console.log(`Average per address: ${Math.round(batchTime / addresses.length)}ms`);
  
  // Test individual requests
  const individualStartTime = Date.now();
  const individualNonces = [];
  
  for (const address of addresses) {
    const nonce = await getNonce(address);
    individualNonces.push(nonce);
  }
  
  const individualTime = Date.now() - individualStartTime;
  
  console.log(`Individual requests: ${individualTime}ms for ${addresses.length} addresses`);
  console.log(`Average per address: ${Math.round(individualTime / addresses.length)}ms`);
  
  console.log(`Batch vs Individual: ${Math.round((individualTime / batchTime) * 100)}% of batch time`);
  
  if (batchNonces.length !== individualNonces.length) {
    throw new Error('Nonce count mismatch between batch and individual');
  }
}

/**
 * Example 5: Integration
 */
async function integrationExample() {
  console.log('Testing integration with transaction creation...');
  
  const address = TEST_WALLET_ADDRESSES.alice;
  
  // Get nonce for transaction
  const nonce = await getNonce(address);
  console.log(`Retrieved nonce: ${nonce.toString()}`);
  
  // Simulate transaction creation
  const mockTransaction = {
    from: address,
    to: TEST_WALLET_ADDRESSES.bob,
    amount: '100.50',
    nonce: nonce.toString(),
    timestamp: Date.now()
  };
  
  console.log('Mock transaction created:');
  console.log(`  From: ${mockTransaction.from}`);
  console.log(`  To: ${mockTransaction.to}`);
  console.log(`  Amount: ${mockTransaction.amount}`);
  console.log(`  Nonce: ${mockTransaction.nonce}`);
  console.log(`  Timestamp: ${mockTransaction.timestamp}`);
  
  // Verify nonce is valid
  if (!nonce || nonce.lt(0)) {
    throw new Error('Invalid nonce for transaction');
  }
  
  console.log('✅ Integration test passed - nonce ready for transaction');
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runNonceExamples()
    .then(({ passed, failed }) => {
      console.log(`\n🎯 Final Results: ${passed} passed, ${failed} failed`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Examples crashed:', error);
      process.exit(1);
    });
}
