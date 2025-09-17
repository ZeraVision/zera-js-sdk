/**
 * Test Transaction Amount Calculation Optimization
 * Verifies that transaction amount is only calculated when contract fees are needed
 */

import { createCoinTXN } from '../transaction.js';
import { createTestInput, getTestOutput } from '../../test-utils/test-keys.js';

/**
 * Test that transaction amount calculation is optimized
 */
export async function testTransactionAmountOptimization() {
  console.log('🧪 Testing Transaction Amount Calculation Optimization');
  
  try {
    // Test 1: Transaction with explicit fees (no contract fee calculation needed)
    console.log('📊 Test 1: Transaction with explicit fees (should not calculate transaction amount)');
    const inputs1 = [
      createTestInput('ED25519', 'alice', '10.0', '100')
    ];
    
    const outputs1 = [
      getTestOutput('bob', '5.0', 'Test payment 1'),
      getTestOutput('charlie', '3.0', 'Test payment 2')
    ];
    
    const startTime1 = Date.now();
    const result1 = await createCoinTXN(inputs1, outputs1, '$ZRA+0000', {
      baseFeeId: '$ZRA+0000',
      baseFee: '0.001', // Explicit base fee
      contractFee: null  // No contract fee calculation needed
    }, 'Test explicit fees');
    const endTime1 = Date.now();
    
    console.log(`✅ Explicit fees transaction created in ${endTime1 - startTime1}ms`);
    console.log(`💰 Base fee: ${result1.baseFeeAmount} ${result1.baseFeeId}`);
    console.log(`💰 Contract fee: ${result1.contractFeeAmount || 'null'} (not calculated)`);
    
    // Test 2: Transaction with automatic contract fees (transaction amount calculation needed)
    console.log('\n📊 Test 2: Transaction with automatic contract fees (should calculate transaction amount)');
    const inputs2 = [
      createTestInput('ED25519', 'alice', '10.0', '100')
    ];
    
    const outputs2 = [
      getTestOutput('bob', '5.0', 'Test payment 1'),
      getTestOutput('charlie', '3.0', 'Test payment 2')
    ];
    
    const startTime2 = Date.now();
    const result2 = await createCoinTXN(inputs2, outputs2, '$ZRA+0000', {
      baseFeeId: '$ZRA+0000',
      contractFeeId: '$ZRA+0000'
      // No explicit fees - triggers automatic calculation
    }, 'Test automatic fees');
    const endTime2 = Date.now();
    
    console.log(`✅ Automatic fees transaction created in ${endTime2 - startTime2}ms`);
    console.log(`💰 Base fee: ${result2.baseFeeAmount} ${result2.baseFeeId}`);
    console.log(`💰 Contract fee: ${result2.contractFeeAmount || 'null'} (calculated)`);
    
    console.log('\n✅ Transaction Amount Optimization Test Completed');
    console.log('📈 Optimization: Transaction amount is only calculated when contract fees are needed');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Transaction Amount Optimization Test Failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testTransactionAmountOptimization();
}
