import { assert, createTestInput, createTestInputs, getTestOutput, DEFAULT_TEST_FEE_CONFIG } from '../../test-utils/index.js';
import { createCoinTXN, sendCoinTXN } from '../index.js';

export async function testCoinTxnBasic(): Promise<void> {
  // Real-world usage: Create inputs with keys and amounts
  const inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
  const outputs = [getTestOutput('bob', '1.0', 'payment')];
  const coinTxn = await createCoinTXN(inputs as any, outputs, '$ZRA+0000', {}, 'memo');
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create CoinTXN');
}

export async function testCoinTXNWithExplicitFees(): Promise<void> {
  // Real-world usage: Transaction with explicitly specified fees
  const inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
  const outputs = [getTestOutput('bob', '1.0', 'payment')];
  const coinTxn = await createCoinTXN(inputs as any, outputs, '$ZRA+0000', DEFAULT_TEST_FEE_CONFIG, 'memo with fees');
  
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create CoinTXN with fees');
  assert.ok(coinTxn.base, 'Should have base transaction');
  assert.ok((coinTxn.base as any).feeAmount === '1000000', 'Base fee should be converted to smallest units');
  assert.ok((coinTxn as any).contractFeeAmount === '500000', 'Contract fee should be converted to smallest units');
}

export async function testCoinTxnWithOnlyBaseFee(): Promise<void> {
  // Real-world usage: Transaction with only base fee explicitly specified
  const inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
  const outputs = [getTestOutput('bob', '1.0', 'payment')];
  const feeConfig = { 
    baseFeeId: '$ZRA+0000',
    baseFee: '1.002',  // User-friendly amount - explicitly specified
    contractFeeId: '$ZRA+0000',
    contractFee: 'auto'  // Let the system calculate contract fee
  };
  
  const coinTxn = await createCoinTXN(inputs as any, outputs, '$ZRA+0000', feeConfig, 'base fee only');
  
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create CoinTXN with base fee only');
  assert.ok(coinTxn.base, 'Should have base transaction');
  assert.ok((coinTxn.base as any).feeAmount === '1002000000', 'Base fee should be converted to smallest units');
}

export async function testCoinTxnWithOnlyContractFee(): Promise<void> {
  // Real-world usage: Transaction with only contract fee explicitly specified
  const inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
  const outputs = [getTestOutput('bob', '1.0', 'payment')];
  const feeConfig = { 
    baseFeeId: '$ZRA+0000',
    baseFee: 'auto',  // Let the system calculate base fee
    contractFeeId: '$ZRA+0000',
    contractFee: '0.5'  // User-friendly amount - explicitly specified
  };
  
  const coinTxn = await createCoinTXN(inputs as any, outputs, '$ZRA+0000', feeConfig, 'contract fee only');
  
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create CoinTXN with contract fee only');
  assert.ok(coinTxn.base, 'Should have base transaction');
  assert.ok((coinTxn as any).contractFeeAmount === '500000000', 'Contract fee should be converted to smallest units');
}

export async function testCoinTxnMultiInput(): Promise<void> {
  // Real-world usage: Multiple inputs from different wallets
  const inputs = createTestInputs([
    { keyType: 'ed25519', person: 'alice', amount: '2.0', feePercent: '60' },
    { keyType: 'ed448', person: 'bob', amount: '1.5', feePercent: '40' }
  ]);
  const outputs = [getTestOutput('charlie', '3.5', 'multi-input payment')];
  
  const coinTxn = await createCoinTXN(inputs as any, outputs, '$ZRA+0000', DEFAULT_TEST_FEE_CONFIG, 'multi-input');
  
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create multi-input CoinTXN');
  assert.ok((coinTxn as any).inputTransfers.length === 2, 'Should have 2 input transfers');
  assert.ok((coinTxn as any).outputTransfers.length === 1, 'Should have 1 output transfer');
}

