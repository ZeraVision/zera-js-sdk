import { assert, createTestInput, createTestInputs, getTestOutput, DEFAULT_TEST_FEE_CONFIG } from '../../test-utils/index.js';
import { createCoinTXN, sendCoinTXN } from '../index.js';

export async function testCoinTxnBasic() {
  // Real-world usage: Create inputs with keys and amounts
  const inputs = [createTestInput('ED25519', 'alice', '1.0', '100')];
  const outputs = [getTestOutput('bob', '1.0', 'payment')];
  const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', {}, 'memo');
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create CoinTXN');
}

export async function testCoinTXNWithExplicitFees() {
  // Real-world usage: Transaction with explicitly specified fees
  const inputs = [createTestInput('ED25519', 'alice', '1.0', '100')];
  const outputs = [getTestOutput('bob', '1.0', 'payment')];
  const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', DEFAULT_TEST_FEE_CONFIG, 'memo with fees');
  
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create CoinTXN with fees');
  assert.ok(coinTxn.base, 'Should have base transaction');
  assert.ok(coinTxn.base.feeAmount === '1000000', 'Base fee should be converted to smallest units');
  assert.ok(coinTxn.contractFeeAmount === '500000', 'Contract fee should be converted to smallest units');
}

export async function testCoinTxnWithOnlyBaseFee() {
  // Real-world usage: Transaction with only base fee explicitly specified
  const inputs = [createTestInput('ED25519', 'alice', '1.0', '100')];
  const outputs = [getTestOutput('bob', '1.0', 'payment')];
  const feeConfig = { 
    baseFeeId: '$ZRA+0000',
    baseFee: '1.002',  // User-friendly amount - explicitly specified
  };
  const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', feeConfig, '', {
    host: '146.190.114.124',
  });
  
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create CoinTXN with base fee only');
  assert.ok(coinTxn.base.feeAmount === '1002000000', 'Base fee should be converted to smallest units');
  assert.ok(!coinTxn.contractFeeAmount, 'Should not have contract fee amount when no contract fee specified');
  assert.ok(!coinTxn.contractFeeId, 'Should not have contract fee ID when no contract fee specified');
}

export async function testCoinTxnMultiParty() {
  // Real-world usage: Multi-party transaction
  // Alice and Bob send money to Charlie and Jesse
  const inputs = createTestInputs([
    { keyType: 'ED25519', person: 'alice', amount: '2.5', feePercent: '60' },
    { keyType: 'ED448', person: 'bob', amount: '1.5', feePercent: '40' }
  ]);
  
  const outputs = [
    getTestOutput('charlie', '3.0', 'Payment to Charlie'),
    getTestOutput('jesse', '1.0', 'Payment to Jesse')
  ];
  
  const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', DEFAULT_TEST_FEE_CONFIG, 'Multi-party transfer');
  
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create multi-party CoinTXN');
  assert.ok(coinTxn.inputTransfers.length === 2, 'Should have 2 input transfers');
  assert.ok(coinTxn.outputTransfers.length === 2, 'Should have 2 output transfers');
  
  // Verify fee percentages sum to 100%
  const totalFeePercent = coinTxn.inputTransfers.reduce((sum, transfer) => sum + transfer.feePercent, 0);
  assert.ok(totalFeePercent === 100000000, `Fee percentages should sum to 100% (100,000,000), got ${totalFeePercent}`);
  
  console.log('✅ Multi-party transaction test passed');
}


