import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestSuite, TestData, Assert, Performance, Mock } from '../../test-setup.js';
import { createWallet, generateMnemonicPhrase, KEY_TYPE, HASH_TYPE } from '../index.js';
import type { Wallet } from '../../types/index.js';

describe('ZERA Wallet Creation Module', () => {
  const testSuite = TestSuite.getInstance();
  const moduleName = 'wallet-creation';
  
  beforeAll(() => {
    testSuite.startModule(moduleName);
  });
  
  afterAll(() => {
    testSuite.endModule(moduleName);
  });
  
  describe('Basic Wallet Creation', () => {
    it('should create a basic Ed25519 wallet', async () => {
      try {
        const mnemonic = generateMnemonicPhrase(12);
        const wallet = await createWallet({
          keyType: KEY_TYPE.ED25519,
          hashTypes: [HASH_TYPE.SHA3_256],
          mnemonic
        });
        
        Assert.isWallet(wallet);
        Assert.isValidAddress(wallet.address);
        Assert.isValidPrivateKey(wallet.privateKey);
        Assert.isValidPublicKey(wallet.publicKey);
        expect(wallet.type).toBe('hd');
        expect(wallet.keyType).toBe(KEY_TYPE.ED25519);
        
        testSuite.recordTestResult(moduleName, 'Ed25519 wallet creation', true, false, false);
        testSuite.success('Ed25519 wallet creation test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Ed25519 wallet creation', false, true, false);
        testSuite.error(`Ed25519 wallet creation test failed: ${(error as Error).message}`);
        throw error;
      }
    });
    
    it('should create a basic Ed448 wallet', async () => {
      try {
        const mnemonic = generateMnemonicPhrase(12);
        const wallet = await createWallet({
          keyType: KEY_TYPE.ED448,
          hashTypes: [HASH_TYPE.SHA3_512],
          mnemonic
        });
        
        Assert.isWallet(wallet);
        Assert.isValidAddress(wallet.address);
        Assert.isValidPrivateKey(wallet.privateKey);
        Assert.isValidPublicKey(wallet.publicKey);
        expect(wallet.type).toBe('hd');
        expect(wallet.keyType).toBe(KEY_TYPE.ED448);
        
        testSuite.recordTestResult(moduleName, 'Ed448 wallet creation', true, false, false);
        testSuite.success('Ed448 wallet creation test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Ed448 wallet creation', false, true, false);
        testSuite.error(`Ed448 wallet creation test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });
  
  describe('Mnemonic Generation', () => {
    it('should generate valid 12-word mnemonic', () => {
      try {
        const mnemonic = generateMnemonicPhrase(12);
        Assert.isValidMnemonic(mnemonic);
        expect(mnemonic.split(' ')).toHaveLength(12);
        
        testSuite.recordTestResult(moduleName, '12-word mnemonic generation', true, false, false);
        testSuite.success('12-word mnemonic generation test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, '12-word mnemonic generation', false, true, false);
        testSuite.error(`12-word mnemonic generation test failed: ${(error as Error).message}`);
        throw error;
      }
    });
    
    it('should generate valid 24-word mnemonic', () => {
      try {
        const mnemonic = generateMnemonicPhrase(24);
        Assert.isValidMnemonic(mnemonic);
        expect(mnemonic.split(' ')).toHaveLength(24);
        
        testSuite.recordTestResult(moduleName, '24-word mnemonic generation', true, false, false);
        testSuite.success('24-word mnemonic generation test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, '24-word mnemonic generation', false, true, false);
        testSuite.error(`24-word mnemonic generation test failed: ${(error as Error).message}`);
        throw error;
      }
    });
    
    it('should generate different mnemonics', () => {
      try {
        const mnemonic1 = generateMnemonicPhrase(12);
        const mnemonic2 = generateMnemonicPhrase(12);
        expect(mnemonic1).not.toBe(mnemonic2);
        
        testSuite.recordTestResult(moduleName, 'Different mnemonic generation', true, false, false);
        testSuite.success('Different mnemonic generation test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Different mnemonic generation', false, true, false);
        testSuite.error(`Different mnemonic generation test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });
  
  describe('Performance Tests', () => {
    it('should create wallet quickly', async () => {
      try {
        const { duration } = await Performance.measureTime(async () => {
          const mnemonic = generateMnemonicPhrase(12);
          return await createWallet({
            keyType: KEY_TYPE.ED25519,
            hashTypes: [HASH_TYPE.SHA3_256],
            mnemonic
          });
        });
        
        Performance.expectFast(duration, 500);
        testSuite.info(`Wallet creation took ${duration}ms`);
        
        testSuite.recordTestResult(moduleName, 'Wallet creation performance', true, false, false);
        testSuite.success('Wallet creation performance test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Wallet creation performance', false, true, false);
        testSuite.error(`Wallet creation performance test failed: ${(error as Error).message}`);
        throw error;
      }
    });
    
    it('should generate mnemonic very quickly', async () => {
      try {
        const { duration } = await Performance.measureTime(() => {
          return generateMnemonicPhrase(12);
        });
        
        Performance.expectVeryFast(duration, 50);
        testSuite.info(`Mnemonic generation took ${duration}ms`);
        
        testSuite.recordTestResult(moduleName, 'Mnemonic generation performance', true, false, false);
        testSuite.success('Mnemonic generation performance test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Mnemonic generation performance', false, true, false);
        testSuite.error(`Mnemonic generation performance test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid mnemonic length', async () => {
      try {
        await expect(async () => {
          await createWallet({
            keyType: KEY_TYPE.ED25519,
            hashTypes: [HASH_TYPE.SHA3_256],
            mnemonic: 'invalid mnemonic length'
          });
        }).rejects.toThrow();
        
        testSuite.recordTestResult(moduleName, 'Invalid mnemonic length error handling', true, false, false);
        testSuite.success('Invalid mnemonic length error handling test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Invalid mnemonic length error handling', false, true, false);
        testSuite.error(`Invalid mnemonic length error handling test failed: ${(error as Error).message}`);
        throw error;
      }
    });
    
    it('should handle invalid key type', async () => {
      try {
        const mnemonic = generateMnemonicPhrase(12);
        await expect(async () => {
        await createWallet({
          // @ts-expect-error: Intentionally testing invalid keyType for validation
          keyType: 'invalid' as any,
          hashTypes: [HASH_TYPE.SHA3_256],
          mnemonic
        });
        }).rejects.toThrow();
        
        testSuite.recordTestResult(moduleName, 'Invalid key type error handling', true, false, false);
        testSuite.success('Invalid key type error handling test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Invalid key type error handling', false, true, false);
        testSuite.error(`Invalid key type error handling test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });
  
  describe('Batch Operations', () => {
    it('should create multiple wallets efficiently', async () => {
      try {
        const { duration } = await Performance.measureTime(async () => {
          const wallets = await Promise.all(
            TestData.generateRandomArray(async () => {
              const mnemonic = generateMnemonicPhrase(12);
              return await createWallet({
                keyType: KEY_TYPE.ED25519,
                hashTypes: [HASH_TYPE.SHA3_256],
                mnemonic
              });
            }, 10)
          );
          
          expect(wallets).toHaveLength(10);
          wallets.forEach(Assert.isWallet);
          
          return wallets;
        });
        
        Performance.expectFast(duration, 2000);
        testSuite.info(`Created 10 wallets in ${duration}ms`);
        
        testSuite.recordTestResult(moduleName, 'Multiple wallet creation', true, false, false);
        testSuite.success('Multiple wallet creation test passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Multiple wallet creation', false, true, false);
        testSuite.error(`Multiple wallet creation test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });
  
  describe('Mock Testing', () => {
    it('should work with mock data', () => {
      try {
        const mockWallet = Mock.createMockWallet({
          address: 'custom-mock-address',
          type: 'custom-mock'
        });
        
        expect(mockWallet.address).toBe('custom-mock-address');
        expect(mockWallet.type).toBe('custom-mock');
        Assert.isWallet(mockWallet);
        
        testSuite.recordTestResult(moduleName, 'Mock wallet testing', true, false, false);
        testSuite.success('Mock wallet testing passed');
      } catch (error) {
        testSuite.recordTestResult(moduleName, 'Mock wallet testing', false, true, false);
        testSuite.error(`Mock wallet testing failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });
});
