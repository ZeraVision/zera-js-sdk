/**
 * Transaction Validation Tests
 * 
 * Unit tests for transaction validation functions
 * without any gRPC dependencies.
 */

import { describe, it, expect } from 'vitest';
import { 
  InputValidator
} from '../../shared/utils/validation.js';
import { TEST_WALLET_ADDRESSES } from '../../test-utils/keys.test.js';

describe('Transaction Validation Tests', () => {
  describe('Amount Validation', () => {
    it('should validate valid amounts', () => {
      const validAmounts = [
        '1000000000', // 1 ZRA in zerite
        '5000000000', // 5 ZRA
        '1000000000000', // 1000 ZRA
        '1' // Minimum amount
      ];

      validAmounts.forEach(amount => {
        const result = InputValidator.validateAmount(amount);
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
        const result = InputValidator.validateAmount(amount);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Address Validation', () => {
    it('should validate valid Base58 addresses', () => {
      const validAddresses = [
        TEST_WALLET_ADDRESSES.alice,
        TEST_WALLET_ADDRESSES.bob
      ];

      validAddresses.forEach(address => {
        const result = InputValidator.validateBase58Address(address);
        expect(result.isValid).toBe(true);
      });
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
        const result = InputValidator.validateBase58Address(address);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid amount gracefully', () => {
      expect(() => {
        InputValidator.validateAmount('invalid');
      }).not.toThrow();
    });

    it('should handle invalid address gracefully', () => {
      expect(() => {
        InputValidator.validateBase58Address('invalid');
      }).not.toThrow();
    });
  });
});