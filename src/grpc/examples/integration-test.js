/**
 * Integration Test for Universal gRPC Architecture
 * 
 * This tests the integration of the new universal gRPC services
 * with existing transaction and nonce functionality.
 */

/**
 * Integration Test for Universal gRPC Architecture
 * 
 * This tests the integration of the new universal gRPC services
 * with existing transaction and nonce functionality.
 */

import { sendCoinTXN } from '../../coin-txn/transaction.js';
import { getNonces } from '../../api/validator/nonce/index.js';
import { createValidatorAPIService } from '../api/validator-api-service.js';
import { createTransactionService } from '../transaction/transaction-service.js';

/**
 * Test 1: sendCoinTXN with new architecture
 */
export async function testSendCoinTXN() {
  console.log('🧪 Test 1: sendCoinTXN with new architecture');
  
  // Mock coin transaction (in real usage, this would be a proper CoinTXN)
  const mockCoinTxn = {
    base: {
      hash: Buffer.from('test-hash-data', 'utf8')
    }
  };

  const grpcConfig = {
    host: 'routing.zerascan.io',
    port: 50052,
    protocol: 'http'
  };

  try {
    // This uses the new universal gRPC architecture internally
    const hash = await sendCoinTXN(mockCoinTxn, grpcConfig);
    console.log(`✅ sendCoinTXN works with new architecture: ${hash}`);
    return true;
  } catch (error) {
    console.error('❌ sendCoinTXN failed:', error.message);
    return false;
  }
}

/**
 * Test 2: getNonces with new architecture
 */
export async function testGetNonces() {
  console.log('🧪 Test 2: getNonces with new architecture');
  
  const addresses = [
    '4Sj3Lzf5rKdgPaYHKSMJPduDcMf7PRtk4BDh2YrV7aJ59bAw65i6UcUnnLGpfMjM8vyGiRHqeZnvCf4ZMrCGjJJL',
    '5KJvsngHeMby884zrh6A5u6b4SqzZzAb'
  ];

  try {
    // This uses the new universal gRPC architecture internally
    const nonces = await getNonces(addresses);
    console.log(`✅ getNonces works with new architecture: ${nonces.length} nonces`);
    return true;
  } catch (error) {
    console.error('❌ getNonces failed:', error.message);
    return false;
  }
}

/**
 * Test 3: Direct service usage
 */
export async function testDirectServiceUsage() {
  console.log('🧪 Test 3: Direct service usage');
  
  try {
    // Test validator API service
    const validatorAPI = createValidatorAPIService({
      host: 'localhost',
      port: 50053
    });
    console.log(`✅ Validator API service created: ${validatorAPI.getBaseUrl()}`);
    
    // Test transaction service
    const transactionService = createTransactionService({
      host: 'routing.zerascan.io',
      port: 50052
    });
    console.log(`✅ Transaction service created: ${transactionService.getBaseUrl()}`);
    
    return true;
  } catch (error) {
    console.error('❌ Direct service usage failed:', error.message);
    return false;
  }
}

/**
 * Test 4: Service configuration updates
 */
export async function testServiceConfiguration() {
  console.log('🧪 Test 4: Service configuration updates');
  
  try {
    const validatorAPI = createValidatorAPIService({
      host: 'localhost',
      port: 50053
    });
    
    console.log(`📡 Initial config: ${validatorAPI.getBaseUrl()}`);
    
    // Update configuration
    validatorAPI.updateConfig({
      host: 'validator.example.com',
      port: 50054,
      protocol: 'https'
    });
    
    console.log(`📡 Updated config: ${validatorAPI.getBaseUrl()}`);
    console.log('✅ Service configuration updates work');
    
    return true;
  } catch (error) {
    console.error('❌ Service configuration failed:', error.message);
    return false;
  }
}

/**
 * Run all integration tests
 */
export async function runIntegrationTests() {
  console.log('🚀 Running Universal gRPC Architecture Integration Tests\n');
  
  const tests = [
    testSendCoinTXN,
    testGetNonces,
    testDirectServiceUsage,
    testServiceConfiguration
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
      console.log('\n' + '='.repeat(50) + '\n');
    } catch (error) {
      console.error(`❌ Test failed with error: ${error.message}`);
      failed++;
      console.log('\n' + '='.repeat(50) + '\n');
    }
  }
  
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All integration tests passed!');
  } else {
    console.log('⚠️ Some tests failed - check the logs above');
  }
  
  return { passed, failed };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests()
    .then(({ passed, failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Integration tests crashed:', error);
      process.exit(1);
    });
}
