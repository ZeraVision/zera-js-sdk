/**
 * Tests for Amount Utilities and Decimal Handling
 * Tests the decimal.js integration and amount conversion utilities
 * 
 * This file tests the core amount handling functionality that's used
 * across the entire SDK, not just transfer operations.
 */

import { assert } from '../../test-utils/index.js';
import { 
  transfer, 
  createCoinTXN, 
  createMultiInputOutputCoinTXN,
  serializeTransfer, 
  deserializeTransfer 
} from '../../transfer/transfer.js';
import { 
  toDecimal,
  toSmallestUnits,
  fromSmallestUnits,
  addAmounts,
  subtractAmounts,
  multiplyAmounts,
  divideAmounts,
  calculatePercentage,
  compareAmounts,
  areAmountsEqual,
  validateAmountBalance,
  formatAmount,
  parseAmount,
  getTokenDecimals,
  Decimal
} from '../amount-utils.js';
import { TOKEN_DECIMALS, addTokenConfig } from '../token-config.js';
import { UniversalFeeCalculator } from '../universal-fee-calculator.js';
import { 
  TransferSchema as Transfer, 
  CoinTXNSchema as CoinTXN, 
  OutputTransfersSchema as OutputTransfers 
} from '../../../proto/generated/txn_pb.js';
import { toJson } from '@bufbuild/protobuf';

export async function testDecimalBasicOperations() {
  console.log('🧪 Testing Basic Decimal Operations');
  
  // Test exact decimal arithmetic
  const a = new Decimal('0.1');
  const b = new Decimal('0.2');
  const sum = addAmounts(a, b);
  
  assert.ok(sum.equals('0.3'), '0.1 + 0.2 should equal 0.3 exactly');
  assert.ok(!sum.equals('0.30000000000000004'), 'Should not have floating point errors');
  
  // Test multiplication
  const product = multiplyAmounts('2.5', '3.14');
  assert.ok(product.equals('7.85'), '2.5 * 3.14 should equal 7.85');
  
  // Test division
  const quotient = divideAmounts('10', '3');
  assert.ok(quotient.equals('3.3333333333333333333333333333333333333333333333333'), '10 / 3 should be exact');
  
  console.log('✅ Basic decimal operations test passed');
}

export async function testAmountConversions() {
  console.log('🧪 Testing Amount Conversions');
  
  // Test toSmallestUnits
  const userAmount = '1.5';
  const smallestUnits = toSmallestUnits(userAmount, '$ZRA+0000');
  assert.ok(smallestUnits === '1500000000', '1.5 ZRA should convert to 1500000000 smallest units');
  
  // Test fromSmallestUnits
  const convertedBack = fromSmallestUnits('1500000000', '$ZRA+0000');
  assert.ok(convertedBack === '1.5', '1500000000 smallest units should convert back to 1.5');
  
  // Test with different token decimals
  const btcAmount = '0.5';
  const btcSmallestUnits = toSmallestUnits(btcAmount, '$BTC+0000');
  assert.ok(btcSmallestUnits === '50000000', '0.5 BTC should convert to 50000000 satoshis');
  
  console.log('✅ Amount conversions test passed');
}

export async function testDecimalTransfers() {
  console.log('🧪 Testing Decimal Transfers');
  
  // Test user-friendly decimal amounts
  const transferInstance = transfer('alice', 'bob', '1.5', '$ZRA+0000', '', 'payment');
  
  assert.ok(transferInstance.$typeName === 'zera_txn.Transfer', 'Should be a real protobuf Transfer instance');
  assert.ok(transferInstance.amount === '1500000000', '1.5 ZRA should be converted to smallest units');
  assert.ok(transferInstance.memo === 'payment', 'Memo should be preserved');
  
  // Test with Decimal object
  const decimalAmount = new Decimal('2.75');
  const transferInstance2 = transfer('alice', 'bob', decimalAmount, '$ZRA+0000');
  assert.ok(transferInstance2.amount === '2750000000', '2.75 ZRA should be converted correctly');
  
  console.log('✅ Decimal transfers test passed');
}

export async function testDecimalCoinTXN() {
  console.log('🧪 Testing Decimal CoinTXN Creation');
  
  const coinTxn = createCoinTXN('alice', 'bob', '3.14159', '$ZRA+0000', '', 'pi payment');
  
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should be a real CoinTXN instance');
  assert.ok(coinTxn.inputTransfers.length === 1, 'Should have 1 input transfer');
  assert.ok(coinTxn.outputTransfers.length === 1, 'Should have 1 output transfer');
  
  const outputTransfer = coinTxn.outputTransfers[0];
  assert.ok(outputTransfer.amount === '3141590000', '3.14159 ZRA should be converted to smallest units');
  assert.ok(outputTransfer.memo === 'pi payment', 'Memo should be preserved');
  
  console.log('✅ Decimal CoinTXN test passed');
}

