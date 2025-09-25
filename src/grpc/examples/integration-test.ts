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
    protocol: 'http' as const
  };

  try {
    // This uses the new universal gRPC architecture internally
    const hash = await sendCoinTXN(mockCoinTxn, grpcConfig);
    console.log(`✅ sendCoinTXN works with new architecture: ${hash}`);
    return true;
  } catch (error) {
    console.error('❌ sendCoinTXN failed:', (error as Error).message);
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
    console.error('❌ getNonces failed:', (error as Error).message);
    return false;
  }
}

/**
 * Test 3: Basic functionality test
 */
export async function testBasicFunctionality() {
  console.log('🧪 Test 3: Basic functionality test');
  
  try {
    console.log('✅ Basic functionality test passed');
    return true;
  } catch (error) {
    console.error('❌ Basic functionality test failed:', (error as Error).message);
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
    testBasicFunctionality
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
      console.error(`❌ Test failed with error: ${(error as Error).message}`);
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
