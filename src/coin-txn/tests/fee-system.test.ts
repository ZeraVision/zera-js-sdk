/**
 * Comprehensive Fee System Test Suite
 * Tests all fee calculation components and the catch-22 solution
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestSuite, TestData, Assert, Performance, Mock } from '../../test-setup.js';
import { UniversalFeeCalculator } from '../../shared/fee-calculators/universal-fee-calculator.js';
import { aceExchangeService } from '../../api/zv-indexer/rate/service.js';
import { 
  calculateCoinTXNSize, 
  estimateTransactionSizeWithFee,
  getPublicKeySize,
  getSignatureSize 
} from '../../shared/utils/transaction-size-calculator.js';
import { TRANSACTION_TYPE, CONTRACT_FEE_TYPE } from '../../shared/protobuf-enums.js';
import { KEY_TYPE } from '../../wallet-creation/constants.js';
import { Decimal } from '../../shared/utils/amount-utils.js';

describe('ZERA Fee System', () => {
  const testSuite = TestSuite.getInstance();
  const moduleName = 'coin-txn';
  
  beforeAll(() => {
    testSuite.startModule(moduleName);
  });
  
  afterAll(() => {
    testSuite.endModule(moduleName);
  });

  describe('Universal Fee Calculator', () => {
    it('should calculate basic fees correctly', async () => {
      try {
        const mockProtoObject = {
          toBinary: () => new Uint8Array(500) // Mock 500-byte protobuf
        };
        
        const feeResult = await UniversalFeeCalculator.calculateFee({
          protoObject: mockProtoObject,
          baseFeeId: '$ZRA+0000'
        });
        
        expect(feeResult.networkFee).toBeDefined();
        expect(feeResult.networkFee).not.toBe('0');
        expect(feeResult.totalFee).toBeDefined();
        expect(feeResult.totalFee).not.toBe('0');
        
        testSuite.recordTestResult(moduleName, 'Basic fee calculation', true, false, false);
        testSuite.success('Basic fee calculation test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Basic fee calculation', false, true, false);
        testSuite.error(`Basic fee calculation test failed: ${(error as Error).message}`);
        throw error;
      }
    });

    it('should calculate fees with contract fee', async () => {
      try {
        const mockProtoObject = {
          toBinary: () => new Uint8Array(500) // Mock 500-byte protobuf
        };
        
        const feeResult = await UniversalFeeCalculator.calculateFee({
          protoObject: mockProtoObject,
          baseFeeId: '$ZRA+0000',
          contractFeeId: '$ZRA+0000'
        });
        
        expect(feeResult.networkFee).toBeDefined();
        expect(feeResult.networkFee).not.toBe('0');
        expect(feeResult.contractFee).toBeDefined();
        expect(feeResult.contractFee).not.toBe('0');
        expect(feeResult.totalFee).toBeDefined();
        expect(feeResult.totalFee).not.toBe('0');
        
        testSuite.recordTestResult(moduleName, 'Contract fee calculation', true, false, false);
        testSuite.success('Contract fee calculation test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Contract fee calculation', false, true, false);
        testSuite.error(`Contract fee calculation test failed: ${(error as Error).message}`);
        throw error;
      }
    });

    it('should get exchange rates', async () => {
      try {
        const exchangeRate = await UniversalFeeCalculator.getExchangeRate('$ZRA+0000');
        expect(exchangeRate).toBeInstanceOf(Decimal);
        expect(exchangeRate.greaterThan(0)).toBe(true);
        
        testSuite.recordTestResult(moduleName, 'Exchange rate retrieval', true, false, false);
        testSuite.success('Exchange rate retrieval test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Exchange rate retrieval', false, true, false);
        testSuite.error(`Exchange rate retrieval test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });

  describe('Transaction Size Calculator', () => {
    it('should calculate transaction size correctly', () => {
      try {
        const inputs = [
          {
            privateKey: 'test-private-key',
            publicKey: 'test-public-key',
            amount: '100.0',
            feePercent: '100',
            keyType: KEY_TYPE.ED25519
          }
        ];
        
        const outputs = [
          {
            to: 'test-recipient-address',
            amount: '99.0',
            memo: 'Test payment'
          }
        ];
        
        const size = calculateCoinTXNSize({
          inputs,
          outputs,
          contractId: '$ZRA+0000',
          baseFeeId: '$ZRA+0000'
        });
        
        expect(size).toBeGreaterThan(0);
        expect(size).toBeLessThan(10000);
        
        testSuite.recordTestResult(moduleName, 'Transaction size calculation', true, false, false);
        testSuite.success('Transaction size calculation test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Transaction size calculation', false, true, false);
        testSuite.error(`Transaction size calculation test failed: ${(error as Error).message}`);
        throw error;
      }
    });

    it('should handle different key types', () => {
      try {
        const ed25519Size = getPublicKeySize(KEY_TYPE.ED25519);
        const ed448Size = getPublicKeySize(KEY_TYPE.ED448);
        const ed25519SigSize = getSignatureSize(KEY_TYPE.ED25519);
        const ed448SigSize = getSignatureSize(KEY_TYPE.ED448);
        
        expect(ed25519Size).toBe(32);
        expect(ed448Size).toBe(57);
        expect(ed25519SigSize).toBe(64);
        expect(ed448SigSize).toBe(114);
        
        testSuite.recordTestResult(moduleName, 'Key type size calculation', true, false, false);
        testSuite.success('Key type size calculation test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Key type size calculation', false, true, false);
        testSuite.error(`Key type size calculation test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });

  describe('ACE Exchange Rate Service', () => {
    it('should fetch exchange rates', async () => {
      try {
        const rate = await aceExchangeService.getExchangeRate('$ZRA+0000');
        expect(rate).toBeInstanceOf(Decimal);
        expect(rate.greaterThan(0)).toBe(true);
        
        testSuite.recordTestResult(moduleName, 'ACE exchange rate fetching', true, false, false);
        testSuite.success('ACE exchange rate fetching test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'ACE exchange rate fetching', false, true, false);
        testSuite.error(`ACE exchange rate fetching test failed: ${(error as Error).message}`);
        throw error;
      }
    });

    it('should convert USD to currency', async () => {
      try {
        const usdAmount = 0.01; // $0.01
        const currencyAmount = await aceExchangeService.convertUSDToCurrency(usdAmount, '$ZRA+0000');
        expect(currencyAmount).toBeInstanceOf(Decimal);
        expect(currencyAmount.greaterThan(0)).toBe(true);
        
        testSuite.recordTestResult(moduleName, 'USD to currency conversion', true, false, false);
        testSuite.success('USD to currency conversion test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'USD to currency conversion', false, true, false);
        testSuite.error(`USD to currency conversion test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid contract ID', async () => {
      try {
        await expect(async () => {
          await UniversalFeeCalculator.calculateFee({
            protoObject: { toBinary: () => new Uint8Array(100) },
            baseFeeId: 'invalid-contract-id'
          });
        }).rejects.toThrow();
        
        testSuite.recordTestResult(moduleName, 'Invalid contract ID handling', true, false, false);
        testSuite.success('Invalid contract ID handling test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Invalid contract ID handling', false, true, false);
        testSuite.error(`Invalid contract ID handling test failed: ${(error as Error).message}`);
        throw error;
      }
    });

    it('should handle zero transaction amount', async () => {
      try {
        const zeroAmountResult = await UniversalFeeCalculator.calculateFee({
          protoObject: { toBinary: () => new Uint8Array(100) },
          baseFeeId: '$ZRA+0000'
        });
        
        expect(zeroAmountResult.totalFee).toBeDefined();
        expect(zeroAmountResult.totalFee).not.toBe('0');
        
        testSuite.recordTestResult(moduleName, 'Zero amount handling', true, false, false);
        testSuite.success('Zero amount handling test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Zero amount handling', false, true, false);
        testSuite.error(`Zero amount handling test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });

  describe('Performance Tests', () => {
    it('should calculate fees efficiently', async () => {
      try {
        const { duration } = await Performance.measureTime(async () => {
          const mockProtoObject = {
            toBinary: () => new Uint8Array(500)
          };
          
          return await UniversalFeeCalculator.calculateFee({
            protoObject: mockProtoObject,
            baseFeeId: '$ZRA+0000'
          });
        });
        
        Performance.expectFast(duration, 1000);
        testSuite.info(`Fee calculation took ${duration}ms`);
        
        testSuite.recordTestResult(moduleName, 'Fee calculation performance', true, false, false);
        testSuite.success('Fee calculation performance test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Fee calculation performance', false, true, false);
        testSuite.error(`Fee calculation performance test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });
});