export async function testDecimalMultiInputOutput() {
  console.log('🧪 Testing Decimal Multi-Input/Output');
  
  // Test: Alice(1.5) + Bob(2.25) -> Charlie(2.0) + David(1.75)
  // Alice pays 60% of fees, Bob pays 40% of fees (sums to 100%)
  const inputs = [
    { from: 'alice', amount: '1.5', feePercent: '60' },
    { from: 'bob', amount: '2.25', feePercent: '40' }
  ];
  
  const outputs = [
    { to: 'charlie', amount: '2.0', memo: 'Payment to Charlie' },
    { to: 'david', amount: '1.75', memo: 'Payment to David' }
  ];
  
  const coinTxn = createMultiInputOutputCoinTXN(inputs, outputs, '$ZRA+0000', 'Complex decimal transfer');
  
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should be a real CoinTXN instance');
  assert.ok(coinTxn.inputTransfers.length === 2, 'Should have 2 input transfers');
  assert.ok(coinTxn.outputTransfers.length === 2, 'Should have 2 output transfers');
  
  // Verify amounts are converted correctly (ZRA has 9 decimals)
  assert.ok(coinTxn.inputTransfers[0].amount === '1500000000', 'Alice input should be 1.5 ZRA');
  assert.ok(coinTxn.inputTransfers[1].amount === '2250000000', 'Bob input should be 2.25 ZRA');
  assert.ok(coinTxn.outputTransfers[0].amount === '2000000000', 'Charlie output should be 2.0 ZRA');
  assert.ok(coinTxn.outputTransfers[1].amount === '1750000000', 'David output should be 1.75 ZRA');
  
  // Verify fee percentages sum to 100%
  const totalFeePercent = coinTxn.inputTransfers.reduce((sum, transfer) => sum + transfer.feePercent, 0);
  assert.ok(totalFeePercent === 100000000, `Fee percentages should sum to 100% (100,000,000), got ${totalFeePercent}`);
  
  console.log('✅ Decimal multi-input/output test passed');
}

export async function testDecimalFeeCalculation() {
  console.log('🧪 Testing Decimal Fee Calculation');
  
  const transactionAmount = '100.5'; // 100.5 ZRA
  
  // Calculate contract fee (1.5% of transaction)
  const contractFee = UniversalFeeCalculator.calculateContractFee({
    contractId: '$ZRA+0000',
    contractFeeType: 2, // PERCENTAGE
    contractFeeAmount: '1.5', // 1.5%
    transactionAmount: transactionAmount,
    feeContractId: '$ZRA+0000'
  });
  
  assert.ok(contractFee.fee === '1.5075', '1.5% of 100.5 should be 1.5075');
  assert.ok(contractFee.feeDecimal.equals('1.5075'), 'Fee should be exact decimal');
  
  // Calculate total fees
  const totalFees = UniversalFeeCalculator.calculateTotalFees({
    transactionType: 0, // COIN_TYPE
    contractId: '$ZRA+0000',
    contractFeeType: 2, // PERCENTAGE
    contractFeeAmount: '1.5', // 1.5%
    transactionAmount: transactionAmount,
    feeContractId: '$ZRA+0000'
  });
  
  assert.ok(totalFees.totalFeeDecimal.greaterThan('1.5'), 'Total fees should be greater than 1.5');
  assert.ok(totalFees.totalAmountDecimal.greaterThan('100.5'), 'Total amount should be greater than 100.5');
  
  console.log('✅ Decimal fee calculation test passed');
}

export async function testDecimalPrecision() {
  console.log('🧪 Testing Decimal Precision');
  
  // Test very precise calculations (ZRA has 9 decimals, so we'll test with 9 decimal places)
  const preciseAmount = '0.123456789';
  const transferInstance = transfer('alice', 'bob', preciseAmount, '$ZRA+0000');
  
  // Should preserve all decimal places (9 decimals for ZRA)
  const expectedSmallestUnits = '123456789';
  assert.ok(transferInstance.amount === expectedSmallestUnits, 'Should preserve all decimal places');
  
  // Test conversion back
  const convertedBack = fromSmallestUnits(transferInstance.amount, '$ZRA+0000');
  assert.ok(convertedBack === preciseAmount, 'Should convert back to exact same value');
  
  console.log('✅ Decimal precision test passed');
}

