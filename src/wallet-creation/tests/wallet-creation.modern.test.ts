import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createWallet, generateMnemonicPhrase, KEY_TYPE, HASH_TYPE } from '../index.js';
import type { Wallet } from '../../types/index.js';

describe('ZERA Wallet Creation', () => {
  beforeAll(() => {
    console.log('Setting up wallet creation tests');
  });
  
  afterAll(() => {
    console.log('Cleaning up wallet creation tests');
  });
  
  describe('Basic Wallet Creation', () => {
    it('should create a basic Ed25519 wallet', async () => {
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
    });
    
    it('should create a basic Ed448 wallet', async () => {
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
    });
  });
  
  describe('Wallet Properties', () => {
    it('should have all required properties', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      expect(wallet.type).toBeDefined();
      expect(wallet.mnemonic).toBeDefined();
      expect(wallet.privateKey).toBeDefined();
      expect(wallet.address).toBeDefined();
      expect(wallet.publicKey).toBeDefined();
      expect(wallet.coinType).toBeDefined();
      expect(wallet.symbol).toBeDefined();
      expect(wallet.name).toBeDefined();
      expect(wallet.derivationPath).toBeDefined();
      expect(wallet.keyType).toBeDefined();
      expect(wallet.hashTypes).toBeDefined();
      expect(wallet.publicKeyPackage).toBeDefined();
    });

    it('should have correct ZERA network properties', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      expect(wallet.coinType).toBe(1110);
      expect(wallet.symbol).toBe('ZRA');
      expect(wallet.name).toBe('ZERA');
    });
  });

  describe('Hash Type Support', () => {
    it('should support SHA3-256', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      expect(wallet.hashTypes).toContain(HASH_TYPE.SHA3_256);
    });

    it('should support SHA3-512', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_512],
        mnemonic
      });
      
      expect(wallet.hashTypes).toContain(HASH_TYPE.SHA3_512);
    });

    it('should support Blake3', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.BLAKE3],
        mnemonic
      });
      
      expect(wallet.hashTypes).toContain(HASH_TYPE.BLAKE3);
    });

    it('should support multiple hash types', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256, HASH_TYPE.BLAKE3],
        mnemonic
      });
      
      expect(wallet.hashTypes).toContain(HASH_TYPE.SHA3_256);
      expect(wallet.hashTypes).toContain(HASH_TYPE.BLAKE3);
      expect(wallet.hashTypes.length).toBe(2);
    });
  });

  describe('Derivation Path', () => {
    it('should have valid SLIP-0010 derivation path', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      expect(wallet.derivationPath).toMatch(/^m\/44'/);
      expect(wallet.derivationPath).toContain('1110\'');
      expect(wallet.derivationPath).toMatch(/0'\/0'\/0'$/);
    });
  });

  describe('Address Generation', () => {
    it('should generate valid addresses', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      expect(wallet.address).toBeTruthy();
      expect(typeof wallet.address).toBe('string');
      expect(wallet.address.length).toBeGreaterThan(0);
    });

    it('should generate different addresses for different hash types', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      
      const wallet1 = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      const wallet2 = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.BLAKE3],
        mnemonic
      });
      
      expect(wallet1.address).not.toBe(wallet2.address);
    });
  });

  describe('Public Key Package', () => {
    it('should generate base58-encoded public key package', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      expect(wallet.publicKeyPackage).toBeTruthy();
      expect(typeof wallet.publicKeyPackage).toBe('string');
      expect(wallet.publicKeyPackage.length).toBeGreaterThan(0);
      // Should be base58 encoded (alphanumeric characters)
      expect(wallet.publicKeyPackage).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should generate different public key packages for different key types', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      
      const wallet1 = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      const wallet2 = await createWallet({
        keyType: KEY_TYPE.ED448,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      expect(wallet1.publicKeyPackage).not.toBe(wallet2.publicKeyPackage);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid key type', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      
      await expect(createWallet({
        keyType: 'invalid' as any,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      })).rejects.toThrow();
    });

    it('should handle invalid hash type', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      
      await expect(createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: ['invalid' as any],
        mnemonic
      })).rejects.toThrow();
    });

    it('should handle invalid mnemonic', async () => {
      await expect(createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic: 'invalid mnemonic phrase'
      })).rejects.toThrow();
    });
  });
});