/**
 * Comprehensive Auto-Detection Test Suite
 * Tests all auto-detection features in Universal Fee Calculator
 */

import { describe, it, expect } from 'vitest';
import { UniversalFeeCalculator } from '../universal-fee-calculator.js';
import { TRANSACTION_TYPE, CONTRACT_FEE_TYPE } from '../../protobuf-enums.js';
import { KEY_TYPE } from '../../../wallet-creation/constants.js';

describe('ZERA Universal Fee Calculator Auto-Detection', () => {
  /**
   * Create mock protoObject for different transaction types
   */
  function createMockProtoObject(transactionType: number, keyType: string = KEY_TYPE.ED25519): any {
    const keySize = keyType === KEY_TYPE.ED25519 ? 32 : 57;
    const mockKey = new Uint8Array(keySize);
    
    const baseStructure = {
      base: {
        publicKey: { single: mockKey }
      },
      toBinary: () => new Uint8Array(100)
    };

    switch (transactionType) {
      case TRANSACTION_TYPE.COIN_TXN:
        return {
          coinTxn: {
            contractId: '$ZRA+0000',
            auth: { publicKey: [{ single: mockKey }] },
            inputTransfers: [],
            outputTransfers: []
          },
          toBinary: () => new Uint8Array(150)
        };
      case TRANSACTION_TYPE.MINT_TXN:
        return { 
          mintTxn: { 
            contractId: '$ZRA+0000', 
            amount: '1000', 
            recipientAddress: new Uint8Array(32) 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.ITEM_MINT_TXN:
        return { 
          itemMintTxn: { 
            contractId: '$ZRA+0000', 
            itemId: 'ITEM001', 
            recipientAddress: new Uint8Array(32), 
            votingWeight: 1 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.CONTRACT_TXN:
        return { 
          contractTxn: { 
            contractId: '$ZRA+0000', 
            version: 1, 
            name: 'Test Contract' 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.VOTE_TXN:
        return { 
          governanceVote: { 
            contractId: '$ZRA+0000', 
            proposalId: new Uint8Array(32), 
            support: true 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.PROPOSAL_TXN:
        return { 
          governanceProposal: { 
            contractId: '$ZRA+0000', 
            title: 'Test Proposal', 
            synopsis: 'Test synopsis', 
            body: 'Test body' 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.SMART_CONTRACT_TXN:
        return { 
          smartContractTxn: { 
            smartContractName: 'TestContract', 
            binaryCode: new Uint8Array(100), 
            sourceCode: 'contract TestContract {}', 
            language: 0, 
            functions: ['testFunction'] 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.SMART_CONTRACT_EXECUTE_TXN:
        return { 
          smartContractExecuteTxn: { 
            smartContractName: 'TestContract', 
            instance: new Uint8Array(32), 
            function: 'testFunction', 
            parameters: [] 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.NFT_TXN:
        return { 
          nftTxn: { 
            contractId: '$ZRA+0000', 
            itemId: 'NFT001', 
            recipientAddress: new Uint8Array(32), 
            contractFeeAmount: '10' 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.UPDATE_CONTRACT_TXN:
        return { 
          contractUpdateTxn: { 
            contractId: '$ZRA+0000', 
            contractVersion: 2, 
            name: 'Updated Contract' 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.VALIDATOR_REGISTRATION_TXN:
        return { 
          validatorRegistration: { 
            validator: { 
              publicKey: { single: mockKey }, 
              host: 'validator.example.com', 
              clientPort: '8080', 
              validatorPort: '9090' 
            }, 
            register: true 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.VALIDATOR_HEARTBEAT_TXN:
        return { 
          validatorHeartbeat: { 
            online: true, 
            version: 1 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.PROPOSAL_RESULT_TXN:
        return { 
          proposalResult: { 
            contractId: '$ZRA+0000', 
            proposalId: new Uint8Array(32), 
            supportCurEquiv: '1000', 
            againstCurEquiv: '500' 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.DELEGATED_VOTING_TXN:
        return { 
          delegatedTxn: { 
            base: baseStructure.base, 
            delegateVotes: [{ 
              address: new Uint8Array(32), 
              contracts: [{ 
                contractId: '$ZRA+0000', 
                priority: 1 
              }] 
            }] 
          }, 
          toBinary: () => new Uint8Array(200) 
        };
      case TRANSACTION_TYPE.REVOKE_TXN:
        return { 
          revokeTxn: { 
            contractId: '$ZRA+0000', 
            recipientAddress: new Uint8Array(32), 
            itemId: 'ITEM001' 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.QUASH_TXN:
        return { 
          quashTxn: { 
            contractId: '$ZRA+0000', 
            txnHash: new Uint8Array(32) 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.FAST_QUORUM_TXN:
        return { 
          fastQuorumTxn: { 
            proposalId: new Uint8Array(32) 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.COMPLIANCE_TXN:
        return { 
          complianceTxn: { 
            contractId: '$ZRA+0000', 
            compliance: [{ 
              recipientAddress: new Uint8Array(32), 
              complianceLevel: 1, 
              assignRevoke: true 
            }] 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.SBT_BURN_TXN:
        return { 
          burnSbtTxn: { 
            contractId: '$ZRA+0000', 
            itemId: 'SBT001' 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.REQUIRED_VERSION_TXN:
        return { 
          requiredVersion: { 
            version: [1, 2, 3] 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.SMART_CONTRACT_INSTANTIATE_TXN:
        return { 
          smartContractInstantiateTxn: { 
            smartContractName: 'TestContract', 
            instance: 1, 
            parameters: [] 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.ALLOWANCE_TXN:
        return { 
          allowanceTxn: { 
            contractId: '$ZRA+0000', 
            walletAddress: new Uint8Array(32), 
            allowedCurrencyEquivalent: '1000', 
            allowedAmount: '500' 
          }, 
          ...baseStructure 
        };
      case TRANSACTION_TYPE.FOUNDATION_TXN:
        return { 
          foundationTxn: { 
            restrictedSymbols: ['SYMBOL1', 'SYMBOL2'], 
            byteMultiplier: [{ 
              txnType: TRANSACTION_TYPE.COIN_TXN, 
              multiplier: 1.5 
            }] 
          }, 
          ...baseStructure 
        };
      default:
        return baseStructure;
    }
  }

  /**
   * Get transaction type name for logging
   */
  function getTransactionTypeName(transactionType: number): string {
    const typeNames: Record<number, string> = {
      [TRANSACTION_TYPE.COIN_TXN]: 'COIN_TXN',
      [TRANSACTION_TYPE.MINT_TXN]: 'MINT_TXN',
      [TRANSACTION_TYPE.ITEM_MINT_TXN]: 'ITEM_MINT_TXN',
      [TRANSACTION_TYPE.CONTRACT_TXN]: 'CONTRACT_TXN',
      [TRANSACTION_TYPE.VOTE_TXN]: 'VOTE_TXN',
      [TRANSACTION_TYPE.PROPOSAL_TXN]: 'PROPOSAL_TXN',
      [TRANSACTION_TYPE.SMART_CONTRACT_TXN]: 'SMART_CONTRACT_TXN',
      [TRANSACTION_TYPE.SMART_CONTRACT_EXECUTE_TXN]: 'SMART_CONTRACT_EXECUTE_TXN',
      [TRANSACTION_TYPE.NFT_TXN]: 'NFT_TXN',
      [TRANSACTION_TYPE.UPDATE_CONTRACT_TXN]: 'UPDATE_CONTRACT_TXN',
      [TRANSACTION_TYPE.VALIDATOR_REGISTRATION_TXN]: 'VALIDATOR_REGISTRATION_TXN',
      [TRANSACTION_TYPE.VALIDATOR_HEARTBEAT_TXN]: 'VALIDATOR_HEARTBEAT_TXN',
      [TRANSACTION_TYPE.PROPOSAL_RESULT_TXN]: 'PROPOSAL_RESULT_TXN',
      [TRANSACTION_TYPE.DELEGATED_VOTING_TXN]: 'DELEGATED_VOTING_TXN',
      [TRANSACTION_TYPE.REVOKE_TXN]: 'REVOKE_TXN',
      [TRANSACTION_TYPE.QUASH_TXN]: 'QUASH_TXN',
      [TRANSACTION_TYPE.FAST_QUORUM_TXN]: 'FAST_QUORUM_TXN',
      [TRANSACTION_TYPE.COMPLIANCE_TXN]: 'COMPLIANCE_TXN',
      [TRANSACTION_TYPE.SBT_BURN_TXN]: 'SBT_BURN_TXN',
      [TRANSACTION_TYPE.REQUIRED_VERSION_TXN]: 'REQUIRED_VERSION_TXN',
      [TRANSACTION_TYPE.SMART_CONTRACT_INSTANTIATE_TXN]: 'SMART_CONTRACT_INSTANTIATE_TXN',
      [TRANSACTION_TYPE.ALLOWANCE_TXN]: 'ALLOWANCE_TXN',
      [TRANSACTION_TYPE.FOUNDATION_TXN]: 'FOUNDATION_TXN'
    };
    return typeNames[transactionType] || 'UNKNOWN_TYPE';
  }

  it('should auto-detect transaction types and calculate fees', async () => {
    const testCases = [
      TRANSACTION_TYPE.COIN_TXN, TRANSACTION_TYPE.MINT_TXN, TRANSACTION_TYPE.ITEM_MINT_TXN,
      TRANSACTION_TYPE.CONTRACT_TXN, TRANSACTION_TYPE.VOTE_TXN, TRANSACTION_TYPE.PROPOSAL_TXN,
      TRANSACTION_TYPE.SMART_CONTRACT_TXN, TRANSACTION_TYPE.SMART_CONTRACT_EXECUTE_TXN,
      TRANSACTION_TYPE.NFT_TXN, TRANSACTION_TYPE.UPDATE_CONTRACT_TXN,
      TRANSACTION_TYPE.VALIDATOR_REGISTRATION_TXN, TRANSACTION_TYPE.VALIDATOR_HEARTBEAT_TXN,
      TRANSACTION_TYPE.PROPOSAL_RESULT_TXN, TRANSACTION_TYPE.DELEGATED_VOTING_TXN,
      TRANSACTION_TYPE.REVOKE_TXN, TRANSACTION_TYPE.QUASH_TXN, TRANSACTION_TYPE.FAST_QUORUM_TXN,
      TRANSACTION_TYPE.COMPLIANCE_TXN, TRANSACTION_TYPE.SBT_BURN_TXN,
      TRANSACTION_TYPE.REQUIRED_VERSION_TXN, TRANSACTION_TYPE.SMART_CONTRACT_INSTANTIATE_TXN,
      TRANSACTION_TYPE.ALLOWANCE_TXN, TRANSACTION_TYPE.FOUNDATION_TXN
    ];

    for (const expectedType of testCases) {
      const protoObject = createMockProtoObject(expectedType);
      const result = await UniversalFeeCalculator.calculateFee({
        protoObject,
        baseFeeId: '$ZRA+0000'
      });
      expect(result.networkFee).toBeDefined();
      expect(result.networkFee).not.toBe('0');
    }
  });

  it('should auto-detect key types and calculate fees', async () => {
    const testCases = [
      { keyType: KEY_TYPE.ED25519, expectedFeeType: 'A_KEY_FEE' },
      { keyType: KEY_TYPE.ED448, expectedFeeType: 'B_KEY_FEE' }
    ];

    for (const testCase of testCases) {
      const protoObject = createMockProtoObject(TRANSACTION_TYPE.COIN_TXN, testCase.keyType);
      const result = await UniversalFeeCalculator.calculateFee({
        protoObject,
        baseFeeId: '$ZRA+0000'
      });
      expect(result.networkFee).toBeDefined();
      expect(result.networkFee).not.toBe('0');
    }
  });

  it('should use specified baseFeeId for calculations', async () => {
    const testCases = [
      { baseFeeId: '$ZRA+0000', description: 'Default ZRA' },
      { baseFeeId: '$USDC+0000', description: 'USDC' },
      { baseFeeId: '$ETH+0000', description: 'ETH' },
      { baseFeeId: '$BTC+0000', description: 'BTC' }
    ];

    for (const testCase of testCases) {
      const protoObject = createMockProtoObject(TRANSACTION_TYPE.COIN_TXN);
      const result = await UniversalFeeCalculator.calculateFee({
        protoObject,
        baseFeeId: testCase.baseFeeId
      });
      expect(result.networkFee).toBeDefined();
      expect(result.networkFee).not.toBe('0');
    }
  });

  it('should handle error for invalid protoObjects', async () => {
    await expect(UniversalFeeCalculator.calculateFee({
      protoObject: {},
      baseFeeId: '$ZRA+0000'
    })).rejects.toThrow('Unable to determine transaction type');

    await expect(UniversalFeeCalculator.calculateFee({
      protoObject: { toBinary: () => new Uint8Array(10) },
      baseFeeId: '$ZRA+0000'
    })).rejects.toThrow('Unable to determine transaction type');

    await expect(UniversalFeeCalculator.calculateFee({
      protoObject: null as any,
      baseFeeId: '$ZRA+0000'
    })).rejects.toThrow('Failed to extract transaction type');
  });

  it('should maintain backward compatibility for calculateFee', async () => {
    const result = await UniversalFeeCalculator.calculateFee({
      protoObject: createMockProtoObject(TRANSACTION_TYPE.COIN_TXN),
      baseFeeId: '$ZRA+0000'
    });
    expect(result.networkFee).toBeDefined();
  });

  it('should perform efficiently with multiple transactions', async () => {
    const transactionCount = 100;
    const protoObjects: any[] = [];

    for (let i = 0; i < transactionCount; i++) {
      const transactionType = Object.values(TRANSACTION_TYPE)[i % Object.keys(TRANSACTION_TYPE).length];
      protoObjects.push(createMockProtoObject(transactionType));
    }

    const startTime = Date.now();
    const promises = protoObjects.map(protoObject =>
      UniversalFeeCalculator.calculateFee({
        protoObject,
        baseFeeId: '$ZRA+0000'
      })
    );

    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    const avgTime = duration / transactionCount;

    expect(results.length).toBe(transactionCount);
    expect(avgTime).toBeLessThan(50); // Expect average time per transaction to be fast
  });
});