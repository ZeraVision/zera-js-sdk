/**
 * Tests for Go-like Protobuf Transfer Implementation
 * Demonstrates proper use of generated protobuf classes
 */

import { assert } from '../../test-utils/index.js';
import { 
  transfer, 
  createCoinTXN 
} from '../transfer.js';
import { 
  TransferSchema as Transfer, 
  CoinTXNSchema as CoinTXN, 
  OutputTransfersSchema as OutputTransfers 
} from '../../../proto/generated/txn_pb.js';

export async function testCoinTXN() {
  console.log('🧪 Testing Multi-Input Multi-Output Transactions');
  
  // Test: Alice(1.0) + Bob(0.5) -> Charlie(0.8) + David(0.7)
  // Alice pays 60% of fees, Bob pays 40% of fees (sums to 100%)
  const inputs = [
    { from: 'alice', amount: '1.0', feePercent: '60' },
    { from: 'bob', amount: '0.5', feePercent: '40' }
  ];
  
  const outputs = [
    { to: 'charlie', amount: '0.8', memo: 'transfer memo' },
    { to: 'david', amount: '0.7', memo: 'transfer memo' }
  ];
  
  // Test with optional fee amount
  const feeConfig = {
    baseFeeId: '$ZRA+0000',
    contractFee: '500'
  };
  const coinTxn = createCoinTXN(inputs, outputs, feeConfig, 'base memo');
  
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should be a real CoinTXN instance');
  assert.ok(coinTxn.inputTransfers.length === 2, 'Should have 2 input transfers');
  assert.ok(coinTxn.outputTransfers.length === 2, 'Should have 2 output transfers');
  
  // Test input amounts (ZRA has 9 decimals, so 1.0 = 1000000000)
  const expectedInput1 = '1000000000'; // 1.0 * 10^9
  const expectedInput2 = '500000000';  // 0.5 * 10^9
  assert.ok(coinTxn.inputTransfers[0].amount === expectedInput1, 'First input amount should be 1.0 ZRA');
  assert.ok(coinTxn.inputTransfers[1].amount === expectedInput2, 'Second input amount should be 0.5 ZRA');
  
  // Test output amounts
  const expectedOutput1 = '800000000'; // 0.8 * 10^9
  const expectedOutput2 = '700000000'; // 0.7 * 10^9
  assert.ok(coinTxn.outputTransfers[0].amount === expectedOutput1, 'First output amount should be 0.8 ZRA');
  assert.ok(coinTxn.outputTransfers[1].amount === expectedOutput2, 'Second output amount should be 0.7 ZRA');
  
  // Test memos
  assert.ok(coinTxn.outputTransfers[0].memo === 'transfer memo', 'First output memo should match');
  assert.ok(coinTxn.outputTransfers[1].memo === 'transfer memo', 'Second output memo should match');
  
  // Test fee percentages (Alice: 60% = 60,000,000, Bob: 40% = 40,000,000)
  assert.ok(coinTxn.inputTransfers[0].feePercent === 60000000, 'Alice should have 60% fee');
  assert.ok(coinTxn.inputTransfers[1].feePercent === 40000000, 'Bob should have 40% fee');
  
  // Test that fee percentages sum to exactly 100% (100,000,000)
  const totalFeePercent = coinTxn.inputTransfers.reduce((sum, transfer) => sum + transfer.feePercent, 0);
  assert.ok(totalFeePercent === 100000000, `Fee percentages should sum to 100% (100,000,000), got ${totalFeePercent}`);
  
  // Test optional fee amount
  assert.ok(coinTxn.contractFeeAmount === '500', 'Contract fee amount should be 500');
  
  // Test without fee amount (should be nil)
  const feeConfigNoFee = { baseFeeId: '$ZRA+0000' };
  const coinTxnNoFee = createCoinTXN(inputs, outputs, feeConfigNoFee, 'multi-transfer');
  assert.ok(coinTxnNoFee.contractFeeAmount === undefined, 'Contract fee amount should be undefined when not provided');
  
  console.log('✅ Multi-input/output transaction test passed');
}

