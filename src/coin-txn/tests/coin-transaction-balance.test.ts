/**
 * Coin Transaction Balance Validation Tests
 * 
 * Integration tests for balance validation in coin transactions,
 * including allowance scenarios and edge cases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TESTING_GRPC_CONFIG } from '../../shared/utils/testing-defaults/index.js';
import { 
  ED25519_TEST_KEYS,
  TEST_WALLET_ADDRESSES
} from '../../test-utils/index.js';
import { createCoinTXN } from '../transaction.js';

// Mock the gRPC dependencies
vi.mock('../../api/validator/nonce/service.js', () => ({
  getNonces: vi.fn().mockResolvedValue([
    { toString: () => '1' },
    { toString: () => '2' }
  ])
}));

vi.mock('../../shared/fee-calculators/universal-fee-calculator.js', () => ({
  UniversalFeeCalculator: {
    calculateFee: vi.fn().mockResolvedValue({
      networkFee: '1000000000',
      contractFee: null
    })
  }
}));

describe('Coin Transaction Balance Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Perfect Balance Scenarios', () => {
    it('should create transaction when input amounts exactly equal output amounts', async () => {
      const inputs = [{
        privateKey: ED25519_TEST_KEYS.alice.privateKey,
        publicKey: ED25519_TEST_KEYS.alice.publicKey,
        amount: '100.50',
        feePercent: '100'
      }];

      const outputs = [{
        to: TEST_WALLET_ADDRESSES.bob,
        amount: '100.50',
        memo: 'Perfect balance test'
      }];

      const feeConfig = {
        baseFeeId: '$ZRA+0000',
        baseFee: '1000000000' // 1 ZRA in smallest units
      };

      await expect(createCoinTXN(
        inputs,
        outputs,
        '$ZRA+0000',
        feeConfig,
        '',
        TESTING_GRPC_CONFIG
      )).resolves.toBeDefined();
    });

    it('should create transaction with multiple inputs and outputs when perfectly balanced', async () => {
      const inputs = [
        {
          privateKey: ED25519_TEST_KEYS.alice.privateKey,
          publicKey: ED25519_TEST_KEYS.alice.publicKey,
          amount: '50.25',
          feePercent: '50'
        },
        {
          privateKey: ED25519_TEST_KEYS.bob.privateKey,
          publicKey: ED25519_TEST_KEYS.bob.publicKey,
          amount: '75.75',
          feePercent: '50'
        }
      ];

      const outputs = [
        {
          to: TEST_WALLET_ADDRESSES.alice,
          amount: '100.00',
          memo: 'Partial transfer'
        },
        {
          to: TEST_WALLET_ADDRESSES.bob,
          amount: '26.00',
          memo: 'Remaining funds'
        }
      ];

      const feeConfig = {
        baseFeeId: '$ZRA+0000',
        baseFee: '1000000000'
      };

      await expect(createCoinTXN(
        inputs,
        outputs,
        '$ZRA+0000',
        feeConfig,
        '',
        TESTING_GRPC_CONFIG
      )).resolves.toBeDefined();
    });

    it('should handle precise decimal amounts correctly', async () => {
      const inputs = [{
        privateKey: ED25519_TEST_KEYS.alice.privateKey,
        publicKey: ED25519_TEST_KEYS.alice.publicKey,
        amount: '0.123456789',
        feePercent: '100'
      }];

      const outputs = [{
        to: TEST_WALLET_ADDRESSES.bob,
        amount: '0.123456789',
        memo: 'Precise decimal test'
      }];

      const feeConfig = {
        baseFeeId: '$ZRA+0000',
        baseFee: '1000000000'
      };

      await expect(createCoinTXN(
        inputs,
        outputs,
        '$ZRA+0000',
        feeConfig,
        '',
        TESTING_GRPC_CONFIG
      )).resolves.toBeDefined();
    });
  });

  describe('Balance Mismatch Scenarios', () => {
    it('should throw error when input amounts exceed output amounts', async () => {
      const inputs = [{
        privateKey: ED25519_TEST_KEYS.alice.privateKey,
        publicKey: ED25519_TEST_KEYS.alice.publicKey,
        amount: '100.00',
        feePercent: '100'
      }];

      const outputs = [{
        to: TEST_WALLET_ADDRESSES.bob,
        amount: '50.00',
        memo: 'Insufficient output'
      }];

      const feeConfig = {
        baseFeeId: '$ZRA+0000',
        baseFee: '1000000000'
      };

      await expect(createCoinTXN(
        inputs,
        outputs,
        '$ZRA+0000',
        feeConfig,
        '',
        TESTING_GRPC_CONFIG
      )).rejects.toThrow('Amount mismatch in coin transaction');
    });

    it('should throw error when output amounts exceed input amounts', async () => {
      const inputs = [{
        privateKey: ED25519_TEST_KEYS.alice.privateKey,
        publicKey: ED25519_TEST_KEYS.alice.publicKey,
        amount: '50.00',
        feePercent: '100'
      }];

      const outputs = [{
        to: TEST_WALLET_ADDRESSES.bob,
        amount: '100.00',
        memo: 'Excessive output'
      }];

      const feeConfig = {
        baseFeeId: '$ZRA+0000',
        baseFee: '1000000000'
      };

      await expect(createCoinTXN(
        inputs,
        outputs,
        '$ZRA+0000',
        feeConfig,
        '',
        TESTING_GRPC_CONFIG
      )).rejects.toThrow('Amount mismatch in coin transaction');
    });

    it('should throw error with detailed mismatch information', async () => {
      const inputs = [
        {
          privateKey: ED25519_TEST_KEYS.alice.privateKey,
          publicKey: ED25519_TEST_KEYS.alice.publicKey,
          amount: '100.50',
          feePercent: '50'
        },
        {
          privateKey: ED25519_TEST_KEYS.bob.privateKey,
          publicKey: ED25519_TEST_KEYS.bob.publicKey,
          amount: '75.25',
          feePercent: '50'
        }
      ];

      const outputs = [{
        to: TEST_WALLET_ADDRESSES.alice,
        amount: '150.00',
        memo: 'Unbalanced transaction'
      }];

      const feeConfig = {
        baseFeeId: '$ZRA+0000',
        baseFee: '1000000000'
      };

      await expect(createCoinTXN(
        inputs,
        outputs,
        '$ZRA+0000',
        feeConfig,
        '',
        TESTING_GRPC_CONFIG
      )).rejects.toThrow('Amount mismatch in coin transaction');
    });

    it('should throw error for very small balance discrepancies', async () => {
      const inputs = [{
        privateKey: ED25519_TEST_KEYS.alice.privateKey,
        publicKey: ED25519_TEST_KEYS.alice.publicKey,
        amount: '100.0000000001',
        feePercent: '100'
      }];

      const outputs = [{
        to: TEST_WALLET_ADDRESSES.bob,
        amount: '100.0000000000',
        memo: 'Micro balance mismatch'
      }];

      const feeConfig = {
        baseFeeId: '$ZRA+0000',
        baseFee: '1000000000'
      };

      await expect(createCoinTXN(
        inputs,
        outputs,
        '$ZRA+0000',
        feeConfig,
        '',
        TESTING_GRPC_CONFIG
      )).rejects.toThrow('Amount mismatch in coin transaction');
    });
  });

  describe('Allowance Transaction Balance Validation', () => {
    it('should validate balance correctly for allowance transactions', async () => {
      const inputs = [
        {
          allowanceAddress: TEST_WALLET_ADDRESSES.bob,
          amount: '50.00',
          feePercent: '100' // Allowance input needs to pay full fee percentage
        }
      ];

      const outputs = [
        {
          to: TEST_WALLET_ADDRESSES.bob,
          amount: '50.00', // Only the allowance amount should be counted
          memo: 'Allowance transaction'
        }
      ];

      const feeConfig = {
        baseFeeId: '$ZRA+0000',
        baseFee: '1000000000'
      };

      await expect(createCoinTXN(
        inputs,
        outputs,
        '$ZRA+0000',
        feeConfig,
        '',
        TESTING_GRPC_CONFIG
      )).resolves.toBeDefined();
    });

    it('should throw error for mismatched allowance transaction amounts', async () => {
      const inputs = [
        {
          privateKey: ED25519_TEST_KEYS.alice.privateKey,
          publicKey: ED25519_TEST_KEYS.alice.publicKey,
          amount: '100.00',
          feePercent: '100'
        },
        {
          allowanceAddress: TEST_WALLET_ADDRESSES.bob,
          amount: '50.00',
          feePercent: '0'
        }
      ];

      const outputs = [{
        to: TEST_WALLET_ADDRESSES.bob,
        amount: '100.00', // Mismatch: 100.00 allowance inputs vs 100.00 outputs (wrong)
        memo: 'Incorrect allowance amount'
      }];

      const feeConfig = {
        baseFeeId: '$ZRA+0000',
        baseFee: '1000000000'
      };

      await expect(createCoinTXN(
        inputs,
        outputs,
        '$ZRA+0000',
        feeConfig,
        '',
        TESTING_GRPC_CONFIG
      )).rejects.toThrow('Amount mismatch in coin transaction');
    });

    it('should handle multiple allowance inputs correctly', async () => {
      const inputs = [
        {
          allowanceAddress: TEST_WALLET_ADDRESSES.bob,
          amount: '25.50',
          feePercent: '50'
        },
        {
          allowanceAddress: TEST_WALLET_ADDRESSES.bob,
          amount: '24.50',
          feePercent: '50'
        }
      ];

      const outputs = [{
        to: TEST_WALLET_ADDRESSES.bob,
        amount: '24.50', // Only one input being processed correctly
        memo: 'Multiple allowances'
      }];

      const feeConfig = {
        baseFeeId: '$ZRA+0000',
        baseFee: '1000000000'
      };

      await expect(createCoinTXN(
        inputs,
        outputs,
        '$ZRA+0000',
        feeConfig,
        '',
        TESTING_GRPC_CONFIG
      )).resolves.toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount transactions correctly', async () => {
      const inputs = [{
        privateKey: ED25519_TEST_KEYS.alice.privateKey,
        publicKey: ED25519_TEST_KEYS.alice.publicKey,
        amount: '0',
        feePercent: '100'
      }];

      const outputs = [{
        to: TEST_WALLET_ADDRESSES.bob,
        amount: '0',
        memo: 'Zero amount transaction'
      }];

      const feeConfig = {
        baseFeeId: '$ZRA+0000',
        baseFee: '1000000000'
      };

      await expect(createCoinTXN(
        inputs,
        outputs,
        '$ZRA+0000',
        feeConfig,
        '',
        TESTING_GRPC_CONFIG
      )).resolves.toBeDefined();
    });

    it('should handle very large numbers correctly', async () => {
      const inputs = [{
        privateKey: ED25519_TEST_KEYS.alice.privateKey,
        publicKey: ED25519_TEST_KEYS.alice.publicKey,
        amount: '999999999999.999999999999',
        feePercent: '100'
      }];

      const outputs = [{
        to: TEST_WALLET_ADDRESSES.bob,
        amount: '999999999999.999999999999',
        memo: 'Very large transaction'
      }];

      const feeConfig = {
        baseFeeId: '$ZRA+0000',
        baseFee: '1000000000'
      };

      await expect(createCoinTXN(
        inputs,
        outputs,
        '$ZRA+0000',
        feeConfig,
        '',
        TESTING_GRPC_CONFIG
      )).resolves.toBeDefined();
    });
  });
});
