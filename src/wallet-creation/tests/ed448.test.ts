import { describe, it, expect } from 'vitest';
import {
  createWallet,
  deriveMultipleWallets,
  generateMnemonicPhrase,
  KEY_TYPE,
  HASH_TYPE
} from '../index.js';
import bs58 from 'bs58';

describe('Ed448 Implementation', () => {
  describe('Basic Ed448 wallet creation', () => {
    it('should create a valid Ed448 wallet', async () => {
      const words = generateMnemonicPhrase(12);
      
      const ed448Wallet = await createWallet({
        keyType: KEY_TYPE.ED448,
        hashTypes: [HASH_TYPE.SHA3_512],
        mnemonic: words
      });
      
      expect(ed448Wallet.keyType).toBe('ed448');
      expect(Array.isArray(ed448Wallet.hashTypes)).toBe(true);
      expect(typeof ed448Wallet.address).toBe('string');
      expect(typeof ed448Wallet.derivationPath).toBe('string');
      expect(ed448Wallet.address).toBeTruthy();
      expect(ed448Wallet.derivationPath).toBeTruthy();
    });

    it('should use 57-byte Ed448 private keys', async () => {
      const words = generateMnemonicPhrase(12);
      
      const ed448Wallet = await createWallet({
        keyType: KEY_TYPE.ED448,
        hashTypes: [HASH_TYPE.SHA3_512],
        mnemonic: words
      });
      
      const privateKeyBytes = bs58.decode(ed448Wallet.privateKey);
      expect(privateKeyBytes.length).toBe(57);
    });

    it('should create wallets with different hash types', async () => {
      const words = generateMnemonicPhrase(12);
      const hashTypes = [
        [HASH_TYPE.SHA3_256],
        [HASH_TYPE.BLAKE3],
        [HASH_TYPE.SHA3_512, HASH_TYPE.BLAKE3]
      ];
      
      for (const hashType of hashTypes) {
        const wallet = await createWallet({
          keyType: KEY_TYPE.ED448,
          hashTypes: hashType,
          mnemonic: words
        });
        
        expect(typeof wallet.address).toBe('string');
        expect(wallet.address).toBeTruthy();
      }
    });
  });

  describe('HD wallet derivation', () => {
    it('should derive multiple Ed448 addresses from same mnemonic', async () => {
      const words = generateMnemonicPhrase(12);
      
      const multipleWallets = await deriveMultipleWallets({
        mnemonic: words,
        keyType: KEY_TYPE.ED448,
        hashTypes: [HASH_TYPE.SHA3_256],
        count: 3,
        hdOptions: {
          accountIndex: 0,
          changeIndex: 0,
          addressIndex: 0
        }
      });
      
      expect(Array.isArray(multipleWallets)).toBe(true);
      expect(multipleWallets.length).toBe(3);
      
      // Verify all addresses are unique
      const uniqueAddresses = new Set(multipleWallets.map(w => w.address));
      expect(uniqueAddresses.size).toBe(3);
      
      // Verify each wallet has valid properties
      multipleWallets.forEach((wallet, i) => {
        expect(typeof wallet.address).toBe('string');
        expect(wallet.address).toBeTruthy();
        expect(typeof wallet.derivationPath).toBe('string');
        expect(wallet.derivationPath).toBeTruthy();
      });
    });
  });

  describe('Performance', () => {
    it('should create wallets within reasonable time', async () => {
      const iterations = 3;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        await createWallet({
          keyType: KEY_TYPE.ED448,
          hashTypes: [HASH_TYPE.SHA3_512],
          mnemonic: generateMnemonicPhrase(12)
        });
      }
      
      const duration = Date.now() - startTime;
      const avgTime = duration / iterations;
      
      expect(duration).toBeLessThan(10000); // Should be under 10 seconds for 3 iterations
      expect(avgTime).toBeLessThan(2000); // Average should be under 2 seconds
    });
  });
});