export async function testFeePercentFunctionality() {
  console.log('🧪 Testing Fee Percent Functionality');
  
  // Test with different fee percentages that sum to 100%
  const inputs = [
    { from: 'alice', amount: '1.0', feePercent: '60' },  // 60% fee
    { from: 'bob', amount: '0.5', feePercent: '40' }     // 40% fee (total: 100%)
  ];
  
  const outputs = [
    { to: 'charlie', amount: '1.5', memo: 'payment' }
  ];
  
  const feeConfig = { baseFeeId: '$ZRA+0000' };
  const coinTxn = createCoinTXN(inputs, outputs, feeConfig);
  
  // Test fee percentages
  assert.ok(coinTxn.inputTransfers[0].feePercent === 60000000, 'First input should have 60% fee (60000000)');
  assert.ok(coinTxn.inputTransfers[1].feePercent === 40000000, 'Second input should have 40% fee (40000000)');
  
  // Test amounts are still correct (ZRA has 9 decimals)
  assert.ok(coinTxn.inputTransfers[0].amount === '1000000000', 'First input amount should be 1.0 ZRA');
  assert.ok(coinTxn.inputTransfers[1].amount === '500000000', 'Second input amount should be 0.5 ZRA');
  assert.ok(coinTxn.outputTransfers[0].amount === '1500000000', 'Output amount should be 1.5 ZRA');
  
  console.log('✅ Fee percent functionality test passed');
}

export async function testOptionalFeeAmount() {
  console.log('🧪 Testing Optional Fee Amount');
  
  // Test with fee amount provided (single input needs 100% fee)
  const inputs = [
    { from: 'alice', amount: '1.0', feePercent: '100' }
  ];
  
  const outputs = [
    { to: 'bob', amount: '1.0', memo: 'payment' }
  ];
  
  const feeConfigWithFee = {
    baseFeeId: '$ZRA+0000',
    contractFee: '500'
  };
  const coinTxnWithFee = createCoinTXN(inputs, outputs, feeConfigWithFee);
  
  // Test that fee amount is included when provided
  assert.ok(coinTxnWithFee.contractFeeAmount === '500', 'Fee amount should be included when provided');
  
  // Test without fee amount (should be nil/undefined)
  const feeConfigWithoutFee = {
    baseFeeId: '$ZRA+0000'
  };
  const coinTxnWithoutFee = createCoinTXN(inputs, outputs, feeConfigWithoutFee);
  
  // Test that fee amount is not included when not provided
  assert.ok(coinTxnWithoutFee.contractFeeAmount === undefined, 'Fee amount should be undefined when not provided');
  
  console.log('✅ Optional fee amount test passed');
}

