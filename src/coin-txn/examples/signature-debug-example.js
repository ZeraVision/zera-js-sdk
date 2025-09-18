/**
 * Signature Debug Example
 * 
 * This example shows how to use the signature debug utilities
 * to troubleshoot signature validation issues in your transactions.
 */

import { createCoinTXN } from '../index.js';
import { ED25519_TEST_KEYS, TEST_WALLET_ADDRESSES } from '../../test-utils/index.js';
import { debugSignatureValidation, printDebugResults } from '../signature-debug.js';

/**
 * Example: Debug a transaction that might have signature issues
 */
export async function debugTransactionExample() {
  console.log('🔍 Signature Debug Example');
  console.log('=' .repeat(40));
  
  // Create a transaction
  const input = {
    privateKey: ED25519_TEST_KEYS.alice.privateKey,
    publicKey: ED25519_TEST_KEYS.alice.publicKey,
    amount: '2.5',
    feePercent: '100'
  };
  
  const output = {
    to: TEST_WALLET_ADDRESSES.bob,
    amount: '2.5',
    memo: 'Debug example transaction'
  };
  
  try {
    // Create the transaction
    const transaction = await createCoinTXN([input], [output], '$ZRA+0000', {
      baseFeeId: '$ZRA+0000',
      baseFee: '0.001'
    }, 'Debug example');
    
    console.log('✅ Transaction created successfully');
    
    // Debug the signature validation
    console.log('\n🔍 Debugging signature validation...');
    const debugResults = debugSignatureValidation(transaction, [input.publicKey]);
    
    // Print detailed results
    printDebugResults(debugResults);
    
    // You can also access specific information programmatically
    console.log('\n📊 Programmatic Access:');
    console.log(`  Transaction hash: ${debugResults.transactionHash}`);
    console.log(`  Number of signatures: ${debugResults.signatures.length}`);
    console.log(`  All signatures valid: ${debugResults.isValid}`);
    
    if (debugResults.errors.length > 0) {
      console.log(`  Errors found: ${debugResults.errors.length}`);
      debugResults.errors.forEach((error, i) => {
        console.log(`    ${i + 1}. ${error}`);
      });
    }
    
    return debugResults;
    
  } catch (error) {
    console.error('❌ Debug example failed:', error.message);
    throw error;
  }
}

/**
 * Example: Compare two transactions to see why one might fail
 */
export async function compareTransactionsExample() {
  console.log('🔍 Transaction Comparison Example');
  console.log('=' .repeat(40));
  
  const input = {
    privateKey: ED25519_TEST_KEYS.alice.privateKey,
    publicKey: ED25519_TEST_KEYS.alice.publicKey,
    amount: '1.0',
    feePercent: '100'
  };
  
  const output = {
    to: TEST_WALLET_ADDRESSES.bob,
    amount: '1.0',
    memo: 'Comparison example'
  };
  
  try {
    // Create two identical transactions
    const transaction1 = await createCoinTXN([input], [output], '$ZRA+0000', {
      baseFeeId: '$ZRA+0000',
      baseFee: '0.001'
    }, 'Transaction 1');
    
    const transaction2 = await createCoinTXN([input], [output], '$ZRA+0000', {
      baseFeeId: '$ZRA+0000',
      baseFee: '0.001'
    }, 'Transaction 2');
    
    console.log('✅ Two transactions created successfully');
    
    // Debug both transactions
    console.log('\n🔍 Debugging Transaction 1...');
    const results1 = debugSignatureValidation(transaction1, [input.publicKey]);
    
    console.log('\n🔍 Debugging Transaction 2...');
    const results2 = debugSignatureValidation(transaction2, [input.publicKey]);
    
    // Compare results
    console.log('\n📊 Comparison Results:');
    console.log(`  Transaction 1 valid: ${results1.isValid ? '✅' : '❌'}`);
    console.log(`  Transaction 2 valid: ${results2.isValid ? '✅' : '❌'}`);
    console.log(`  Transaction 1 hash: ${results1.transactionHash}`);
    console.log(`  Transaction 2 hash: ${results2.transactionHash}`);
    
    // Note: Hashes will be different due to different timestamps/nonces
    console.log(`  Hashes match: ${results1.transactionHash === results2.transactionHash ? 'Yes' : 'No (expected)'}`);
    
    return { transaction1: results1, transaction2: results2 };
    
  } catch (error) {
    console.error('❌ Comparison example failed:', error.message);
    throw error;
  }
}

// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugTransactionExample()
    .then(() => {
      console.log('\n🎉 Debug example completed successfully!');
      return compareTransactionsExample();
    })
    .then(() => {
      console.log('\n🎉 All examples completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Example failed:', error.message);
      process.exit(1);
    });
}
