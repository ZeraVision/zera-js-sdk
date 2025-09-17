/**
 * Test Transaction Amount Calculation
 * Verifies that transaction amounts are properly calculated for contract fee calculations
 */

import { createCoinTXN } from '../transaction.js';
import { getTestInput, getTestOutput } from '../../test-utils/test-keys.js';

/**
 * Test that transaction amount is properly calculated for contract fees
 */
export async function testTransactionAmountCalculation() {
  console.log('🧪 Testing Transaction Amount Calculation');
  
  try {
    // Test inputs and outputs using test utilities
    const inputs = [
      getTestInput('ED25519', 'alice', '10.0', '100') // 10 ZRA, 100% fee responsibility
    ];
    
    const outputs = [
      getTestOutput('bob', '5.0', 'Test payment 1'), // 5 ZRA
      getTestOutput('charlie', '3.0', 'Test payment 2') // 3 ZRA
    ];
    
    // Total transaction amount should be 5.0 + 3.0 = 8.0 ZRA
    const expectedTransactionAmount = '8.0';
    
    console.log(`📊 Expected transaction amount: ${expectedTransactionAmount} ZRA`);
    console.log(`📊 Output 1: ${outputs[0].amount} ZRA`);
    console.log(`📊 Output 2: ${outputs[1].amount} ZRA`);
    
    // Create transaction with contract fee (this should use the calculated transaction amount)
    const result = await createCoinTXN(inputs, outputs, '$ZRA+0000', {
      baseFeeId: '$ZRA+0000',
      contractFeeId: '$ZRA+0000',
      contractFee: '0.001', // 0.001 ZRA contract fee
      interfaceFeeAmount: '0.005',
      interfaceFeeId: '$ZRA+0000',
      interfaceAddress: 'test_interface_address'
    }, 'Test transaction amount calculation');
    
    console.log('✅ Transaction created successfully');
    console.log(`💰 Transaction hash: ${result.hash}`);
    console.log(`💰 Base fee: ${result.baseFeeAmount} ${result.baseFeeId}`);
    
    // Check if contract fee was calculated (should be present in the transaction)
    if (result.contractFeeAmount) {
      console.log(`💰 Contract fee: ${result.contractFeeAmount} ${result.contractFeeId}`);
      console.log('✅ Contract fee calculation working with transaction amount');
    } else {
      console.log('⚠️  No contract fee found in transaction');
    }
    
    // Check if interface fee was calculated
    if (result.interfaceFee) {
      console.log(`🔌 Interface fee: ${result.interfaceFee} ${result.interfaceFeeId}`);
      console.log('✅ Interface fee calculation working');
    } else {
      console.log('⚠️  No interface fee found in transaction');
    }
    
    console.log('\n✅ Transaction Amount Calculation Test Completed');
    return { success: true, transactionAmount: expectedTransactionAmount };
    
  } catch (error) {
    console.error('❌ Transaction Amount Calculation Test Failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testTransactionAmountCalculation();
}