export async function testFeePercentValidation() {
  console.log('🧪 Testing Fee Percent Validation');
  
  // Test that fee percentages must sum to exactly 100%
  const inputs = [
    { from: 'alice', amount: '1.0', feePercent: '60' },
    { from: 'bob', amount: '0.5', feePercent: '30' } // Only 90% total
  ];
  
  const outputs = [
    { to: 'charlie', amount: '1.5', memo: 'payment' }
  ];
  
  const feeConfig = { baseFeeId: '$ZRA+0000' };
  
  let errorThrown = false;
  try {
    createCoinTXN(inputs, outputs, feeConfig, 'test');
  } catch (error) {
    errorThrown = true;
    assert.ok(error.message.includes('Fee percentages must sum to exactly 100%'), 'Should throw error for invalid fee sum');
    assert.ok(error.message.includes('90000000'), 'Error message should include actual sum');
  }
  
  assert.ok(errorThrown, 'Should throw error when fee percentages don\'t sum to 100%');
  
  // Test that it works when they do sum to 100%
  const validInputs = [
    { from: 'alice', amount: '1.0', feePercent: '60' },
    { from: 'bob', amount: '0.5', feePercent: '40' } // 100% total
  ];
  
  const validCoinTxn = createCoinTXN(validInputs, outputs, feeConfig, 'test');
  assert.ok(validCoinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create valid CoinTXN when fee percentages sum to 100%');
  
  console.log('✅ Fee percent validation test passed');
}

export async function testDecimalFeePercentPrecision() {
  console.log('🧪 Testing Decimal.js Fee Percent Precision');
  
  // Test with decimal values that would cause floating-point precision issues
  const inputs = [
    { from: 'alice', amount: '1.0', feePercent: '33.333333' },  // 1/3
    { from: 'bob', amount: '1.0', feePercent: '33.333333' },     // 1/3  
    { from: 'charlie', amount: '1.0', feePercent: '33.333334' }  // 1/3 + rounding
  ];
  
  const outputs = [
    { to: 'david', amount: '3.0', memo: 'precision test' }
  ];
  
  // This should work with decimal.js exact arithmetic
  const feeConfig = { baseFeeId: '$ZRA+0000' };
  const coinTxn = createCoinTXN(inputs, outputs, feeConfig, 'precision test');
  
  // Verify that the fee percentages sum to exactly 100,000,000
  const totalFeePercent = coinTxn.inputTransfers.reduce((sum, transfer) => sum + transfer.feePercent, 0);
  assert.ok(totalFeePercent === 100000000, `Fee percentages should sum to exactly 100% (100,000,000), got ${totalFeePercent}`);
  
  // Verify individual fee percentages are correctly scaled
  assert.ok(coinTxn.inputTransfers[0].feePercent === 33333333, 'First input should have 33.333333% fee');
  assert.ok(coinTxn.inputTransfers[1].feePercent === 33333333, 'Second input should have 33.333333% fee');
  assert.ok(coinTxn.inputTransfers[2].feePercent === 33333334, 'Third input should have 33.333334% fee');
  
  console.log('✅ Decimal.js fee percent precision test passed');
}

export async function testEmptyMemoHandling() {
  console.log('🧪 Testing Empty Memo Handling');
  
  // Test with empty string memo
  const inputs = [
    { from: 'alice', amount: '1.0', feePercent: '100' }
  ];
  
  const outputs = [
    { to: 'bob', amount: '1.0', memo: '' }  // Empty string memo
  ];
  
  const feeConfig = { baseFeeId: '$ZRA+0000' };
  const coinTxnEmptyMemo = createCoinTXN(inputs, outputs, feeConfig, 'test');
  
  // Empty string memo should be undefined (nil) in protobuf
  assert.ok(coinTxnEmptyMemo.outputTransfers[0].memo === undefined, 'Empty string memo should be undefined (nil)');
  
  // Test with undefined memo
  const outputsUndefined = [
    { to: 'bob', amount: '1.0' }  // No memo property
  ];
  
  const coinTxnUndefinedMemo = createCoinTXN(inputs, outputsUndefined, feeConfig, 'test');
  
  // Undefined memo should remain undefined
  assert.ok(coinTxnUndefinedMemo.outputTransfers[0].memo === undefined, 'Undefined memo should remain undefined (nil)');
  
  // Test with whitespace-only memo
  const outputsWhitespace = [
    { to: 'bob', amount: '1.0', memo: '   ' }  // Whitespace-only memo
  ];
  
  const coinTxnWhitespaceMemo = createCoinTXN(inputs, outputsWhitespace, feeConfig, 'test');
  
  // Whitespace-only memo should be undefined (nil)
  assert.ok(coinTxnWhitespaceMemo.outputTransfers[0].memo === undefined, 'Whitespace-only memo should be undefined (nil)');
  
  // Test with valid memo
  const outputsValid = [
    { to: 'bob', amount: '1.0', memo: 'Valid memo' }
  ];
  
  const coinTxnValidMemo = createCoinTXN(inputs, outputsValid, feeConfig, 'test');
  
  // Valid memo should be preserved
  assert.ok(coinTxnValidMemo.outputTransfers[0].memo === 'Valid memo', 'Valid memo should be preserved');
  
  console.log('✅ Empty memo handling test passed');
}
