/**
 * Debug Exchange Rate Calls
 * Test to see how many API calls are being made
 */

import { createCoinTXN } from '../transaction.js';
import { createTestInput, getTestOutput } from '../../test-utils/test-keys.js';

/**
 * Test to debug exchange rate API calls
 */
export async function testDebugExchangeRateCalls() {
  console.log('🔍 Debugging Exchange Rate API Calls');
  
  try {
    // Simple test case
    const inputs = [
      createTestInput('ED25519', 'alice', '10.0', '100')
    ];
    
    const outputs = [
      getTestOutput('bob', '5.0', 'Test payment')
    ];
    
    console.log('📊 Creating transaction with automatic fees...');
    
    const startTime = Date.now();
    
    // Create transaction with automatic fees (this should trigger fee calculations)
    const result = await createCoinTXN(inputs, outputs, '$ZRA+0000', {
      baseFeeId: '$ZRA+0000',
      contractFeeId: '$ZRA+0000'
      // No explicit fees - should trigger automatic calculation
    }, 'Debug test');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Transaction created in ${duration}ms`);
    console.log(`💰 Base fee: ${result.baseFeeAmount} ${result.baseFeeId}`);
    console.log(`💰 Contract fee: ${result.contractFeeAmount} ${result.contractFeeId}`);
    
    return { success: true, duration };
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDebugExchangeRateCalls();
}
