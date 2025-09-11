import { assert } from '../../test-utils/index.js';
import { createCoinTXN } from '../index.js';

export async function testCoinTxnBasic() {
  const inputs = [{ from: 'alice', amount: '1.0', feePercent: '100' }];
  const outputs = [{ to: 'bob', amount: '1.0', memo: 'payment' }];
  const coinTxn = createCoinTXN(inputs, outputs, { baseFeeId: '$ZRA+0000' }, 'memo');
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create CoinTXN');
}

export async function testCoinTxnWithFees() {
  const inputs = [{ from: 'alice', amount: '1.0', feePercent: '100' }];
  const outputs = [{ to: 'bob', amount: '1.0', memo: 'payment' }];
  const feeConfig = { 
    baseFeeId: '$ZRA+0000',
    baseFee: '0.001',  // User-friendly amount (will be converted to smallest units)
    contractFeeId: '$ZRA+0000',
    contractFee: '0.0005'  // User-friendly amount (will be converted to smallest units)
  };
  const coinTxn = createCoinTXN(inputs, outputs, feeConfig, 'memo with fees');
  
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create CoinTXN with fees');
  assert.ok(coinTxn.base !== undefined, 'Should have base transaction');
  assert.ok(coinTxn.base.feeAmount === '1000000', 'Base fee should be converted to smallest units');
  assert.ok(coinTxn.contractFeeAmount === '500000', 'Contract fee should be converted to smallest units');
}

export async function testCoinTxnWithOnlyBaseFee() {
  const inputs = [{ from: 'alice', amount: '1.0', feePercent: '100' }];
  const outputs = [{ to: 'bob', amount: '1.0', memo: 'payment' }];
  const feeConfig = { 
    baseFeeId: '$ZRA+0000',
    baseFee: '0.002'  // User-friendly amount
  };
  const coinTxn = createCoinTXN(inputs, outputs, feeConfig);
  
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create CoinTXN with base fee only');
  assert.ok(coinTxn.base !== undefined, 'Should have base transaction');
  assert.ok(coinTxn.base.feeAmount === '2000000', 'Base fee should be converted to smallest units');
  assert.ok(coinTxn.contractFeeAmount === undefined, 'Should not have contract fee');
}


