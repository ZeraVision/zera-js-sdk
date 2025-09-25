/**
 * Interface Fee Tests
 * Tests the interface fee functionality in Universal Fee Calculator
 */

import { describe, it, expect } from 'vitest';
import { UniversalFeeCalculator } from '../universal-fee-calculator.js';
import { TRANSACTION_TYPE } from '../../protobuf-enums.js';

describe('ZERA Interface Fee System', () => {
  /**
   * Create mock protoObject for interface fee testing
   */
  function createMockProtoObject(): any {
    return {
      coinTxn: {
        contractId: '$ZRA+0000',
        auth: { publicKey: [{ single: new Uint8Array(32) }] },
        inputTransfers: [],
        outputTransfers: []
      },
      toBinary: () => new Uint8Array(150)
    };
  }

  it('should calculate fees with interface fee', async () => {
    const protoObject = createMockProtoObject();
    const result = await UniversalFeeCalculator.calculateFee({
      protoObject,
      baseFeeId: '$ZRA+0000',
      interfaceFeeAmount: '0.01',
      interfaceFeeId: '$ZRA+0000',
      interfaceAddress: '4Sj3Lzf5rKdgPaYHKSMJPduDcMf7PRtk4BDh2YrV7aJ59bAw65i6UcUnnLGpfMjM8vyGiRHqeZnvCf4ZMrCGjJJL'
    });

    expect(result.networkFee).toBeDefined();
    expect(result.networkFee).not.toBe('0');
    expect(result.interfaceFee).toBeDefined();
    expect(result.interfaceFee).not.toBe('0');
    expect(result.totalFee).toBeDefined();
    expect(result.totalFee).not.toBe('0');
  });

  it('should calculate fees without interface fee', async () => {
    const protoObject = createMockProtoObject();
    const result = await UniversalFeeCalculator.calculateFee({
      protoObject,
      baseFeeId: '$ZRA+0000'
    });

    expect(result.networkFee).toBeDefined();
    expect(result.networkFee).not.toBe('0');
    expect(result.interfaceFee).toBeUndefined();
    expect(result.totalFee).toBeDefined();
    expect(result.totalFee).not.toBe('0');
  });

  it('should handle different interface fee amounts', async () => {
    const protoObject = createMockProtoObject();
    const testCases = [
      { amount: '0.001', description: 'Small fee' },
      { amount: '0.01', description: 'Medium fee' },
      { amount: '0.1', description: 'Large fee' },
      { amount: '1.0', description: 'Very large fee' }
    ];

    for (const testCase of testCases) {
      const result = await UniversalFeeCalculator.calculateFee({
        protoObject,
        baseFeeId: '$ZRA+0000',
        interfaceFeeAmount: testCase.amount,
        interfaceFeeId: '$ZRA+0000'
      });

      expect(result.interfaceFee).toBeDefined();
      expect(result.interfaceFee).not.toBe('0');
      expect(result.totalFee).toBeDefined();
      expect(result.totalFee).not.toBe('0');
    }
  });

  it('should handle different interface fee currencies', async () => {
    const protoObject = createMockProtoObject();
    const testCases = [
      { feeId: '$ZRA+0000', description: 'ZRA fee' },
      { feeId: '$USDC+0000', description: 'USDC fee' },
      { feeId: '$ETH+0000', description: 'ETH fee' }
    ];

    for (const testCase of testCases) {
      const result = await UniversalFeeCalculator.calculateFee({
        protoObject,
        baseFeeId: '$ZRA+0000',
        interfaceFeeAmount: '0.01',
        interfaceFeeId: testCase.feeId
      });

      expect(result.interfaceFee).toBeDefined();
      expect(result.interfaceFee).not.toBe('0');
    }
  });

  it('should validate interface fee parameters', async () => {
    const protoObject = createMockProtoObject();

    // Should throw error for invalid interface fee amount
    await expect(UniversalFeeCalculator.calculateFee({
      protoObject,
      baseFeeId: '$ZRA+0000',
      interfaceFeeAmount: 'invalid',
      interfaceFeeId: '$ZRA+0000'
    })).rejects.toThrow();

    // Should throw error for missing interface fee ID
    await expect(UniversalFeeCalculator.calculateFee({
      protoObject,
      baseFeeId: '$ZRA+0000',
      interfaceFeeAmount: '0.01'
    })).rejects.toThrow();
  });

  it('should calculate total fee correctly with interface fee', async () => {
    const protoObject = createMockProtoObject();
    const result = await UniversalFeeCalculator.calculateFee({
      protoObject,
      baseFeeId: '$ZRA+0000',
      interfaceFeeAmount: '0.01',
      interfaceFeeId: '$ZRA+0000'
    });

    // Total fee should be network fee + interface fee
    const networkFee = parseFloat(result.networkFee);
    const interfaceFee = parseFloat(result.interfaceFee || '0');
    const totalFee = parseFloat(result.totalFee);

    expect(totalFee).toBeGreaterThanOrEqual(networkFee + interfaceFee);
  });

  it('should handle zero interface fee', async () => {
    const protoObject = createMockProtoObject();
    const result = await UniversalFeeCalculator.calculateFee({
      protoObject,
      baseFeeId: '$ZRA+0000',
      interfaceFeeAmount: '0',
      interfaceFeeId: '$ZRA+0000'
    });

    expect(result.networkFee).toBeDefined();
    expect(result.networkFee).not.toBe('0');
    expect(result.interfaceFee).toBe('0');
    expect(result.totalFee).toBeDefined();
    expect(result.totalFee).not.toBe('0');
  });
});