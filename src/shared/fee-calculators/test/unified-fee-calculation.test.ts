/**
 * Test Suite for Unified Fee Calculation System
 * Tests the new calculateFee method with contract fee integration
 */

import { describe, it, expect } from 'vitest';
import { UniversalFeeCalculator } from '../universal-fee-calculator.js';
import { contractFeeService } from '../contract-fee-service.js';
import { 
  getContractFeeConfig, 
  isFeeContractIdAllowed,
  setContractFeeConfig 
} from '../contract-fee-constants.js';
import { TRANSACTION_TYPE, CONTRACT_FEE_TYPE } from '../../protobuf-enums.js';
import { KEY_TYPE } from '../../../wallet-creation/constants.js';

describe('ZERA Unified Fee Calculation System', () => {
  /**
   * Create mock protoObject for testing
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

  it('should calculate basic network fee', async () => {
    const protoObject = createMockProtoObject();
    const result = await UniversalFeeCalculator.calculateFee({
      protoObject,
      baseFeeId: '$ZRA+0000'
    });

    expect(result.networkFee).toBeDefined();
    expect(result.networkFee).not.toBe('0');
    expect(result.totalFee).toBeDefined();
    expect(result.totalFee).not.toBe('0');
  });

  it('should calculate fee with contract fee', async () => {
    const protoObject = createMockProtoObject();
    const result = await UniversalFeeCalculator.calculateFee({
      protoObject,
      baseFeeId: '$ZRA+0000',
      contractFeeId: '$ZRA+0000'
    });

    expect(result.networkFee).toBeDefined();
    expect(result.networkFee).not.toBe('0');
    expect(result.contractFee).toBeDefined();
    expect(result.contractFee).not.toBe('0');
    expect(result.totalFee).toBeDefined();
    expect(result.totalFee).not.toBe('0');
  });

  it('should calculate fee with interface fee', async () => {
    const protoObject = createMockProtoObject();
    const result = await UniversalFeeCalculator.calculateFee({
      protoObject,
      baseFeeId: '$ZRA+0000',
      interfaceFeeAmount: '0.01',
      interfaceFeeId: '$ZRA+0000'
    });

    expect(result.networkFee).toBeDefined();
    expect(result.networkFee).not.toBe('0');
    expect(result.interfaceFee).toBeDefined();
    expect(result.interfaceFee).not.toBe('0');
    expect(result.totalFee).toBeDefined();
    expect(result.totalFee).not.toBe('0');
  });

  it('should calculate fee with both contract and interface fees', async () => {
    const protoObject = createMockProtoObject();
    const result = await UniversalFeeCalculator.calculateFee({
      protoObject,
      baseFeeId: '$ZRA+0000',
      contractFeeId: '$ZRA+0000',
      interfaceFeeAmount: '0.01',
      interfaceFeeId: '$ZRA+0000'
    });

    expect(result.networkFee).toBeDefined();
    expect(result.networkFee).not.toBe('0');
    expect(result.contractFee).toBeDefined();
    expect(result.contractFee).not.toBe('0');
    expect(result.interfaceFee).toBeDefined();
    expect(result.interfaceFee).not.toBe('0');
    expect(result.totalFee).toBeDefined();
    expect(result.totalFee).not.toBe('0');
  });

  it('should handle different base fee currencies', async () => {
    const protoObject = createMockProtoObject();
    const testCases = [
      { baseFeeId: '$ZRA+0000', description: 'ZRA base fee' },
      { baseFeeId: '$USDC+0000', description: 'USDC base fee' },
      { baseFeeId: '$ETH+0000', description: 'ETH base fee' }
    ];

    for (const testCase of testCases) {
      const result = await UniversalFeeCalculator.calculateFee({
        protoObject,
        baseFeeId: testCase.baseFeeId
      });

      expect(result.networkFee).toBeDefined();
      expect(result.networkFee).not.toBe('0');
      expect(result.totalFee).toBeDefined();
      expect(result.totalFee).not.toBe('0');
    }
  });

  it('should handle different contract fee currencies', async () => {
    const protoObject = createMockProtoObject();
    const testCases = [
      { contractFeeId: '$ZRA+0000', description: 'ZRA contract fee' },
      { contractFeeId: '$USDC+0000', description: 'USDC contract fee' },
      { contractFeeId: '$ETH+0000', description: 'ETH contract fee' }
    ];

    for (const testCase of testCases) {
      const result = await UniversalFeeCalculator.calculateFee({
        protoObject,
        baseFeeId: '$ZRA+0000',
        contractFeeId: testCase.contractFeeId
      });

      expect(result.contractFee).toBeDefined();
      expect(result.contractFee).not.toBe('0');
    }
  });

  it('should validate fee calculation parameters', async () => {
    const protoObject = createMockProtoObject();

    // Should throw error for invalid base fee ID
    await expect(UniversalFeeCalculator.calculateFee({
      protoObject,
      baseFeeId: 'invalid-contract-id'
    })).rejects.toThrow();

    // Should throw error for invalid contract fee ID
    await expect(UniversalFeeCalculator.calculateFee({
      protoObject,
      baseFeeId: '$ZRA+0000',
      contractFeeId: 'invalid-contract-id'
    })).rejects.toThrow();
  });

  it('should calculate total fee correctly', async () => {
    const protoObject = createMockProtoObject();
    const result = await UniversalFeeCalculator.calculateFee({
      protoObject,
      baseFeeId: '$ZRA+0000',
      contractFeeId: '$ZRA+0000',
      interfaceFeeAmount: '0.01',
      interfaceFeeId: '$ZRA+0000'
    });

    const networkFee = parseFloat(result.networkFee);
    const contractFee = parseFloat(result.contractFee || '0');
    const interfaceFee = parseFloat(result.interfaceFee || '0');
    const totalFee = parseFloat(result.totalFee);

    expect(totalFee).toBeGreaterThanOrEqual(networkFee + contractFee + interfaceFee);
  });

  it('should handle zero fees correctly', async () => {
    const protoObject = createMockProtoObject();
    const result = await UniversalFeeCalculator.calculateFee({
      protoObject,
      baseFeeId: '$ZRA+0000',
      contractFeeId: '$ZRA+0000',
      interfaceFeeAmount: '0',
      interfaceFeeId: '$ZRA+0000'
    });

    expect(result.networkFee).toBeDefined();
    expect(result.networkFee).not.toBe('0');
    expect(result.contractFee).toBeDefined();
    expect(result.interfaceFee).toBe('0');
    expect(result.totalFee).toBeDefined();
    expect(result.totalFee).not.toBe('0');
  });

  it('should provide detailed fee breakdown', async () => {
    const protoObject = createMockProtoObject();
    const result = await UniversalFeeCalculator.calculateFee({
      protoObject,
      baseFeeId: '$ZRA+0000',
      contractFeeId: '$ZRA+0000',
      interfaceFeeAmount: '0.01',
      interfaceFeeId: '$ZRA+0000'
    });

    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.baseFee).toBeDefined();
    expect(result.breakdown.sizeFee).toBeDefined();
    expect(result.breakdown.signatureFee).toBeDefined();
    expect(result.breakdown.contractFee).toBeDefined();
    expect(result.breakdown.interfaceFee).toBeDefined();
  });
});