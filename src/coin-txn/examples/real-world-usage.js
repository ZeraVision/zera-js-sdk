/**
 * Real-World SDK Usage Examples
 * 
 * This file demonstrates how to use the ZERA SDK in real scenarios,
 * showing both simple and complex transaction patterns.
 */

import { createCoinTXN } from '../transaction.js';
import { 
  createTestInput, 
  createTestInputs, 
  getTestOutput, 
  DEFAULT_TEST_FEE_CONFIG,
  MINIMAL_TEST_FEE_CONFIG 
} from '../../test-utils/index.js';

/**
 * Example 1: Simple Payment
 * Alice sends 1.5 ZRA to Bob
 */
export function exampleSimplePayment() {
  console.log('💸 Example 1: Simple Payment');
  
  // Create input (Alice's wallet)
  const input = createTestInput('ed25519', 'alice', '1.5', '100');
  
  // Create output (Bob's address)
  const output = getTestOutput('bob', '1.5', 'Payment from Alice');
  
  // Create transaction
  const transaction = createCoinTXN([input], [output], MINIMAL_TEST_FEE_CONFIG, 'Simple payment');
  
  console.log('✅ Transaction created:', transaction.$typeName);
  console.log('📤 Input amount:', input.amount, 'ZRA');
  console.log('📥 Output amount:', output.amount, 'ZRA');
  console.log('💳 Fee percentage:', input.feePercent + '%');
  
  return transaction;
}

/**
 * Example 2: Multi-Party Transaction
 * Alice and Bob split a payment to Charlie and Jesse
 */
export function exampleMultiPartyTransaction() {
  console.log('👥 Example 2: Multi-Party Transaction');
  
  // Alice pays 60% of fees, Bob pays 40%
  const inputs = createTestInputs([
    { keyType: 'ed25519', person: 'alice', amount: '2.0', feePercent: '60' },
    { keyType: 'ed448', person: 'bob', amount: '1.5', feePercent: '40' }
  ]);
  
  // Split payment between Charlie and Jesse
  const outputs = [
    getTestOutput('charlie', '2.5', 'Main payment'),
    getTestOutput('jesse', '1.0', 'Secondary payment')
  ];
  
  const transaction = createCoinTXN(inputs, outputs, DEFAULT_TEST_FEE_CONFIG, 'Multi-party split');
  
  console.log('✅ Multi-party transaction created');
  console.log('📤 Total input:', '3.5 ZRA');
  console.log('📥 Total output:', '3.5 ZRA');
  console.log('👤 Alice fee share:', inputs[0].feePercent + '%');
  console.log('👤 Bob fee share:', inputs[1].feePercent + '%');
  
  return transaction;
}

/**
 * Example 3: Complex Transaction with Custom Fees
 * Charlie sends money to multiple recipients with custom fee structure
 */
export function exampleComplexTransaction() {
  console.log('🏦 Example 3: Complex Transaction');
  
  // Single input from Charlie
  const input = createTestInput('ed25519', 'charlie', '5.0', '100');
  
  // Multiple outputs
  const outputs = [
    getTestOutput('alice', '2.0', 'Salary payment'),
    getTestOutput('bob', '1.5', 'Bonus payment'),
    getTestOutput('jesse', '1.0', 'Contractor fee')
  ];
  
  // Custom fee configuration
  const customFeeConfig = {
    baseFeeId: '$ZRA+0000',
    baseFee: '0.005',      // 0.005 ZRA base fee
    contractFeeId: '$ZRA+0000',
    contractFee: '0.002'   // 0.002 ZRA contract fee
  };
  
  const transaction = createCoinTXN([input], outputs, customFeeConfig, 'Complex payment distribution');
  
  console.log('✅ Complex transaction created');
  console.log('📤 Input amount:', input.amount, 'ZRA');
  console.log('📥 Outputs:', outputs.length, 'recipients');
  console.log('💰 Total distributed:', '4.5 ZRA');
  console.log('💸 Custom fees applied');
  
  return transaction;
}

/**
 * Example 4: Batch Processing
 * Process multiple transactions in a batch
 */
export function exampleBatchProcessing() {
  console.log('📦 Example 4: Batch Processing');
  
  const transactions = [];
  
  // Transaction 1: Alice to Bob
  transactions.push(createCoinTXN(
    [createTestInput('ed25519', 'alice', '1.0', '100')],
    [getTestOutput('bob', '1.0', 'Batch payment 1')],
    MINIMAL_TEST_FEE_CONFIG,
    'Batch transaction 1'
  ));
  
  // Transaction 2: Bob to Charlie
  transactions.push(createCoinTXN(
    [createTestInput('ed448', 'bob', '0.5', '100')],
    [getTestOutput('charlie', '0.5', 'Batch payment 2')],
    MINIMAL_TEST_FEE_CONFIG,
    'Batch transaction 2'
  ));
  
  // Transaction 3: Charlie to Jesse
  transactions.push(createCoinTXN(
    [createTestInput('ed25519', 'charlie', '0.25', '100')],
    [getTestOutput('jesse', '0.25', 'Batch payment 3')],
    MINIMAL_TEST_FEE_CONFIG,
    'Batch transaction 3'
  ));
  
  console.log('✅ Batch processing complete');
  console.log('📦 Transactions created:', transactions.length);
  console.log('🔄 Chain: Alice → Bob → Charlie → Jesse');
  
  return transactions;
}

/**
 * Example 5: Error Handling and Validation
 * Demonstrates proper error handling patterns
 */
export function exampleErrorHandling() {
  console.log('⚠️ Example 5: Error Handling');
  
  try {
    // This should work
    const validTransaction = createCoinTXN(
      [createTestInput('ed25519', 'alice', '1.0', '100')],
      [getTestOutput('bob', '1.0', 'Valid payment')],
      MINIMAL_TEST_FEE_CONFIG
    );
    console.log('✅ Valid transaction created successfully');
    
    // This should fail (insufficient balance)
    try {
      const invalidTransaction = createCoinTXN(
        [createTestInput('ed25519', 'alice', '1.0', '100')],
        [getTestOutput('bob', '2.0', 'Invalid payment')], // More output than input
        MINIMAL_TEST_FEE_CONFIG
      );
      console.log('❌ This should not execute');
    } catch (error) {
      console.log('✅ Caught expected error:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('🚀 Running ZERA SDK Real-World Examples\n');
  
  exampleSimplePayment();
  console.log('');
  
  exampleMultiPartyTransaction();
  console.log('');
  
  exampleComplexTransaction();
  console.log('');
  
  exampleBatchProcessing();
  console.log('');
  
  exampleErrorHandling();
  console.log('');
  
  console.log('🎉 All examples completed successfully!');
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
