/**
 * Transaction Unit Tests
 * 
 * Unit tests for transaction creation and validation
 * without gRPC dependencies.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  validateContractId
} from '../transaction.js';
import { 
  createWallet, 
  generateMnemonicPhrase,
  KEY_TYPE,
  HASH_TYPE
} from '../../wallet-creation/index.js';
import { 
  validateAmount,
  validateBase58Address
} from '../../shared/utils/validation.js';

describe('Transaction Unit Tests', () => {
  let senderWallet: any;
  let recipientWallet: any;
  let contractId: string;

  beforeEach(async () => {
    // Create test wallets
    const mnemonic = generateMnemonicPhrase(12);
    senderWallet = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic
    });

    recipientWallet = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic,
      hdOptions: {
        accountIndex: 0,
        changeIndex: 0,
        addressIndex: 1
      }
    });

    contractId = '$ZRA+0000';
  });

  afterEach(() => {
    // Clean up wallets
    if (senderWallet?.secureClear) {
      senderWallet.secureClear();
    }
    if (recipientWallet?.secureClear) {
      recipientWallet.secureClear();
    }
  });

  describe('Contract ID Validation', () => {
    it('should validate valid contract IDs', () => {
      const validContractIds = [
        '$ZRA+0000',
        '$ZRA+0001',
        '$ZRA+9999',
        '$ZRA+1234'
      ];

      validContractIds.forEach(id => {
        expect(validateContractId(id)).toBe(true);
      });
    });

    it('should reject invalid contract IDs', () => {
      const invalidContractIds = [
        'ZRA+0000', // Missing $
        '$ZRA+', // Missing number
        '$ZRA+00000', // Too many digits
        '$ZRA+abc', // Non-numeric
        '$ZRA+000', // Too few digits
        '$ZRA+0000+', // Extra characters
        '', // Empty
        null as any, // Null
        undefined as any // Undefined
      ];

      invalidContractIds.forEach(id => {
        expect(validateContractId(id)).toBe(false);
      });
    });
  });

  describe('Amount Validation', () => {
    it('should validate valid amounts', () => {
      const validAmounts = [
        '1000000', // 1 ZRA in microZRA
        '5000000', // 5 ZRA
        '1000000000', // 1000 ZRA
        '1' // Minimum amount
      ];

      validAmounts.forEach(amount => {
        expect(validateAmount(amount)).toBe(true);
      });
    });

    it('should reject invalid amounts', () => {
      const invalidAmounts = [
        '0', // Zero amount
        '-1000000', // Negative amount
        '1.5', // Decimal amount
        'abc', // Non-numeric
        '', // Empty
        null as any, // Null
        undefined as any // Undefined
      ];

      invalidAmounts.forEach(amount => {
        expect(validateAmount(amount)).toBe(false);
      });
    });
  });

  describe('Address Validation', () => {
    it('should validate valid addresses', () => {
      expect(validateBase58Address(senderWallet.address)).toBe(true);
      expect(validateBase58Address(recipientWallet.address)).toBe(true);
    });

    it('should reject invalid addresses', () => {
      const invalidAddresses = [
        'invalid-address',
        'too-short',
        '0', // Too short
        '', // Empty
        null as any, // Null
        undefined as any // Undefined
      ];

      invalidAddresses.forEach(address => {
        expect(validateBase58Address(address)).toBe(false);
      });
    });
  });

  describe('Wallet Integration', () => {
    it('should create wallets with different addresses', () => {
      expect(senderWallet.address).toBeDefined();
      expect(recipientWallet.address).toBeDefined();
      expect(senderWallet.address).not.toBe(recipientWallet.address);
    });

    it('should have valid derivation paths', () => {
      expect(senderWallet.derivationPath).toContain("0'/0'/0'");
      expect(recipientWallet.derivationPath).toContain("0'/0'/1'");
    });

    it('should have sequential indices', () => {
      expect(senderWallet.index).toBe(0 + 0x80000000); // Hardened offset
      expect(recipientWallet.index).toBe(1 + 0x80000000); // Hardened offset
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid contract ID gracefully', () => {
      expect(() => {
        validateContractId('invalid');
      }).not.toThrow();
    });

    it('should handle invalid amount gracefully', () => {
      expect(() => {
        validateAmount('invalid');
      }).not.toThrow();
    });

    it('should handle invalid address gracefully', () => {
      expect(() => {
        validateBase58Address('invalid');
      }).not.toThrow();
    });
  });
});
