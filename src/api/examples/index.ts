/**
 * API Examples Showcase
 * 
 * This provides examples for all API services.
 */

import { runNonceExamples } from '../validator/nonce/examples/index.js';
import { runZVIndexerNonceExamples } from '../zv-indexer/nonce/examples/index.js';
import { runRateExamples } from '../zv-indexer/rate/examples/index.js';
import { runRateHandlerExamples } from '../handler/rate/examples/index.js';

/**
 * Run all API examples
 */
export async function runAllAPIExamples(): Promise<{ totalPassed: number; totalFailed: number }> {
  console.log('🚀 Running Complete API Examples Showcase\n');
  
  const exampleSuites = [
    { name: 'Validator Nonce Service', runner: runNonceExamples },
    { name: 'ZV-Indexer Nonce Service', runner: runZVIndexerNonceExamples },
    { name: 'ZV-Indexer Rate Service', runner: runRateExamples },
    { name: 'Rate Handler Service', runner: runRateHandlerExamples }
  ];
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const suite of exampleSuites) {
    console.log(`\n📚 ${suite.name} Examples`);
    console.log('='.repeat(50));
    
    try {
      const { passed, failed } = await suite.runner();
      totalPassed += passed;
      totalFailed += failed;
      
      console.log(`✅ ${suite.name}: ${passed} examples passed, ${failed} failed`);
    } catch (error) {
      console.error(`❌ ${suite.name} examples crashed: ${(error as Error).message}`);
      totalFailed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 API Examples Showcase Results:`);
  console.log(`   Total Passed: ${totalPassed}`);
  console.log(`   Total Failed: ${totalFailed}`);
  console.log(`   Success Rate: ${totalPassed}/${totalPassed + totalFailed} (${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%)`);
  
  if (totalFailed === 0) {
    console.log('🎉 All API examples passed!');
  } else {
    console.log('⚠️ Some API examples failed - check the logs above');
  }
  
  return { totalPassed, totalFailed };
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllAPIExamples()
    .then(({ totalPassed, totalFailed }) => {
      process.exit(totalFailed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Examples showcase crashed:', error);
      process.exit(1);
    });
}
