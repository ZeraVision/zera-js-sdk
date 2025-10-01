import { describe, it, expect } from 'vitest';
import {
  createWallet,
  generateMnemonicPhrase,
  buildDerivationPath,
  KEY_TYPE,
  HASH_TYPE
} from '../index.js';
import type { WalletOptions, Wallet, MnemonicLength } from '../../types/index.js';

describe('Basic Wallet Functionality', () => {
  describe('Basic wallet creation', () => {
    it('should create basic Ed25519 wallet', async () => {
      const mnemonic1 = generateMnemonicPhrase(12);
      const wallet1 = await createWallet({ 
        keyType: KEY_TYPE.ED25519, 
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic: mnemonic1
      });
      
      expect(wallet1.type).toBe('hd');
      expect(wallet1.keyType).toBe(KEY_TYPE.ED25519);
      expect(Array.isArray(wallet1.hashTypes)).toBe(true);
      expect(typeof wallet1.address).toBe('string');
      expect(typeof wallet1.privateKey).toBe('string');
      expect(typeof wallet1.publicKey).toBe('string');
    });

    it('should create Ed25519 wallet with Blake3 hash', async () => {
      const mnemonic2 = generateMnemonicPhrase(15);
      const wallet2 = await createWallet({ 
        keyType: KEY_TYPE.ED25519, 
        hashTypes: [HASH_TYPE.BLAKE3], 
        mnemonic: mnemonic2
      });
      
      expect(wallet2.type).toBe('hd');
      expect(wallet2.keyType).toBe(KEY_TYPE.ED25519);
      expect(wallet2.hashTypes).toContain(HASH_TYPE.BLAKE3);
    });

    it('should create wallet using existing mnemonic', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet1 = await createWallet({ 
        keyType: KEY_TYPE.ED25519, 
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      const walletWithExistingMnemonic = await createWallet({ 
        keyType: KEY_TYPE.ED25519, 
        hashTypes: [HASH_TYPE.SHA3_256], 
        mnemonic: wallet1.mnemonic 
      });
      
      expect(walletWithExistingMnemonic.type).toBe('hd');
      expect(walletWithExistingMnemonic.mnemonic).toBe(wallet1.mnemonic);
    });

    it('should create wallet with multiple hashes', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet1 = await createWallet({ 
        keyType: KEY_TYPE.ED25519, 
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      const wallet3 = await createWallet({ 
        keyType: KEY_TYPE.ED25519, 
        hashTypes: [HASH_TYPE.SHA3_512, HASH_TYPE.BLAKE3], 
        mnemonic: wallet1.mnemonic 
      });
      
      expect(wallet3.type).toBe('hd');
      expect(wallet3.hashTypes).toContain(HASH_TYPE.SHA3_512);
      expect(wallet3.hashTypes).toContain(HASH_TYPE.BLAKE3);
      expect(wallet3.hashTypes.length).toBe(2);
    });
  });

  describe('Derivation path building', () => {
    it('should build default derivation path', () => {
      const path1 = buildDerivationPath();
      expect(typeof path1).toBe('string');
      expect(path1).toMatch(/^m\/44'/);
    });

    it('should build custom derivation path', () => {
      const path2 = buildDerivationPath({ accountIndex: 1, changeIndex: 1, addressIndex: 5 });
      expect(typeof path2).toBe('string');
      expect(path2).toMatch(/^m\/44'/);
      expect(path2).toContain('1\'');
    });
  });

  describe('Wallet properties validation', () => {
    it('should have all required wallet properties', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({ 
        keyType: KEY_TYPE.ED25519, 
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      // Required properties
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

    it('should have correct coin type and symbol', async () => {
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

    it('should have valid derivation path format', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({ 
        keyType: KEY_TYPE.ED25519, 
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      expect(wallet.derivationPath).toMatch(/^m\/44'/);
      expect(wallet.derivationPath).toContain('1110\'');
    });
  });

  describe('Different key types', () => {
    it('should create Ed25519 wallet', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({ 
        keyType: KEY_TYPE.ED25519, 
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      expect(wallet.keyType).toBe(KEY_TYPE.ED25519);
    });

    it('should create Ed448 wallet', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({ 
        keyType: KEY_TYPE.ED448, 
        hashTypes: [HASH_TYPE.SHA3_512],
        mnemonic
      });
      
      expect(wallet.keyType).toBe(KEY_TYPE.ED448);
    });
  });

  describe('Different hash types', () => {
    it('should work with SHA3-256', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({ 
        keyType: KEY_TYPE.ED25519, 
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      
      expect(wallet.hashTypes).toContain(HASH_TYPE.SHA3_256);
    });

    it('should work with SHA3-512', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({ 
        keyType: KEY_TYPE.ED25519, 
        hashTypes: [HASH_TYPE.SHA3_512],
        mnemonic
      });
      
      expect(wallet.hashTypes).toContain(HASH_TYPE.SHA3_512);
    });

    it('should work with Blake3', async () => {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({ 
        keyType: KEY_TYPE.ED25519, 
        hashTypes: [HASH_TYPE.BLAKE3],
        mnemonic
      });
      
      expect(wallet.hashTypes).toContain(HASH_TYPE.BLAKE3);
    });
  });

  describe('Mnemonic phrase generation', () => {
    it('should generate 12-word mnemonic', () => {
      const mnemonic = generateMnemonicPhrase(12);
      const words = mnemonic.split(' ');
      expect(words.length).toBe(12);
    });

    it('should generate 15-word mnemonic', () => {
      const mnemonic = generateMnemonicPhrase(15);
      const words = mnemonic.split(' ');
      expect(words.length).toBe(15);
    });

    it('should generate 18-word mnemonic', () => {
      const mnemonic = generateMnemonicPhrase(18);
      const words = mnemonic.split(' ');
      expect(words.length).toBe(18);
    });

    it('should generate 21-word mnemonic', () => {
      const mnemonic = generateMnemonicPhrase(21);
      const words = mnemonic.split(' ');
      expect(words.length).toBe(21);
    });

    it('should generate 24-word mnemonic', () => {
      const mnemonic = generateMnemonicPhrase(24);
      const words = mnemonic.split(' ');
      expect(words.length).toBe(24);
    });
  });
});