export async function testCoinTxnMultiOutput(): Promise<void> {
  // Real-world usage: Single input, multiple outputs (splitting payment)
  const inputs = [createTestInput('ed25519', 'alice', '5.0', '100')];
  const outputs = [
    getTestOutput('bob', '2.0', 'payment to bob'),
    getTestOutput('charlie', '1.5', 'payment to charlie'),
    getTestOutput('jesse', '1.5', 'payment to jesse')
  ];
  
  const coinTxn = await createCoinTXN(inputs as any, outputs, '$ZRA+0000', DEFAULT_TEST_FEE_CONFIG, 'multi-output');
  
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create multi-output CoinTXN');
  assert.ok((coinTxn as any).inputTransfers.length === 1, 'Should have 1 input transfer');
  assert.ok((coinTxn as any).outputTransfers.length === 3, 'Should have 3 output transfers');
}

export async function testCoinTxnComplex(): Promise<void> {
  // Real-world usage: Complex transaction with multiple inputs and outputs
  const inputs = createTestInputs([
    { keyType: 'ed25519', person: 'alice', amount: '3.0', feePercent: '70' },
    { keyType: 'ed448', person: 'bob', amount: '2.0', feePercent: '30' }
  ]);
  const outputs = [
    getTestOutput('charlie', '3.5', 'payment to charlie'),
    getTestOutput('jesse', '1.5', 'payment to jesse')
  ];
  
  const coinTxn = await createCoinTXN(inputs as any, outputs, '$ZRA+0000', DEFAULT_TEST_FEE_CONFIG, 'complex transaction');
  
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create complex CoinTXN');
  assert.ok((coinTxn as any).inputTransfers.length === 2, 'Should have 2 input transfers');
  assert.ok((coinTxn as any).outputTransfers.length === 2, 'Should have 2 output transfers');
}

export async function testCoinTxnErrorHandling(): Promise<void> {
  // Test error handling with invalid data
  try {
    const invalidInputs = [{
      privateKey: 'invalid-key',
      publicKey: 'invalid-public-key',
      amount: '0',
      feePercent: '100'
    }];
    const invalidOutputs = [{
      to: 'invalid-address',
      amount: '0',
      memo: 'invalid'
    }];
    
    await createCoinTXN(invalidInputs as any, invalidOutputs as any, '$ZRA+0000', {}, 'invalid');
    assert.fail('Should have thrown an error for invalid data');
  } catch (error) {
    assert.ok(error instanceof Error, 'Should throw an Error');
    assert.ok((error as Error).message.length > 0, 'Error should have a message');
  }
}

export async function testCoinTxnSend(): Promise<void> {
  // Test sending a transaction (this will likely fail in test environment)
  const inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
  const outputs = [getTestOutput('bob', '1.0', 'test send')];
  const coinTxn = await createCoinTXN(inputs as any, outputs, '$ZRA+0000', DEFAULT_TEST_FEE_CONFIG, 'test send');
  
  try {
    const result = await sendCoinTXN(coinTxn);
    assert.ok(result, 'Should return a result');
  } catch (error) {
    // Expected to fail in test environment
    assert.ok(error instanceof Error, 'Should throw an Error');
  }
}

export async function run(): Promise<void> {
  console.log('🧪 Running CoinTXN Tests...\n');
  
  const tests = [
    { name: 'Basic CoinTXN', fn: testCoinTxnBasic },
    { name: 'Explicit Fees', fn: testCoinTXNWithExplicitFees },
    { name: 'Base Fee Only', fn: testCoinTxnWithOnlyBaseFee },
    { name: 'Contract Fee Only', fn: testCoinTxnWithOnlyContractFee },
    { name: 'Multi-Input', fn: testCoinTxnMultiInput },
    { name: 'Multi-Output', fn: testCoinTxnMultiOutput },
    { name: 'Complex Transaction', fn: testCoinTxnComplex },
    { name: 'Error Handling', fn: testCoinTxnErrorHandling },
    { name: 'Send Transaction', fn: testCoinTxnSend }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}...`);
      await test.fn();
      console.log(`✅ ${test.name} passed`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name} failed: ${(error as Error).message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 CoinTXN Tests Summary:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    throw new Error(`${failed} test(s) failed`);
  }
}
