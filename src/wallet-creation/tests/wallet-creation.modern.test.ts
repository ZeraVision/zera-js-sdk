import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestSuite, TestData, Assert, Performance, Mock } from '../../test-setup.js';
import { createWallet, generateMnemonicPhrase, KEY_TYPE, HASH_TYPE } from '../index.js';
import type { Wallet } from '../../types/index.js';

describe('ZERA Wallet Creation', () => {
  const testSuite = TestSuite.getInstance();
  
  beforeAll(() => {
    testSuite.log('Setting up wallet creation tests');
  });
  
  afterAll(() => {
    testSuite.log('Cleaning up wallet creation tests');
  });
  
  describe('Basic Wallet Creation', () => {
    it('should create a basic Ed25519 wallet', async () => {
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
    });
    
    it('should create a basic Ed448 wallet', async () => {
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
    });
  });
  
  describe('Mnemonic Generation', () => {
    it('should generate valid 12-word mnemonic', () => {
      const mnemonic = generateMnemonicPhrase(12);
      Assert.isValidMnemonic(mnemonic);
      expect(mnemonic.split(' ')).toHaveLength(12);
    });
    
    it('should generate valid 24-word mnemonic', () => {
      const mnemonic = generateMnemonicPhrase(24);
      Assert.isValidMnemonic(mnemonic);
      expect(mnemonic.split(' ')).toHaveLength(24);
    });
    
    it('should generate different mnemonics', () => {
      const mnemonic1 = generateMnemonicPhrase(12);
      const mnemonic2 = generateMnemonicPhrase(12);
      expect(mnemonic1).not.toBe(mnemonic2);
    });
  });
  
  describe('Performance Tests', () => {
    it('should create wallet quickly', async () => {
      const { duration } = await Performance.measureTime(async () => {
        const mnemonic = generateMnemonicPhrase(12);
        return await createWallet({
          keyType: KEY_TYPE.ED25519,
          hashTypes: [HASH_TYPE.SHA3_256],
          mnemonic
        });
      });
      
      Performance.expectFast(duration, 500);
      testSuite.log(`Wallet creation took ${duration}ms`);
    });
    
    it('should generate mnemonic very quickly', async () => {
      const { duration } = await Performance.measureTime(() => {
        return generateMnemonicPhrase(12);
      });
      
      Performance.expectVeryFast(duration, 50);
      testSuite.log(`Mnemonic generation took ${duration}ms`);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid mnemonic length', async () => {
      await expect(async () => {
        await createWallet({
          keyType: KEY_TYPE.ED25519,
          hashTypes: [HASH_TYPE.SHA3_256],
          mnemonic: 'invalid mnemonic length'
        });
      }).rejects.toThrow();
    });
    
    it('should handle invalid key type', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      await expect(async () => {
        await createWallet({
          // @ts-expect-error: Intentionally testing invalid keyType for validation
          keyType: 'invalid' as any,
          hashTypes: [HASH_TYPE.SHA3_256],
          mnemonic
        });
      }).rejects.toThrow();
    });
  });
  
  describe('Batch Operations', () => {
    it('should create multiple wallets efficiently', async () => {
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
      testSuite.log(`Created 10 wallets in ${duration}ms`);
    });
  });
  
  describe('Mock Testing', () => {
    it('should work with mock data', () => {
      const mockWallet = Mock.createMockWallet({
        address: 'custom-mock-address',
        type: 'custom-mock'
      });
      
      expect(mockWallet.address).toBe('custom-mock-address');
      expect(mockWallet.type).toBe('custom-mock');
      Assert.isWallet(mockWallet);
    });
  });
});