export async function testDecimalValidation() {
  console.log('🧪 Testing Decimal Validation');
  
  // Test valid balance with decimals (fee percentages sum to 100%)
  const validInputs = [
    { from: 'alice', amount: '1.5', feePercent: '60' },
    { from: 'bob', amount: '2.5', feePercent: '40' }
  ];
  
  const validOutputs = [
    { to: 'charlie', amount: '2.0' },
    { to: 'david', amount: '2.0' } // Total: 4.0, same as inputs
  ];
  
  // This should not throw
  const validTxn = createMultiInputOutputCoinTXN(validInputs, validOutputs);
  assert.ok(validTxn.$typeName === 'zera_txn.CoinTXN', 'Valid transaction should be created');
  
  // Test invalid balance with decimals
  const invalidOutputs = [
    { to: 'charlie', amount: '2.0' },
    { to: 'david', amount: '2.1' } // Total: 4.1, but inputs total 4.0
  ];
  
  let errorThrown = false;
  try {
    createMultiInputOutputCoinTXN(validInputs, invalidOutputs);
  } catch (error) {
    errorThrown = true;
    assert.ok(error.message.includes('Amount balance validation failed'), 'Should throw balance validation error');
  }
  assert.ok(errorThrown, 'Should throw error for invalid balance');
  
  console.log('✅ Decimal validation test passed');
}

export async function testTokenConfigurations() {
  console.log('🧪 Testing Token Configurations');
  
  // Test known token decimals (ZRA has 9 decimals, not 18)
  assert.ok(getTokenDecimals('$ZRA+0000') === 9, 'ZRA should have 9 decimals');
  assert.ok(getTokenDecimals('$BTC+0000') === 8, 'BTC should have 8 decimals');
  
  // Test unknown token throws error (new behavior)
  try {
    getTokenDecimals('$UNKNOWN+0000');
    assert.fail('Should have thrown error for unknown token');
  } catch (error) {
    assert.ok(error.message.includes('Unsupported token'), 'Should throw error for unknown token');
  }
  
  // Test adding new token configuration
  addTokenConfig('$CUSTOM+1234', 6);
  assert.ok(getTokenDecimals('$CUSTOM+1234') === 6, 'Custom token should have 6 decimals');
  
  // Test conversion with custom token
  const customAmount = '1.234567';
  const customSmallestUnits = toSmallestUnits(customAmount, '$CUSTOM+1234');
  assert.ok(customSmallestUnits === '1234567', 'Custom token conversion should work');
  
  console.log('✅ Token configurations test passed');
}

export async function testDecimalFormatting() {
  console.log('🧪 Testing Decimal Formatting');
  
  // Test amount formatting
  const amount = '1.500000000000000000';
  const formatted = formatAmount(amount, '$ZRA+0000');
  assert.ok(formatted === '1.5', 'Should remove trailing zeros');
  
  // Test formatting with specific decimal places
  const formattedWithDecimals = formatAmount(amount, '$ZRA+0000', 2);
  assert.ok(formattedWithDecimals === '1.50', 'Should format to 2 decimal places');
  
  // Test parsing
  const parsed = parseAmount('3.14159');
  assert.ok(parsed.equals('3.14159'), 'Should parse decimal correctly');
  
  console.log('✅ Decimal formatting test passed');
}

export async function testMixedAmountTypes() {
  console.log('🧪 Testing Mixed Amount Types with Decimals');
  
  // Test mixing different amount types (fee percentages sum to 100%)
  const inputs = [
    { from: 'alice', amount: new Decimal('1.5'), feePercent: '40' },     // Decimal
    { from: 'bob', amount: '2.25', feePercent: '35' },                   // String
    { from: 'charlie', amount: 3.75, feePercent: '25' }                  // Number
  ];
  
  const outputs = [
    { to: 'david', amount: new Decimal('7.5') }         // Decimal
  ];
  
  const coinTxn = createMultiInputOutputCoinTXN(inputs, outputs);
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should handle mixed amount types');
  
  // Verify fee percentages sum to 100%
  const totalFeePercent = coinTxn.inputTransfers.reduce((sum, transfer) => sum + transfer.feePercent, 0);
  assert.ok(totalFeePercent === 100000000, `Fee percentages should sum to 100% (100,000,000), got ${totalFeePercent}`);
  
  console.log('✅ Mixed amount types test passed');
}
