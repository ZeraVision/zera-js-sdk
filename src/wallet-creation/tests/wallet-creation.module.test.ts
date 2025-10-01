import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createWallet, generateMnemonicPhrase, KEY_TYPE, HASH_TYPE } from '../index.js';
import type { Wallet } from '../../types/index.js';

describe('ZERA Wallet Creation Module', () => {
  const moduleName = 'wallet-creation';
  
  beforeAll(() => {
    console.log(`Starting ${moduleName} tests`);
  });
  
  afterAll(() => {
    console.log(`Ending ${moduleName} tests`);
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
        
        // Basic wallet structure validation
        expect(wallet).toBeDefined();
        expect(typeof wallet.address).toBe('string');
        expect(typeof wallet.privateKey).toBe('string');
        expect(typeof wallet.publicKey).toBe('string');
        expect(wallet.type).toBe('hd');
        expect(wallet.keyType).toBe(KEY_TYPE.ED25519);
        
        console.log('Ed25519 wallet creation test passed');
      } catch (error) {
        console.error(`Ed25519 wallet creation test failed: ${(error as Error).message}`);
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
        
        // Basic wallet structure validation
        expect(wallet).toBeDefined();
        expect(typeof wallet.address).toBe('string');
        expect(typeof wallet.privateKey).toBe('string');
        expect(typeof wallet.publicKey).toBe('string');
        expect(wallet.type).toBe('hd');
        expect(wallet.keyType).toBe(KEY_TYPE.ED448);
        
        console.log('Ed448 wallet creation test passed');
      } catch (error) {
        console.error(`Ed448 wallet creation test failed: ${(error as Error).message}`);
        throw error;
      }
    });
  });

  describe('Module Integration', () => {
    it('should handle multiple wallet types in sequence', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      
      // Create Ed25519 wallet
      const ed25519Wallet = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      expect(ed25519Wallet.keyType).toBe(KEY_TYPE.ED25519);
      
      // Create Ed448 wallet with same mnemonic
      const ed448Wallet = await createWallet({
        keyType: KEY_TYPE.ED448,
        hashTypes: [HASH_TYPE.SHA3_512],
        mnemonic
      });
      
      expect(ed448Wallet.keyType).toBe(KEY_TYPE.ED448);
      
      // Wallets should have different addresses
      expect(ed25519Wallet.address).not.toBe(ed448Wallet.address);
    });

    it('should handle different hash combinations', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      
      const hashCombinations = [
        [HASH_TYPE.SHA3_256],
        [HASH_TYPE.SHA3_512],
        [HASH_TYPE.BLAKE3],
        [HASH_TYPE.SHA3_256, HASH_TYPE.BLAKE3],
        [HASH_TYPE.SHA3_512, HASH_TYPE.BLAKE3]
      ];
      
      for (const hashTypes of hashCombinations) {
        const wallet = await createWallet({
          keyType: KEY_TYPE.ED25519,
          hashTypes,
          mnemonic
        });
        
        expect(wallet.hashTypes).toEqual(hashTypes);
        expect(wallet.address).toBeTruthy();
      }
    });
  });

  describe('Module Error Handling', () => {
    it('should handle invalid parameters gracefully', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      
      // Test invalid key type
      await expect(createWallet({
        keyType: 'invalid' as any,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      })).rejects.toThrow();
      
      // Test invalid hash type
      await expect(createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: ['invalid' as any],
        mnemonic
      })).rejects.toThrow();
      
      // Test invalid mnemonic
      await expect(createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic: 'invalid mnemonic'
      })).rejects.toThrow();
    });
  });

  describe('Module Performance', () => {
    it('should create wallets efficiently', async () => {
      const startTime = Date.now();
      const iterations = 5;
      
      for (let i = 0; i < iterations; i++) {
        const mnemonic = generateMnemonicPhrase(12);
        await createWallet({
          keyType: KEY_TYPE.ED25519,
          hashTypes: [HASH_TYPE.SHA3_256],
          mnemonic
        });
      }
      
      const duration = Date.now() - startTime;
      const avgTime = duration / iterations;
      
      expect(duration).toBeLessThan(10000); // Should complete in under 10 seconds
      expect(avgTime).toBeLessThan(2000); // Average should be under 2 seconds
      
      console.log(`Created ${iterations} wallets in ${duration}ms (avg: ${avgTime.toFixed(2)}ms)`);
    });
  });

  describe('Module Consistency', () => {
    it('should produce consistent results for same inputs', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      
      const wallet1 = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      const wallet2 = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      // Same inputs should produce same outputs
      expect(wallet1.address).toBe(wallet2.address);
      expect(wallet1.privateKey).toBe(wallet2.privateKey);
      expect(wallet1.publicKey).toBe(wallet2.publicKey);
      expect(wallet1.derivationPath).toBe(wallet2.derivationPath);
    });

    it('should produce different results for different inputs', async () => {
      const mnemonic1 = generateMnemonicPhrase(12);
      const mnemonic2 = generateMnemonicPhrase(12);
      
      const wallet1 = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic: mnemonic1
      });
      
      const wallet2 = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic: mnemonic2
      });
      
      // Different inputs should produce different outputs
      expect(wallet1.address).not.toBe(wallet2.address);
      expect(wallet1.privateKey).not.toBe(wallet2.privateKey);
      expect(wallet1.publicKey).not.toBe(wallet2.publicKey);
    });
  });
});