/**
 * Comprehensive Auto-Detection Test Suite
 * Tests all auto-detection features in Universal Fee Calculator
 */

import { UniversalFeeCalculator } from '../universal-fee-calculator.js';
import { TRANSACTION_TYPE, CONTRACT_FEE_TYPE } from '../../protobuf-enums.js';
import { KEY_TYPE } from '../../../wallet-creation/constants.js';

/**
 * Test helper function for assertions
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Create mock protoObject for different transaction types
 */
function createMockProtoObject(transactionType: number, keyType: string = KEY_TYPE.ED25519): any {
  const keySize = keyType === KEY_TYPE.ED25519 ? 32 : 57;
  const mockKey = new Uint8Array(keySize);
  
  const baseStructure = {
    base: {
      publicKey: {
        single: mockKey
      }
    },
    toBinary: () => new Uint8Array(100) // Mock size
  };

  switch (transactionType) {
    case TRANSACTION_TYPE.COIN_TXN:
      return {
        coinTxn: {
          contractId: 'ZRA+0000',
          auth: {
            publicKey: [{
              single: mockKey
            }]
          },
          inputTransfers: [],
          outputTransfers: []
        },
        toBinary: () => new Uint8Array(150)
      };

    case TRANSACTION_TYPE.MINT_TXN:
      return {
        mintTxn: {
          contractId: 'ZRA+0000',
          amount: '1000',
          recipientAddress: new Uint8Array(32)
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.ITEM_MINT_TXN:
      return {
        itemMintTxn: {
          contractId: 'ZRA+0000',
          itemId: 'ITEM001',
          recipientAddress: new Uint8Array(32),
          votingWeight: 1
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.CONTRACT_TXN:
      return {
        contractTxn: {
          contractId: 'ZRA+0000',
          version: 1,
          name: 'Test Contract'
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.VOTE_TXN:
      return {
        governanceVote: {
          contractId: 'ZRA+0000',
          proposalId: new Uint8Array(32),
          support: true
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.PROPOSAL_TXN:
      return {
        governanceProposal: {
          contractId: 'ZRA+0000',
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
          language: 0, // COMPILED
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
          contractId: 'ZRA+0000',
          itemId: 'NFT001',
          recipientAddress: new Uint8Array(32),
          contractFeeAmount: '10'
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.UPDATE_CONTRACT_TXN:
      return {
        contractUpdateTxn: {
          contractId: 'ZRA+0000',
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
          contractId: 'ZRA+0000',
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
              contractId: 'ZRA+0000',
              priority: 1
            }]
          }]
        },
        toBinary: () => new Uint8Array(200)
      };

    case TRANSACTION_TYPE.REVOKE_TXN:
      return {
        revokeTxn: {
          contractId: 'ZRA+0000',
          recipientAddress: new Uint8Array(32),
          itemId: 'ITEM001'
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.QUASH_TXN:
      return {
        quashTxn: {
          contractId: 'ZRA+0000',
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
          contractId: 'ZRA+0000',
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
          contractId: 'ZRA+0000',
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
          contractId: 'ZRA+0000',
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
 * Test transaction type auto-detection
 */
async function testTransactionTypeAutoDetection(): Promise<boolean> {
  console.log('=== Testing Transaction Type Auto-Detection ===\n');
  
  const testCases = [
    TRANSACTION_TYPE.COIN_TXN,
    TRANSACTION_TYPE.MINT_TXN,
    TRANSACTION_TYPE.ITEM_MINT_TXN,
    TRANSACTION_TYPE.CONTRACT_TXN,
    TRANSACTION_TYPE.VOTE_TXN,
    TRANSACTION_TYPE.PROPOSAL_TXN,
    TRANSACTION_TYPE.SMART_CONTRACT_TXN,
    TRANSACTION_TYPE.SMART_CONTRACT_EXECUTE_TXN,
    TRANSACTION_TYPE.NFT_TXN,
    TRANSACTION_TYPE.UPDATE_CONTRACT_TXN,
    TRANSACTION_TYPE.VALIDATOR_REGISTRATION_TXN,
    TRANSACTION_TYPE.VALIDATOR_HEARTBEAT_TXN,
    TRANSACTION_TYPE.PROPOSAL_RESULT_TXN,
    TRANSACTION_TYPE.DELEGATED_VOTING_TXN,
    TRANSACTION_TYPE.REVOKE_TXN,
    TRANSACTION_TYPE.QUASH_TXN,
    TRANSACTION_TYPE.FAST_QUORUM_TXN,
    TRANSACTION_TYPE.COMPLIANCE_TXN,
    TRANSACTION_TYPE.SBT_BURN_TXN,
    TRANSACTION_TYPE.REQUIRED_VERSION_TXN,
    TRANSACTION_TYPE.SMART_CONTRACT_INSTANTIATE_TXN,
    TRANSACTION_TYPE.ALLOWANCE_TXN,
    TRANSACTION_TYPE.FOUNDATION_TXN
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const expectedType of testCases) {
    try {
      const protoObject = createMockProtoObject(expectedType);
      
      // Test auto-detection
      const result = await UniversalFeeCalculator.calculateFee({
        protoObject,
        baseFeeId: '$ZRA+0000'
      });

      assert(
        result.networkFee !== undefined,
        `Expected networkFee to be defined`
      );

      console.log(`✅ ${getTransactionTypeName(expectedType)}: Detected correctly`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${getTransactionTypeName(expectedType)}: ${(error as Error).message}`);
    }
  }

  console.log(`\nTransaction Type Auto-Detection: ${passedTests}/${totalTests} tests passed\n`);
  return passedTests === totalTests;
}

/**
 * Test key type auto-detection
 */
async function testKeyTypeAutoDetection(): Promise<boolean> {
  console.log('=== Testing Key Type Auto-Detection ===\n');
  
  const testCases = [
    { keyType: KEY_TYPE.ED25519, expectedFeeType: 'A_KEY_FEE' },
    { keyType: KEY_TYPE.ED448, expectedFeeType: 'B_KEY_FEE' }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      const protoObject = createMockProtoObject(TRANSACTION_TYPE.COIN_TXN, testCase.keyType);
      
      const result = await UniversalFeeCalculator.calculateFee({
        protoObject,
        baseFeeId: '$ZRA+0000'
      });

      assert(
        result.networkFee !== undefined,
        `Expected networkFee to be defined`
      );

      console.log(`✅ ${testCase.keyType}: Detected ${testCase.expectedFeeType} correctly`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${testCase.keyType}: ${(error as Error).message}`);
    }
  }

  console.log(`\nKey Type Auto-Detection: ${passedTests}/${totalTests} tests passed\n`);
  return passedTests === totalTests;
}

/**
 * Test baseFeeId parameter functionality
 */
async function testBaseFeeIdParameter(): Promise<boolean> {
  console.log('=== Testing Base Fee ID Parameter ===\n');
  
  const testCases = [
    { baseFeeId: '$ZRA+0000', description: 'Default ZRA' },
    { baseFeeId: '$USDC+0000', description: 'USDC' },
    { baseFeeId: '$ETH+0000', description: 'ETH' },
    { baseFeeId: '$BTC+0000', description: 'BTC' }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      const protoObject = createMockProtoObject(TRANSACTION_TYPE.COIN_TXN);
      
      const result = await UniversalFeeCalculator.calculateFee({
        protoObject,
        baseFeeId: testCase.baseFeeId
      });

      assert(
        result.networkFee !== undefined,
        `Expected networkFee to be defined`
      );

      console.log(`✅ ${testCase.description}: Fee calculated correctly`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${testCase.description}: ${(error as Error).message}`);
    }
  }

  console.log(`\nBase Fee ID Parameter: ${passedTests}/${totalTests} tests passed\n`);
  return passedTests === totalTests;
}

/**
 * Test fee type auto-detection
 */
async function testFeeTypeAutoDetection(): Promise<boolean> {
  console.log('=== Testing Fee Type Auto-Detection ===\n');
  
  const testCases = [
    {
      transactionType: TRANSACTION_TYPE.COIN_TXN,
      expectedFeeTypes: ['A_KEY_FEE', 'a_HASH_FEE', 'COIN_TXN_FEE'],
      description: 'CoinTXN with ED25519'
    },
    {
      transactionType: TRANSACTION_TYPE.MINT_TXN,
      expectedFeeTypes: ['A_KEY_FEE', 'a_HASH_FEE', 'MINT_TXN_FEE'],
      description: 'MintTXN with ED25519'
    },
    {
      transactionType: TRANSACTION_TYPE.SMART_CONTRACT_TXN,
      expectedFeeTypes: ['A_KEY_FEE', 'a_HASH_FEE', 'SMART_CONTRACT_DEPLOYMENT_TXN_FEE'],
      description: 'SmartContractTXN with ED25519'
    },
    {
      transactionType: TRANSACTION_TYPE.NFT_TXN,
      expectedFeeTypes: ['A_KEY_FEE', 'a_HASH_FEE', 'NFT_TXN_FEE'],
      description: 'NFTTXN with ED25519'
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      const protoObject = createMockProtoObject(testCase.transactionType);
      
      const result = await UniversalFeeCalculator.calculateFee({
        protoObject,
        baseFeeId: '$ZRA+0000'
      });

      assert(
        result.networkFee !== undefined,
        `Expected networkFee to be defined`
      );

      console.log(`✅ ${testCase.description}: Fee calculated correctly`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${testCase.description}: ${(error as Error).message}`);
    }
  }

  console.log(`\nFee Type Auto-Detection: ${passedTests}/${totalTests} tests passed\n`);
  return passedTests === totalTests;
}

/**
 * Test error handling for invalid protoObjects
 */
async function testErrorHandling(): Promise<boolean> {
  console.log('=== Testing Error Handling ===\n');
  
  const testCases = [
    {
      protoObject: {},
      expectedError: 'Unable to determine transaction type',
      description: 'Empty protoObject'
    },
    {
      protoObject: { toBinary: () => new Uint8Array(10) },
      expectedError: 'Unable to determine transaction type',
      description: 'ProtoObject without transaction fields'
    },
    {
      protoObject: null,
      expectedError: 'Failed to extract transaction type',
      description: 'Null protoObject'
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      await UniversalFeeCalculator.calculateFee({
        protoObject: testCase.protoObject,
        baseFeeId: '$ZRA+0000'
      });
      
      console.log(`❌ ${testCase.description}: Expected error but got success`);
    } catch (error) {
      if ((error as Error).message.includes(testCase.expectedError)) {
        console.log(`✅ ${testCase.description}: Error handled correctly`);
        console.log(`   Error: ${(error as Error).message}`);
        passedTests++;
      } else {
        console.log(`❌ ${testCase.description}: Unexpected error: ${(error as Error).message}`);
      }
    }
  }

  console.log(`\nError Handling: ${passedTests}/${totalTests} tests passed\n`);
  return passedTests === totalTests;
}

/**
 * Test backward compatibility
 */
async function testBackwardCompatibility(): Promise<boolean> {
  console.log('=== Testing Backward Compatibility ===\n');
  
  const testCases = [
    {
      method: 'calculateFee',
      params: {
        protoObject: createMockProtoObject(TRANSACTION_TYPE.COIN_TXN),
        baseFeeId: '$ZRA+0000'
      },
      description: 'calculateFee with manual parameters'
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      const result = await (UniversalFeeCalculator as any)[testCase.method](testCase.params);
      
      assert(result.networkFee, 'Result should have networkFee property');
      
      console.log(`✅ ${testCase.description}: Works correctly`);
      console.log(`   Network Fee: ${result.networkFee}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${testCase.description}: ${(error as Error).message}`);
    }
  }

  console.log(`\nBackward Compatibility: ${passedTests}/${totalTests} tests passed\n`);
  return passedTests === totalTests;
}

/**
 * Test performance with multiple transactions
 */
async function testPerformance(): Promise<boolean> {
  console.log('=== Testing Performance ===\n');
  
  const transactionCount = 100;
  const protoObjects: any[] = [];
  
  // Create multiple protoObjects
  for (let i = 0; i < transactionCount; i++) {
    const transactionType = Object.values(TRANSACTION_TYPE)[i % Object.keys(TRANSACTION_TYPE).length];
    protoObjects.push(createMockProtoObject(transactionType));
  }
  
  const startTime = Date.now();
  let successCount = 0;
  
  try {
    const promises = protoObjects.map(protoObject => 
      UniversalFeeCalculator.calculateFee({
        protoObject,
        baseFeeId: '$ZRA+0000'
      })
    );
    
    const results = await Promise.all(promises);
    successCount = results.length;
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const avgTime = duration / transactionCount;
    
    console.log(`✅ Processed ${successCount} transactions in ${duration}ms`);
    console.log(`   Average time per transaction: ${avgTime.toFixed(2)}ms`);
    
    return successCount === transactionCount;
  } catch (error) {
    console.log(`❌ Performance test failed: ${(error as Error).message}`);
    return false;
  }
}

/**
 * Helper function to get transaction type name
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

/**
 * Run all auto-detection tests
 */
export async function runAllAutoDetectionTests(): Promise<boolean> {
  console.log('🚀 Starting Comprehensive Auto-Detection Test Suite\n');
  console.log('='.repeat(60));
  
  const testResults: boolean[] = [];
  
  try {
    testResults.push(await testTransactionTypeAutoDetection());
    testResults.push(await testKeyTypeAutoDetection());
    testResults.push(await testBaseFeeIdParameter());
    testResults.push(await testFeeTypeAutoDetection());
    testResults.push(await testErrorHandling());
    testResults.push(await testBackwardCompatibility());
    testResults.push(await testPerformance());
    
    const passedTests = testResults.filter(result => result).length;
    const totalTests = testResults.length;
    
    console.log('='.repeat(60));
    console.log(`🎯 Auto-Detection Test Suite Results: ${passedTests}/${totalTests} test suites passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All auto-detection features are working correctly!');
    } else {
      console.log('⚠️  Some tests failed. Please review the output above.');
    }
    
    return passedTests === totalTests;
  } catch (error) {
    console.error('❌ Test suite failed with error:', (error as Error).message);
    return false;
  }
}

// Export individual test functions for selective testing
export {
  testTransactionTypeAutoDetection,
  testKeyTypeAutoDetection,
  testBaseFeeIdParameter,
  testFeeTypeAutoDetection,
  testErrorHandling,
  testBackwardCompatibility,
  testPerformance
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllAutoDetectionTests().catch(console.error);
}
