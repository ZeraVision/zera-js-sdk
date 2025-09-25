import { describe, it, expect, beforeAll } from 'vitest';
import { TestSuite, TestData, Assert, Performance, Mock } from '../../test-setup.js';
import { createCoinTXN } from '../transaction.js';
import { createWallet, generateMnemonicPhrase, KEY_TYPE, HASH_TYPE } from '../../wallet-creation/index.js';
import type { CoinTXNInput, CoinTXNOutput, Wallet } from '../../types/index.js';

describe('ZERA Coin Transaction', () => {
  const testSuite = TestSuite.getInstance();
  let testWallet: Wallet;
  
  beforeAll(async () => {
    testSuite.log('Setting up coin transaction tests');
    
    // Create a test wallet
    const mnemonic = generateMnemonicPhrase(12);
    testWallet = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic
    });
    
    testSuite.log(`Created test wallet: ${testWallet.address}`);
  });
  
  describe('Basic Transaction Creation', () => {
    it('should create a basic coin transaction', async () => {
      const inputs: CoinTXNInput[] = [{
        address: testWallet.address,
        amount: '100',
        contractId: '$ZRA+0000',
        publicKey: testWallet.publicKey,
        privateKey: testWallet.privateKey
      }];
      
      const outputs: CoinTXNOutput[] = [{
        address: 'recipient-address-123',
        amount: '50',
        contractId: '$ZRA+0000'
      }];
      
      const { duration } = await Performance.measureTime(async () => {
        const transaction = await createCoinTXN(
          '$ZRA+0000',
          inputs,
          outputs,
          {
            baseFeeId: '$ZRA+0000',
            baseFee: '1',
            memo: 'Test transaction'
          }
        );
        
        expect(transaction).toBeDefined();
        expect(transaction.base).toBeDefined();
        expect(transaction.auth).toBeDefined();
        expect(transaction.inputTransfers).toBeDefined();
        expect(transaction.outputTransfers).toBeDefined();
        
        return transaction;
      });
      
      Performance.expectFast(duration, 1000);
      testSuite.log(`Transaction creation took ${duration}ms`);
    });
    
    it('should handle multiple inputs and outputs', async () => {
      const inputs: CoinTXNInput[] = [
        {
          address: testWallet.address,
          amount: '100',
          contractId: '$ZRA+0000',
          publicKey: testWallet.publicKey,
          privateKey: testWallet.privateKey
        },
        {
          address: testWallet.address,
          amount: '50',
          contractId: '$ZRA+0000',
          publicKey: testWallet.publicKey,
          privateKey: testWallet.privateKey
        }
      ];
      
      const outputs: CoinTXNOutput[] = [
        {
          address: 'recipient-1',
          amount: '75',
          contractId: '$ZRA+0000'
        },
        {
          address: 'recipient-2',
          amount: '25',
          contractId: '$ZRA+0000'
        }
      ];
      
      const transaction = await createCoinTXN(
        '$ZRA+0000',
        inputs,
        outputs,
        {
          baseFeeId: '$ZRA+0000',
          baseFee: '2',
          memo: 'Multi-input/output transaction'
        }
      );
      
      expect(transaction.inputTransfers).toHaveLength(2);
      expect(transaction.outputTransfers).toHaveLength(2);
    });
  });
  
  describe('Transaction Validation', () => {
    it('should validate input amounts', async () => {
      const inputs: CoinTXNInput[] = [{
        address: testWallet.address,
        amount: '0', // Invalid amount
        contractId: '$ZRA+0000',
        publicKey: testWallet.publicKey,
        privateKey: testWallet.privateKey
      }];
      
      const outputs: CoinTXNOutput[] = [{
        address: 'recipient',
        amount: '50',
        contractId: '$ZRA+0000'
      }];
      
      await expect(async () => {
        await createCoinTXN(
          '$ZRA+0000',
          inputs,
          outputs,
          {
            baseFeeId: '$ZRA+0000',
            baseFee: '1'
          }
        );
      }).rejects.toThrow();
    });
    
    it('should validate output amounts', async () => {
      const inputs: CoinTXNInput[] = [{
        address: testWallet.address,
        amount: '100',
        contractId: '$ZRA+0000',
        publicKey: testWallet.publicKey,
        privateKey: testWallet.privateKey
      }];
      
      const outputs: CoinTXNOutput[] = [{
        address: 'recipient',
        amount: '-10', // Invalid negative amount
        contractId: '$ZRA+0000'
      }];
      
      await expect(async () => {
        await createCoinTXN(
          '$ZRA+0000',
          inputs,
          outputs,
          {
            baseFeeId: '$ZRA+0000',
            baseFee: '1'
          }
        );
      }).rejects.toThrow();
    });
  });
  
  describe('Fee Calculation', () => {
    it('should calculate fees correctly', async () => {
      const inputs: CoinTXNInput[] = [{
        address: testWallet.address,
        amount: '1000',
        contractId: '$ZRA+0000',
        publicKey: testWallet.publicKey,
        privateKey: testWallet.privateKey
      }];
      
      const outputs: CoinTXNOutput[] = [{
        address: 'recipient',
        amount: '900',
        contractId: '$ZRA+0000'
      }];
      
      const transaction = await createCoinTXN(
        '$ZRA+0000',
        inputs,
        outputs,
        {
          baseFeeId: '$ZRA+0000',
          baseFee: '10',
          memo: 'Fee calculation test'
        }
      );
      
      expect(transaction.base).toBeDefined();
      expect(transaction.base.fee).toBeDefined();
      expect(transaction.base.fee).toBe('10');
    });
    
    it('should handle different fee currencies', async () => {
      const inputs: CoinTXNInput[] = [{
        address: testWallet.address,
        amount: '100',
        contractId: '$ZRA+0000',
        publicKey: testWallet.publicKey,
        privateKey: testWallet.privateKey
      }];
      
      const outputs: CoinTXNOutput[] = [{
        address: 'recipient',
        amount: '90',
        contractId: '$ZRA+0000'
      }];
      
      const transaction = await createCoinTXN(
        '$ZRA+0000',
        inputs,
        outputs,
        {
          baseFeeId: '$USDC+0000',
          baseFee: '5',
          memo: 'USD fee test'
        }
      );
      
      expect(transaction.base.feeId).toBe('$USDC+0000');
      expect(transaction.base.fee).toBe('5');
    });
  });
  
  describe('Performance Tests', () => {
    it('should create transactions efficiently', async () => {
      const { duration } = await Performance.measureTime(async () => {
        const transactions = await Promise.all(
          TestData.generateRandomArray(async () => {
            const inputs: CoinTXNInput[] = [{
              address: testWallet.address,
              amount: '100',
              contractId: '$ZRA+0000',
              publicKey: testWallet.publicKey,
              privateKey: testWallet.privateKey
            }];
            
            const outputs: CoinTXNOutput[] = [{
              address: TestData.generateRandomString(20),
              amount: '90',
              contractId: '$ZRA+0000'
            }];
            
            return await createCoinTXN(
              '$ZRA+0000',
              inputs,
              outputs,
              {
                baseFeeId: '$ZRA+0000',
                baseFee: '1'
              }
            );
          }, 5)
        );
        
        expect(transactions).toHaveLength(5);
        return transactions;
      });
      
      Performance.expectFast(duration, 3000);
      testSuite.log(`Created 5 transactions in ${duration}ms`);
    });
  });
  
  describe('Mock Testing', () => {
    it('should work with mock transaction data', () => {
      const mockTransaction = Mock.createMockTransaction({
        id: 'mock-tx-123',
        amount: '100',
        fee: '1'
      });
      
      expect(mockTransaction.id).toBe('mock-tx-123');
      expect(mockTransaction.amount).toBe('100');
      expect(mockTransaction.fee).toBe('1');
    });
  });
});
