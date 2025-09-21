/**
 * API Test Suite
 * 
 * This provides comprehensive testing for all API services.
 */

import { runNonceTests } from '../validator/nonce/test/index.js';
import { runZVIndexerNonceTests } from '../zv-indexer/nonce/test/index.js';
import { runRateTests } from '../zv-indexer/rate/test/index.js';

/**
 * Run all API tests
 */
export async function runAllAPITests() {
  console.log('🧪 Running Complete API Test Suite\n');
  
  const testSuites = [
    { name: 'Validator Nonce Service', runner: runNonceTests },
    { name: 'ZV-Indexer Nonce Service', runner: runZVIndexerNonceTests },
    { name: 'ACE Exchange Rate Service', runner: runRateTests }
  ];
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const suite of testSuites) {
    console.log(`\n🔬 Testing ${suite.name}`);
    console.log('='.repeat(50));
    
    try {
      const { passed, failed } = await suite.runner();
      totalPassed += passed;
      totalFailed += failed;
      
      console.log(`✅ ${suite.name}: ${passed} passed, ${failed} failed`);
    } catch (error) {
      console.error(`❌ ${suite.name} crashed: ${error.message}`);
      totalFailed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 API Test Suite Results:`);
  console.log(`   Total Passed: ${totalPassed}`);
  console.log(`   Total Failed: ${totalFailed}`);
  console.log(`   Success Rate: ${totalPassed}/${totalPassed + totalFailed} (${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%)`);
  
  if (totalFailed === 0) {
    console.log('🎉 All API tests passed!');
  } else {
    console.log('⚠️ Some API tests failed - check the logs above');
  }
  
  return { totalPassed, totalFailed };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllAPITests()
    .then(({ totalPassed, totalFailed }) => {
      process.exit(totalFailed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Test suite crashed:', error);
      process.exit(1);
    });
}
