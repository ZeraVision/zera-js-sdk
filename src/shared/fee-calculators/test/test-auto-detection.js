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
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Create mock protoObject for different transaction types
 */
function createMockProtoObject(transactionType, keyType = KEY_TYPE.ED25519) {
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
    case TRANSACTION_TYPE.COIN_TYPE:
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

    case TRANSACTION_TYPE.MINT_TYPE:
      return {
        mintTxn: {
          contractId: 'ZRA+0000',
          amount: '1000',
          recipientAddress: new Uint8Array(32)
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.ITEM_MINT_TYPE:
      return {
        itemMintTxn: {
          contractId: 'ZRA+0000',
          itemId: 'ITEM001',
          recipientAddress: new Uint8Array(32),
          votingWeight: 1
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.CONTRACT_TXN_TYPE:
      return {
        contractTxn: {
          contractId: 'ZRA+0000',
          version: 1,
          name: 'Test Contract'
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.VOTE_TYPE:
      return {
        governanceVote: {
          contractId: 'ZRA+0000',
          proposalId: new Uint8Array(32),
          support: true
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.PROPOSAL_TYPE:
      return {
        governanceProposal: {
          contractId: 'ZRA+0000',
          title: 'Test Proposal',
          synopsis: 'Test synopsis',
          body: 'Test body'
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.SMART_CONTRACT_TYPE:
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

    case TRANSACTION_TYPE.SMART_CONTRACT_EXECUTE_TYPE:
      return {
        smartContractExecuteTxn: {
          smartContractName: 'TestContract',
          instance: new Uint8Array(32),
          function: 'testFunction',
          parameters: []
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.NFT_TYPE:
      return {
        nftTxn: {
          contractId: 'ZRA+0000',
          itemId: 'NFT001',
          recipientAddress: new Uint8Array(32),
          contractFeeAmount: '10'
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.UPDATE_CONTRACT_TYPE:
      return {
        contractUpdateTxn: {
          contractId: 'ZRA+0000',
          contractVersion: 2,
          name: 'Updated Contract'
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.VALIDATOR_REGISTRATION_TYPE:
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

    case TRANSACTION_TYPE.VALIDATOR_HEARTBEAT_TYPE:
      return {
        validatorHeartbeat: {
          online: true,
          version: 1
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.PROPOSAL_RESULT_TYPE:
      return {
        proposalResult: {
          contractId: 'ZRA+0000',
          proposalId: new Uint8Array(32),
          supportCurEquiv: '1000',
          againstCurEquiv: '500'
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.DELEGATED_VOTING_TYPE:
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

    case TRANSACTION_TYPE.REVOKE_TYPE:
      return {
        revokeTxn: {
          contractId: 'ZRA+0000',
          recipientAddress: new Uint8Array(32),
          itemId: 'ITEM001'
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.QUASH_TYPE:
      return {
        quashTxn: {
          contractId: 'ZRA+0000',
          txnHash: new Uint8Array(32)
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.FAST_QUORUM_TYPE:
      return {
        fastQuorumTxn: {
          proposalId: new Uint8Array(32)
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.COMPLIANCE_TYPE:
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

    case TRANSACTION_TYPE.SBT_BURN_TYPE:
      return {
        burnSbtTxn: {
          contractId: 'ZRA+0000',
          itemId: 'SBT001'
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.REQUIRED_VERSION:
      return {
        requiredVersion: {
          version: [1, 2, 3]
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.SMART_CONTRACT_INSTANTIATE_TYPE:
      return {
        smartContractInstantiateTxn: {
          smartContractName: 'TestContract',
          instance: 1,
          parameters: []
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.ALLOWANCE_TYPE:
      return {
        allowanceTxn: {
          contractId: 'ZRA+0000',
          walletAddress: new Uint8Array(32),
          allowedCurrencyEquivalent: '1000',
          allowedAmount: '500'
        },
        ...baseStructure
      };

    case TRANSACTION_TYPE.FOUNDATION_TYPE:
      return {
        foundationTxn: {
          restrictedSymbols: ['SYMBOL1', 'SYMBOL2'],
          byteMultiplier: [{
            txnType: TRANSACTION_TYPE.COIN_TYPE,
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
async function testTransactionTypeAutoDetection() {
  console.log('=== Testing Transaction Type Auto-Detection ===\n');
  
  const testCases = [
    TRANSACTION_TYPE.COIN_TYPE,
    TRANSACTION_TYPE.MINT_TYPE,
    TRANSACTION_TYPE.ITEM_MINT_TYPE,
    TRANSACTION_TYPE.CONTRACT_TXN_TYPE,
    TRANSACTION_TYPE.VOTE_TYPE,
    TRANSACTION_TYPE.PROPOSAL_TYPE,
    TRANSACTION_TYPE.SMART_CONTRACT_TYPE,
    TRANSACTION_TYPE.SMART_CONTRACT_EXECUTE_TYPE,
    TRANSACTION_TYPE.NFT_TYPE,
    TRANSACTION_TYPE.UPDATE_CONTRACT_TYPE,
    TRANSACTION_TYPE.VALIDATOR_REGISTRATION_TYPE,
    TRANSACTION_TYPE.VALIDATOR_HEARTBEAT_TYPE,
    TRANSACTION_TYPE.PROPOSAL_RESULT_TYPE,
    TRANSACTION_TYPE.DELEGATED_VOTING_TYPE,
    TRANSACTION_TYPE.REVOKE_TYPE,
    TRANSACTION_TYPE.QUASH_TYPE,
    TRANSACTION_TYPE.FAST_QUORUM_TYPE,
    TRANSACTION_TYPE.COMPLIANCE_TYPE,
    TRANSACTION_TYPE.SBT_BURN_TYPE,
    TRANSACTION_TYPE.REQUIRED_VERSION,
    TRANSACTION_TYPE.SMART_CONTRACT_INSTANTIATE_TYPE,
    TRANSACTION_TYPE.ALLOWANCE_TYPE,
    TRANSACTION_TYPE.FOUNDATION_TYPE
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const expectedType of testCases) {
    try {
      const protoObject = createMockProtoObject(expectedType);
      
      // Test auto-detection
      const result = await UniversalFeeCalculator.autoCalculateNetworkFee({
        protoObject,
        baseFeeId: '$ZRA+0000'
      });

      assert(
        result.transactionType === expectedType,
        `Expected ${expectedType}, got ${result.transactionType}`
      );

      console.log(`✅ ${getTransactionTypeName(expectedType)}: Detected correctly`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${getTransactionTypeName(expectedType)}: ${error.message}`);
    }
  }

  console.log(`\nTransaction Type Auto-Detection: ${passedTests}/${totalTests} tests passed\n`);
  return passedTests === totalTests;
}

/**
 * Test key type auto-detection
 */
async function testKeyTypeAutoDetection() {
  console.log('=== Testing Key Type Auto-Detection ===\n');
  
  const testCases = [
    { keyType: KEY_TYPE.ED25519, expectedFeeType: 'A_KEY_FEE' },
    { keyType: KEY_TYPE.ED448, expectedFeeType: 'B_KEY_FEE' }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      const protoObject = createMockProtoObject(TRANSACTION_TYPE.COIN_TYPE, testCase.keyType);
      
      const result = await UniversalFeeCalculator.autoCalculateNetworkFee({
        protoObject,
        baseFeeId: '$ZRA+0000'
      });

      assert(
        result.breakdown.feeTypes.includes(testCase.expectedFeeType),
        `Expected ${testCase.expectedFeeType} in fee types: ${result.breakdown.feeTypes}`
      );

      console.log(`✅ ${testCase.keyType}: Detected ${testCase.expectedFeeType} correctly`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${testCase.keyType}: ${error.message}`);
    }
  }

  console.log(`\nKey Type Auto-Detection: ${passedTests}/${totalTests} tests passed\n`);
  return passedTests === totalTests;
}

/**
 * Test baseFeeId parameter functionality
 */
async function testBaseFeeIdParameter() {
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
      const protoObject = createMockProtoObject(TRANSACTION_TYPE.COIN_TYPE);
      
      const result = await UniversalFeeCalculator.autoCalculateNetworkFee({
        protoObject,
        baseFeeId: testCase.baseFeeId
      });

      assert(
        result.feeId === testCase.baseFeeId,
        `Expected feeId ${testCase.baseFeeId}, got ${result.feeId}`
      );

      console.log(`✅ ${testCase.description}: Fee ID set correctly to ${result.feeId}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${testCase.description}: ${error.message}`);
    }
  }

  console.log(`\nBase Fee ID Parameter: ${passedTests}/${totalTests} tests passed\n`);
  return passedTests === totalTests;
}

/**
 * Test fee type auto-detection
 */
async function testFeeTypeAutoDetection() {
  console.log('=== Testing Fee Type Auto-Detection ===\n');
  
  const testCases = [
    {
      transactionType: TRANSACTION_TYPE.COIN_TYPE,
      expectedFeeTypes: ['A_KEY_FEE', 'a_HASH_FEE', 'COIN_TXN_FEE'],
      description: 'CoinTXN with ED25519'
    },
    {
      transactionType: TRANSACTION_TYPE.MINT_TYPE,
      expectedFeeTypes: ['A_KEY_FEE', 'a_HASH_FEE', 'MINT_TXN_FEE'],
      description: 'MintTXN with ED25519'
    },
    {
      transactionType: TRANSACTION_TYPE.SMART_CONTRACT_TYPE,
      expectedFeeTypes: ['A_KEY_FEE', 'a_HASH_FEE', 'SMART_CONTRACT_DEPLOYMENT_TXN_FEE'],
      description: 'SmartContractTXN with ED25519'
    },
    {
      transactionType: TRANSACTION_TYPE.NFT_TYPE,
      expectedFeeTypes: ['A_KEY_FEE', 'a_HASH_FEE', 'NFT_TXN_FEE'],
      description: 'NFTTXN with ED25519'
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      const protoObject = createMockProtoObject(testCase.transactionType);
      
      const result = await UniversalFeeCalculator.autoCalculateNetworkFee({
        protoObject,
        baseFeeId: '$ZRA+0000'
      });

      const detectedFeeTypes = result.breakdown.feeTypes.split(',');
      
      for (const expectedFeeType of testCase.expectedFeeTypes) {
        assert(
          detectedFeeTypes.includes(expectedFeeType),
          `Expected ${expectedFeeType} in detected fee types: ${detectedFeeTypes.join(', ')}`
        );
      }

      console.log(`✅ ${testCase.description}: Fee types detected correctly`);
      console.log(`   Detected: ${detectedFeeTypes.join(', ')}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${testCase.description}: ${error.message}`);
    }
  }

  console.log(`\nFee Type Auto-Detection: ${passedTests}/${totalTests} tests passed\n`);
  return passedTests === totalTests;
}

/**
 * Test error handling for invalid protoObjects
 */
async function testErrorHandling() {
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
      await UniversalFeeCalculator.autoCalculateNetworkFee({
        protoObject: testCase.protoObject,
        baseFeeId: '$ZRA+0000'
      });
      
      console.log(`❌ ${testCase.description}: Expected error but got success`);
    } catch (error) {
      if (error.message.includes(testCase.expectedError)) {
        console.log(`✅ ${testCase.description}: Error handled correctly`);
        console.log(`   Error: ${error.message}`);
        passedTests++;
      } else {
        console.log(`❌ ${testCase.description}: Unexpected error: ${error.message}`);
      }
    }
  }

  console.log(`\nError Handling: ${passedTests}/${totalTests} tests passed\n`);
  return passedTests === totalTests;
}

/**
 * Test backward compatibility
 */
async function testBackwardCompatibility() {
  console.log('=== Testing Backward Compatibility ===\n');
  
  const testCases = [
    {
      method: 'calculateNetworkFee',
      params: {
        protoObject: createMockProtoObject(TRANSACTION_TYPE.COIN_TYPE),
        transactionType: TRANSACTION_TYPE.COIN_TYPE,
        baseFeeId: '$ZRA+0000'
      },
      description: 'calculateNetworkFee with manual parameters'
    },
    {
      method: 'calculateTotalFees',
      params: {
        protoObject: createMockProtoObject(TRANSACTION_TYPE.COIN_TYPE),
        transactionType: TRANSACTION_TYPE.COIN_TYPE,
        contractId: 'ZRA+0000',
        contractFeeType: CONTRACT_FEE_TYPE.FIXED,
        contractFeeAmount: '10',
        transactionAmount: '100',
        feeContractId: 'ZRA+0000',
        baseFeeId: '$ZRA+0000'
      },
      description: 'calculateTotalFees with manual parameters'
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      const result = await UniversalFeeCalculator[testCase.method](testCase.params);
      
      assert(result.fee, 'Result should have fee property');
      assert(result.feeId, 'Result should have feeId property');
      
      console.log(`✅ ${testCase.description}: Works correctly`);
      console.log(`   Fee: ${result.fee}, Fee ID: ${result.feeId}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${testCase.description}: ${error.message}`);
    }
  }

  console.log(`\nBackward Compatibility: ${passedTests}/${totalTests} tests passed\n`);
  return passedTests === totalTests;
}

/**
 * Test performance with multiple transactions
 */
async function testPerformance() {
  console.log('=== Testing Performance ===\n');
  
  const transactionCount = 100;
  const protoObjects = [];
  
  // Create multiple protoObjects
  for (let i = 0; i < transactionCount; i++) {
    const transactionType = Object.values(TRANSACTION_TYPE)[i % Object.keys(TRANSACTION_TYPE).length];
    protoObjects.push(createMockProtoObject(transactionType));
  }
  
  const startTime = Date.now();
  let successCount = 0;
  
  try {
    const promises = protoObjects.map(protoObject => 
      UniversalFeeCalculator.autoCalculateNetworkFee({
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
    console.log(`❌ Performance test failed: ${error.message}`);
    return false;
  }
}

/**
 * Helper function to get transaction type name
 */
function getTransactionTypeName(transactionType) {
  const typeNames = {
    [TRANSACTION_TYPE.COIN_TYPE]: 'COIN_TYPE',
    [TRANSACTION_TYPE.MINT_TYPE]: 'MINT_TYPE',
    [TRANSACTION_TYPE.ITEM_MINT_TYPE]: 'ITEM_MINT_TYPE',
    [TRANSACTION_TYPE.CONTRACT_TXN_TYPE]: 'CONTRACT_TXN_TYPE',
    [TRANSACTION_TYPE.VOTE_TYPE]: 'VOTE_TYPE',
    [TRANSACTION_TYPE.PROPOSAL_TYPE]: 'PROPOSAL_TYPE',
    [TRANSACTION_TYPE.SMART_CONTRACT_TYPE]: 'SMART_CONTRACT_TYPE',
    [TRANSACTION_TYPE.SMART_CONTRACT_EXECUTE_TYPE]: 'SMART_CONTRACT_EXECUTE_TYPE',
    [TRANSACTION_TYPE.NFT_TYPE]: 'NFT_TYPE',
    [TRANSACTION_TYPE.UPDATE_CONTRACT_TYPE]: 'UPDATE_CONTRACT_TYPE',
    [TRANSACTION_TYPE.VALIDATOR_REGISTRATION_TYPE]: 'VALIDATOR_REGISTRATION_TYPE',
    [TRANSACTION_TYPE.VALIDATOR_HEARTBEAT_TYPE]: 'VALIDATOR_HEARTBEAT_TYPE',
    [TRANSACTION_TYPE.PROPOSAL_RESULT_TYPE]: 'PROPOSAL_RESULT_TYPE',
    [TRANSACTION_TYPE.DELEGATED_VOTING_TYPE]: 'DELEGATED_VOTING_TYPE',
    [TRANSACTION_TYPE.REVOKE_TYPE]: 'REVOKE_TYPE',
    [TRANSACTION_TYPE.QUASH_TYPE]: 'QUASH_TYPE',
    [TRANSACTION_TYPE.FAST_QUORUM_TYPE]: 'FAST_QUORUM_TYPE',
    [TRANSACTION_TYPE.COMPLIANCE_TYPE]: 'COMPLIANCE_TYPE',
    [TRANSACTION_TYPE.SBT_BURN_TYPE]: 'SBT_BURN_TYPE',
    [TRANSACTION_TYPE.REQUIRED_VERSION]: 'REQUIRED_VERSION',
    [TRANSACTION_TYPE.SMART_CONTRACT_INSTANTIATE_TYPE]: 'SMART_CONTRACT_INSTANTIATE_TYPE',
    [TRANSACTION_TYPE.ALLOWANCE_TYPE]: 'ALLOWANCE_TYPE',
    [TRANSACTION_TYPE.FOUNDATION_TYPE]: 'FOUNDATION_TYPE'
  };
  
  return typeNames[transactionType] || 'UNKNOWN_TYPE';
}

/**
 * Run all auto-detection tests
 */
export async function runAllAutoDetectionTests() {
  console.log('🚀 Starting Comprehensive Auto-Detection Test Suite\n');
  console.log('='.repeat(60));
  
  const testResults = [];
  
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
    console.error('❌ Test suite failed with error:', error.message);
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
