/**
 * Transaction Integration Tests
 * 
 * Comprehensive integration tests for transaction creation and management
 * including validation, error handling, and performance.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  createCoinTXN, 
  sendCoinTXN,
  type CoinTXNInput,
  type CoinTXNOutput,
  type FeeConfig
} from '../index.js';
import { 
  createWallet, 
  generateMnemonicPhrase,
  KEY_TYPE,
  HASH_TYPE
} from '../../wallet-creation/index.js';
import { NetworkError } from '../../types/index.js';
import { 
  validateAmount,
  validateBase58Address,
  validateContractId as validateContractIdUtil
} from '../../shared/utils/validation.js';
import { 
  ErrorHandler,
  createTransactionError,
  transactionErrorContext
} from '../../shared/utils/error-handler.js';
import { 
  benchmark,
  PerformanceBenchmark
} from '../../shared/utils/performance-benchmark.js';
import { 
  getConfig,
  setEnvironment
} from '../../shared/config/index.js';

describe('Transaction Integration Tests', () => {
  let senderWallet: any;
  let recipientWallet: any;
  let contractId: string;

  beforeEach(async () => {
    // Set test environment
    setEnvironment('test');

    // Create test wallets
    const senderMnemonic = generateMnemonicPhrase(12);
    senderWallet = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic: senderMnemonic
    });

    const recipientMnemonic = generateMnemonicPhrase(12);
    recipientWallet = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic: recipientMnemonic
    });

    contractId = '$ZRA+0000';
  });

  afterEach(() => {
    // Clean up wallets
    if (senderWallet) {
      senderWallet.secureClear();
    }
    if (recipientWallet) {
      recipientWallet.secureClear();
    }
  });

  describe('Basic Transaction Creation', () => {
    it('should create a basic transaction', async () => {
      const inputs: CoinTXNInput[] = [{
        privateKey: senderWallet.privateKey,
        publicKey: senderWallet.publicKey,
        amount: '10.5',
        feePercent: '100'
      }];

      const outputs: CoinTXNOutput[] = [{
        to: recipientWallet.address,
        amount: '10.0',
        memo: 'Test transaction'
      }];

      const feeConfig: FeeConfig = {
        baseFeeId: '$ZRA+0000'
      };

      const transaction = await createCoinTXN(
        inputs,
        outputs,
        contractId,
        feeConfig,
        'Test transaction'
      );

      expect(transaction).toBeDefined();
      expect(transaction.base).toBeDefined();
      expect(transaction.contractId).toBe(contractId);
      expect(transaction.inputTransfers).toHaveLength(1);
      expect(transaction.outputTransfers).toHaveLength(1);
      expect(transaction.auth).toBeDefined();
    });

    it('should create a transaction with multiple inputs and outputs', async () => {
      // Create additional wallets for multiple inputs/outputs
      const additionalSenderMnemonic = generateMnemonicPhrase(12);
      const additionalSender = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic: additionalSenderMnemonic
      });

      const additionalRecipientMnemonic = generateMnemonicPhrase(12);
      const additionalRecipient = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic: additionalRecipientMnemonic
      });

      const inputs: CoinTXNInput[] = [
        {
          privateKey: senderWallet.privateKey,
          publicKey: senderWallet.publicKey,
          amount: '5.0',
          feePercent: '50'
        },
        {
          privateKey: additionalSender.privateKey,
          publicKey: additionalSender.publicKey,
          amount: '5.0',
          feePercent: '50'
        }
      ];

      const outputs: CoinTXNOutput[] = [
        {
          to: recipientWallet.address,
          amount: '7.0',
          memo: 'Primary recipient'
        },
        {
          to: additionalRecipient.address,
          amount: '3.0',
          memo: 'Secondary recipient'
        }
      ];

      const feeConfig: FeeConfig = {
        baseFeeId: '$ZRA+0000'
      };

      const transaction = await createCoinTXN(
        inputs,
        outputs,
        contractId,
        feeConfig,
        'Multi-input/output transaction'
      );

      expect(transaction.inputTransfers).toHaveLength(2);
      expect(transaction.outputTransfers).toHaveLength(2);
      expect(transaction.auth?.publicKey).toHaveLength(2);
      expect(transaction.auth?.signature).toHaveLength(2);

      // Clean up additional wallets
      additionalSender.secureClear();
      additionalRecipient.secureClear();
    });

    it('should create a transaction with custom fees', async () => {
      const inputs: CoinTXNInput[] = [{
        privateKey: senderWallet.privateKey,
        publicKey: senderWallet.publicKey,
        amount: '10.5',
        feePercent: '100'
      }];

      const outputs: CoinTXNOutput[] = [{
        to: recipientWallet.address,
        amount: '10.0',
        memo: 'Custom fee transaction'
      }];

      const feeConfig: FeeConfig = {
        baseFeeId: '$ZRA+0000',
        baseFee: '0.001',
        contractFeeId: '$ZRA+0000',
        contractFee: '0.0005',
        overestimatePercent: 10.0
      };

      const transaction = await createCoinTXN(
        inputs,
        outputs,
        contractId,
        feeConfig,
        'Custom fee transaction'
      );

      expect(transaction).toBeDefined();
      expect(transaction.base?.feeAmount).toBeDefined();
      expect(transaction.base?.feeId).toBe('$ZRA+0000');
    });
  });

  describe('Input Validation', () => {
    it('should validate contract ID format', () => {
      const validContractId = validateContractIdUtil('$ZRA+0000');
      expect(validContractId.isValid).toBe(true);

      const invalidContractId = validateContractIdUtil('invalid-contract-id');
      expect(invalidContractId.isValid).toBe(false);
    });

    it('should validate transaction amounts', () => {
      const validAmount = validateAmount('10.5', {
        minAmount: '0.001',
        maxAmount: '1000000',
        allowZero: false
      });
      expect(validAmount.isValid).toBe(true);
      expect(validAmount.value).toBe('10.5');

      const invalidAmount = validateAmount('-10.5');
      expect(invalidAmount.isValid).toBe(false);
      expect(invalidAmount.error).toBeDefined();
    });

    it('should validate wallet addresses', () => {
      const validAddress = validateBase58Address(senderWallet.address);
      expect(validAddress.isValid).toBe(true);
      expect(validAddress.value).toBe(senderWallet.address);

      const invalidAddress = validateBase58Address('invalid-address');
      expect(invalidAddress.isValid).toBe(false);
      expect(invalidAddress.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid contract ID', async () => {
      const inputs: CoinTXNInput[] = [{
        privateKey: senderWallet.privateKey,
        publicKey: senderWallet.publicKey,
        amount: '10.5',
        feePercent: '100'
      }];

      const outputs: CoinTXNOutput[] = [{
        to: recipientWallet.address,
        amount: '10.0'
      }];

      await expect(createCoinTXN(
        inputs,
        outputs,
        'invalid-contract-id',
        {},
        'Invalid contract ID test'
      )).rejects.toThrow();
    });

    it('should handle invalid inputs array', async () => {
      const outputs: CoinTXNOutput[] = [{
        to: recipientWallet.address,
        amount: '10.0'
      }];

      await expect(createCoinTXN(
        [] as any, // Empty inputs
        outputs,
        contractId,
        {},
        'Empty inputs test'
      )).rejects.toThrow();
    });

    it('should handle invalid outputs array', async () => {
      const inputs: CoinTXNInput[] = [{
        privateKey: senderWallet.privateKey,
        publicKey: senderWallet.publicKey,
        amount: '10.5',
        feePercent: '100'
      }];

      await expect(createCoinTXN(
        inputs,
        [] as any, // Empty outputs
        contractId,
        {},
        'Empty outputs test'
      )).rejects.toThrow();
    });

    it('should handle invalid amounts', async () => {
      const inputs: CoinTXNInput[] = [{
        privateKey: senderWallet.privateKey,
        publicKey: senderWallet.publicKey,
        amount: '-10.5', // Negative amount
        feePercent: '100'
      }];

      const outputs: CoinTXNOutput[] = [{
        to: recipientWallet.address,
        amount: '10.0'
      }];

      await expect(createCoinTXN(
        inputs,
        outputs,
        contractId,
        {},
        'Negative amount test'
      )).rejects.toThrow();
    });

    it('should handle invalid fee percentages', async () => {
      const inputs: CoinTXNInput[] = [{
        privateKey: senderWallet.privateKey,
        publicKey: senderWallet.publicKey,
        amount: '10.5',
        feePercent: '50' // Should be 100% for single input
      }];

      const outputs: CoinTXNOutput[] = [{
        to: recipientWallet.address,
        amount: '10.0'
      }];

      await expect(createCoinTXN(
        inputs,
        outputs,
        contractId,
        {},
        'Invalid fee percentage test'
      )).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should create transactions within reasonable time', async () => {
      const inputs: CoinTXNInput[] = [{
        privateKey: senderWallet.privateKey,
        publicKey: senderWallet.publicKey,
        amount: '10.5',
        feePercent: '100'
      }];

      const outputs: CoinTXNOutput[] = [{
        to: recipientWallet.address,
        amount: '10.0',
        memo: 'Performance test transaction'
      }];

      const feeConfig: FeeConfig = {
        baseFeeId: '$ZRA+0000'
      };

      const result = await benchmark(
        'Transaction Creation Performance',
        async () => {
          return await createCoinTXN(
            inputs,
            outputs,
            contractId,
            feeConfig,
            'Performance test'
          );
        },
        {
          iterations: 10,
          warmupIterations: 2
        }
      );

      expect(result.averageTime).toBeLessThan(5000); // Should be under 5 seconds
      expect(result.iterations).toBe(10);
    });

    it('should handle multiple transaction creation efficiently', async () => {
      const benchmark = new PerformanceBenchmark();

      const inputs: CoinTXNInput[] = [{
        privateKey: senderWallet.privateKey,
        publicKey: senderWallet.publicKey,
        amount: '10.5',
        feePercent: '100'
      }];

      const outputs: CoinTXNOutput[] = [{
        to: recipientWallet.address,
        amount: '10.0',
        memo: 'Batch transaction'
      }];

      const feeConfig: FeeConfig = {
        baseFeeId: '$ZRA+0000'
      };

      const result = await benchmark.benchmark(
        'Batch Transaction Creation',
        async () => {
          const transactions = [];
          for (let i = 0; i < 5; i++) {
            const transaction = await createCoinTXN(
              inputs,
              outputs,
              contractId,
              feeConfig,
              `Batch transaction ${i}`
            );
            transactions.push(transaction);
          }
          return transactions;
        },
        {
          iterations: 3,
          warmupIterations: 1
        }
      );

      expect(result.averageTime).toBeLessThan(15000); // Should be under 15 seconds
      expect(result.iterations).toBe(3);
    });
  });

  describe('Transaction Signing', () => {
    it('should sign transactions correctly', async () => {
      const inputs: CoinTXNInput[] = [{
        privateKey: senderWallet.privateKey,
        publicKey: senderWallet.publicKey,
        amount: '10.5',
        feePercent: '100'
      }];

      const outputs: CoinTXNOutput[] = [{
        to: recipientWallet.address,
        amount: '10.0',
        memo: 'Signed transaction'
      }];

      const feeConfig: FeeConfig = {
        baseFeeId: '$ZRA+0000'
      };

      const transaction = await createCoinTXN(
        inputs,
        outputs,
        contractId,
        feeConfig,
        'Signed transaction'
      );

      expect(transaction.auth?.signature).toBeDefined();
      expect(transaction.auth?.signature).toHaveLength(1);
      expect(transaction.auth?.publicKey).toBeDefined();
      expect(transaction.auth?.publicKey).toHaveLength(1);
      expect(transaction.base?.hash).toBeDefined();
    });

    it('should sign multiple input transactions correctly', async () => {
      // Create additional sender
      const additionalSenderMnemonic = generateMnemonicPhrase(12);
      const additionalSender = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic: additionalSenderMnemonic
      });

      const inputs: CoinTXNInput[] = [
        {
          privateKey: senderWallet.privateKey,
          publicKey: senderWallet.publicKey,
          amount: '5.0',
          feePercent: '50'
        },
        {
          privateKey: additionalSender.privateKey,
          publicKey: additionalSender.publicKey,
          amount: '5.0',
          feePercent: '50'
        }
      ];

      const outputs: CoinTXNOutput[] = [{
        to: recipientWallet.address,
        amount: '10.0',
        memo: 'Multi-signed transaction'
      }];

      const feeConfig: FeeConfig = {
        baseFeeId: '$ZRA+0000'
      };

      const transaction = await createCoinTXN(
        inputs,
        outputs,
        contractId,
        feeConfig,
        'Multi-signed transaction'
      );

      expect(transaction.auth?.signature).toHaveLength(2);
      expect(transaction.auth?.publicKey).toHaveLength(2);
      expect(transaction.base?.hash).toBeDefined();

      // Clean up
      additionalSender.secureClear();
    });
  });

  describe('Configuration Integration', () => {
    it('should work with different environments', async () => {
      const inputs: CoinTXNInput[] = [{
        privateKey: senderWallet.privateKey,
        publicKey: senderWallet.publicKey,
        amount: '10.5',
        feePercent: '100'
      }];

      const outputs: CoinTXNOutput[] = [{
        to: recipientWallet.address,
        amount: '10.0',
        memo: 'Environment test transaction'
      }];

      const feeConfig: FeeConfig = {
        baseFeeId: '$ZRA+0000'
      };

      // Test with development environment
      setEnvironment('development');
      const devConfig = getConfig();
      expect(devConfig.environment).toBe('development');

      const devTransaction = await createCoinTXN(
        inputs,
        outputs,
        contractId,
        feeConfig,
        'Development transaction'
      );
      expect(devTransaction).toBeDefined();

      // Test with production environment
      setEnvironment('production');
      const prodConfig = getConfig();
      expect(prodConfig.environment).toBe('production');

      const prodTransaction = await createCoinTXN(
        inputs,
        outputs,
        contractId,
        feeConfig,
        'Production transaction'
      );
      expect(prodTransaction).toBeDefined();
    });
  });

  describe('Transaction Submission', () => {
    it('should handle transaction submission errors gracefully', async () => {
      const inputs: CoinTXNInput[] = [{
        privateKey: senderWallet.privateKey,
        publicKey: senderWallet.publicKey,
        amount: '10.5',
        feePercent: '100'
      }];

      const outputs: CoinTXNOutput[] = [{
        to: recipientWallet.address,
        amount: '10.0',
        memo: 'Submission test transaction'
      }];

      const feeConfig: FeeConfig = {
        baseFeeId: '$ZRA+0000'
      };

      const transaction = await createCoinTXN(
        inputs,
        outputs,
        contractId,
        feeConfig,
        'Submission test transaction'
      );

      // This will likely fail in test environment, but should handle gracefully
      try {
        await sendCoinTXN(transaction);
      } catch (error) {
        expect(error).toBeDefined();
        expect(ErrorHandler.isRetryableError(error as Error)).toBe(true);
      }
    });
  });
});
