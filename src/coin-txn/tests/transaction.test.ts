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
  ED25519_TEST_KEYS,
  TEST_WALLET_ADDRESSES
} from '../../test-utils/index.js';
import { 
  validateAmount,
  validateBase58Address
} from '../../shared/utils/validation.js';

describe('Transaction Unit Tests', () => {
  let contractId: string;

  beforeEach(async () => {
    contractId = '$ZRA+0000';
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
        const result = validateContractId(id);
        expect(result).toBe(true);
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
        const result = validateContractId(id);
        expect(result).toBe(false);
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
        const result = validateAmount(amount);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid amounts', () => {
      const invalidAmounts = [
        '0', // Zero amount
        '-1000000', // Negative amount
        'abc', // Non-numeric
        '', // Empty
        null as any, // Null
        undefined as any // Undefined
      ];

      invalidAmounts.forEach(amount => {
        const result = validateAmount(amount);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Address Validation', () => {
    it('should validate valid addresses', () => {
      const senderResult = validateBase58Address(ED25519_TEST_KEYS.alice.address);
      const recipientResult = validateBase58Address(ED25519_TEST_KEYS.bob.address);
      expect(senderResult.isValid).toBe(true);
      expect(recipientResult.isValid).toBe(true);
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
        const result = validateBase58Address(address);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Wallet Integration', () => {
    it('should have different addresses', () => {
      expect(ED25519_TEST_KEYS.alice.address).toBeDefined();
      expect(ED25519_TEST_KEYS.bob.address).toBeDefined();
      expect(ED25519_TEST_KEYS.alice.address).not.toBe(ED25519_TEST_KEYS.bob.address);
    });

    it('should have valid addresses', () => {
      expect(ED25519_TEST_KEYS.alice.address).toMatch(/^[A-Za-z0-9]+$/);
      expect(ED25519_TEST_KEYS.bob.address).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should have valid public keys', () => {
      expect(ED25519_TEST_KEYS.alice.publicKey).toBeDefined();
      expect(ED25519_TEST_KEYS.bob.publicKey).toBeDefined();
      expect(ED25519_TEST_KEYS.alice.publicKey).not.toBe(ED25519_TEST_KEYS.bob.publicKey);
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
