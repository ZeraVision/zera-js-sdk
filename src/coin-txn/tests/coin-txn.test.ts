/**
 * Coin Transaction Test Suite
 * Tests coin transaction creation and validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestSuite, TestData, Assert, Performance, Mock } from '../../test-setup.js';
import { assert } from '../../test-utils/index.js';
import { createCoinTXN, sendCoinTXN } from '../index.js';
import { ED25519_TEST_KEYS, ED448_TEST_KEYS, TEST_WALLET_ADDRESSES } from '../../test-utils/keys.test.js';
import type { CoinTXNInput, CoinTXNOutput, FeeConfig } from '../../types/index.js';

describe('ZERA Coin Transactions', () => {
  const testSuite = TestSuite.getInstance();
  const moduleName = 'coin-txn';
  
  // Test fee configuration
  const testFeeConfig: FeeConfig = {
    baseFeeId: '$ZRA+0000',
    baseFee: '0.001',
    contractFeeId: '$ZRA+0000',
    contractFee: '0.0005'
  };
  
  // Helper function to create test input
  function createTestInput(keyType: 'ed25519' | 'ed448', person: 'alice' | 'bob' | 'charlie', amount: string, feePercent: string = '100'): CoinTXNInput {
    const keys = keyType === 'ed448' ? ED448_TEST_KEYS : ED25519_TEST_KEYS;
    const keyPair = keys[person];
    
    if (!keyPair) {
      throw new Error(`No test keys found for ${keyType} ${person}`);
    }
    
    return {
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      amount,
      feePercent
    };
  }
  
  // Helper function to create test output
  function getTestOutput(person: 'alice' | 'bob' | 'charlie' | 'jesse', amount: string, memo: string = ''): CoinTXNOutput {
    const address = TEST_WALLET_ADDRESSES[person];
    
    if (!address) {
      throw new Error(`No test address found for ${person}`);
    }
    
    const output: CoinTXNOutput = {
      to: address,
      amount
    };
    
    if (memo) {
      output.memo = memo;
    }
    
    return output;
  }
  
  // Helper function to create multiple test inputs
  function createTestInputs(inputSpecs: Array<{keyType: 'ed25519' | 'ed448', person: 'alice' | 'bob' | 'charlie', amount: string, feePercent?: string}>): CoinTXNInput[] {
    return inputSpecs.map(spec => 
      createTestInput(spec.keyType, spec.person, spec.amount, spec.feePercent)
    );
  }
  
  beforeAll(() => {
    testSuite.startModule(moduleName);
  });
  
  afterAll(() => {
    testSuite.endModule(moduleName);
  });

  describe('Basic Transaction Creation', () => {
    it('should create basic coin transaction', async () => {
      try {
        const inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
        const outputs = [getTestOutput('bob', '1.0', 'payment')];
        const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', {}, 'memo');
        
        expect(coinTxn.$typeName).toBe('zera_txn.CoinTXN');
        
        testSuite.recordTestResult(moduleName, 'Basic coin transaction creation', true, false, false);
        testSuite.success('Basic coin transaction creation test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Basic coin transaction creation', false, true, false);
        testSuite.error(`Basic coin transaction creation test failed: ${(error as Error).message}`);
        throw error;
      }
    });

    it('should create transaction with explicit fees', async () => {
      try {
        const inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
        const outputs = [getTestOutput('bob', '1.0', 'payment')];
        const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', DEFAULT_TEST_FEE_CONFIG, 'memo with fees');
        
        expect(coinTxn.$typeName).toBe('zera_txn.CoinTXN');
        expect(coinTxn.base).toBeDefined();
        expect((coinTxn.base as any).feeAmount).toBe('1000000');
        expect((coinTxn as any).contractFeeAmount).toBe('500000');
        
        testSuite.recordTestResult(moduleName, 'Transaction with explicit fees', true, false, false);
        testSuite.success('Transaction with explicit fees test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Transaction with explicit fees', false, true, false);
        testSuite.error(`Transaction with explicit fees test failed: ${(error as Error).message}`);
        throw error;
      }
    });

    it('should create transaction with only base fee', async () => {
      try {
        const inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
        const outputs = [getTestOutput('bob', '1.0', 'payment')];
        const feeConfig = { 
          baseFeeId: '$ZRA+0000',
          baseFee: '1.002',
          contractFeeId: '$ZRA+0000',
          contractFee: 'auto'
        };
        
        const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', feeConfig, 'base fee only');
        
        expect(coinTxn.$typeName).toBe('zera_txn.CoinTXN');
        expect(coinTxn.base).toBeDefined();
        expect((coinTxn.base as any).feeAmount).toBe('1002000000');
        
        testSuite.recordTestResult(moduleName, 'Transaction with base fee only', true, false, false);
        testSuite.success('Transaction with base fee only test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Transaction with base fee only', false, true, false);
        testSuite.error(`Transaction with base fee only test failed: ${(error as Error).message}`);
        throw error;
      }
    });

    it('should create transaction with only contract fee', async () => {
      try {
        const inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
        const outputs = [getTestOutput('bob', '1.0', 'payment')];
        const feeConfig = { 
          baseFeeId: '$ZRA+0000',
          baseFee: 'auto',
          contractFeeId: '$ZRA+0000',
          contractFee: '0.5'
        };
        
        const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', feeConfig, 'contract fee only');
        
        expect(coinTxn.$typeName).toBe('zera_txn.CoinTXN');
        expect(coinTxn.base).toBeDefined();
        expect((coinTxn as any).contractFeeAmount).toBe('500000000');
        
        testSuite.recordTestResult(moduleName, 'Transaction with contract fee only', true, false, false);
        testSuite.success('Transaction with contract fee only test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Transaction with contract fee only', false, true, false);
        testSuite.error(`Transaction with contract fee only test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });

  describe('Multi-Input Transactions', () => {
    it('should create multi-input transaction', async () => {
      try {
        const inputs = createTestInputs([
          { keyType: 'ed25519', person: 'alice', amount: '2.0', feePercent: '60' },
          { keyType: 'ed448', person: 'bob', amount: '1.5', feePercent: '40' }
        ]);
        const outputs = [getTestOutput('charlie', '3.5', 'multi-input payment')];
        
        const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', DEFAULT_TEST_FEE_CONFIG, 'multi-input');
        
        expect(coinTxn.$typeName).toBe('zera_txn.CoinTXN');
        expect((coinTxn as any).inputTransfers.length).toBe(2);
        expect((coinTxn as any).outputTransfers.length).toBe(1);
        
        testSuite.recordTestResult(moduleName, 'Multi-input transaction creation', true, false, false);
        testSuite.success('Multi-input transaction creation test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Multi-input transaction creation', false, true, false);
        testSuite.error(`Multi-input transaction creation test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });

  describe('Multi-Output Transactions', () => {
    it('should create multi-output transaction', async () => {
      try {
        const inputs = [createTestInput('ed25519', 'alice', '5.0', '100')];
        const outputs = [
          getTestOutput('bob', '2.0', 'payment to bob'),
          getTestOutput('charlie', '1.5', 'payment to charlie'),
          getTestOutput('jesse', '1.5', 'payment to jesse')
        ];
        
        const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', DEFAULT_TEST_FEE_CONFIG, 'multi-output');
        
        expect(coinTxn.$typeName).toBe('zera_txn.CoinTXN');
        expect((coinTxn as any).inputTransfers.length).toBe(1);
        expect((coinTxn as any).outputTransfers.length).toBe(3);
        
        testSuite.recordTestResult(moduleName, 'Multi-output transaction creation', true, false, false);
        testSuite.success('Multi-output transaction creation test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Multi-output transaction creation', false, true, false);
        testSuite.error(`Multi-output transaction creation test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });

  describe('Complex Transactions', () => {
    it('should create complex multi-input/output transaction', async () => {
      try {
        const inputs = createTestInputs([
          { keyType: 'ed25519', person: 'alice', amount: '3.0', feePercent: '70' },
          { keyType: 'ed448', person: 'bob', amount: '2.0', feePercent: '30' }
        ]);
        const outputs = [
          getTestOutput('charlie', '3.5', 'payment to charlie'),
          getTestOutput('jesse', '1.5', 'payment to jesse')
        ];
        
        const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', DEFAULT_TEST_FEE_CONFIG, 'complex transaction');
        
        expect(coinTxn.$typeName).toBe('zera_txn.CoinTXN');
        expect((coinTxn as any).inputTransfers.length).toBe(2);
        expect((coinTxn as any).outputTransfers.length).toBe(2);
        
        testSuite.recordTestResult(moduleName, 'Complex transaction creation', true, false, false);
        testSuite.success('Complex transaction creation test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Complex transaction creation', false, true, false);
        testSuite.error(`Complex transaction creation test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid transaction data', async () => {
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
        
        await expect(async () => {
          await createCoinTXN(invalidInputs, invalidOutputs, '$ZRA+0000', {}, 'invalid');
        }).rejects.toThrow();
        
        testSuite.recordTestResult(moduleName, 'Invalid data error handling', true, false, false);
        testSuite.success('Invalid data error handling test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Invalid data error handling', false, true, false);
        testSuite.error(`Invalid data error handling test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });

  describe('Transaction Sending', () => {
    it('should handle transaction sending (expected to fail in test environment)', async () => {
      try {
        const inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
        const outputs = [getTestOutput('bob', '1.0', 'test send')];
        const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', DEFAULT_TEST_FEE_CONFIG, 'test send');
        
        // This will likely fail in test environment, which is expected
        await expect(async () => {
          await sendCoinTXN(coinTxn);
        }).rejects.toThrow();
        
        testSuite.recordTestResult(moduleName, 'Transaction sending error handling', true, false, false);
        testSuite.success('Transaction sending error handling test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Transaction sending error handling', false, true, false);
        testSuite.error(`Transaction sending error handling test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });

  describe('Performance Tests', () => {
    it('should create transactions efficiently', async () => {
      try {
        const { duration } = await Performance.measureTime(async () => {
          const inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
          const outputs = [getTestOutput('bob', '1.0', 'performance test')];
          return await createCoinTXN(inputs, outputs, '$ZRA+0000', DEFAULT_TEST_FEE_CONFIG, 'performance test');
        });
        
        Performance.expectFast(duration, 1000);
        testSuite.info(`Transaction creation took ${duration}ms`);
        
        testSuite.recordTestResult(moduleName, 'Transaction creation performance', true, false, false);
        testSuite.success('Transaction creation performance test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Transaction creation performance', false, true, false);
        testSuite.error(`Transaction creation performance test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });
});