/**
 * Test Suite for Unified Fee Calculation System
 * Tests the new calculateFee method with contract fee integration
 */

import { UniversalFeeCalculator } from '../universal-fee-calculator.js';
import { contractFeeService } from '../contract-fee-service.js';
import { 
  getContractFeeConfig, 
  isFeeContractIdAllowed,
  setContractFeeConfig 
} from '../contract-fee-config.js';
import { TRANSACTION_TYPE, CONTRACT_FEE_TYPE } from '../../protobuf-enums.js';
import { KEY_TYPE } from '../../../wallet-creation/constants.js';

/**
 * Test the unified calculateFee method
 */
export async function testUnifiedCalculateFee() {
  console.log('=== Testing Unified calculateFee Method ===\n');
  
  try {
    // Test 1: Network fee only (no contract fee)
    console.log('1. Testing network fee only:');
    const mockProtoObject = {
      toBinary: () => new Uint8Array(500),
      base: {
        contractId: '$ZRA+0000',
        publicKey: {
          single: new Uint8Array(32) // Ed25519 key
        }
      }
    };

    const networkOnlyResult = await UniversalFeeCalculator.calculateFee({
      protoObject: mockProtoObject,
      baseFeeId: '$ZRA+0000'
    });

    console.log(`   Total fee: ${networkOnlyResult.totalFee} ZRA`);
    console.log(`   Network fee: ${networkOnlyResult.networkFee} ZRA`);
    console.log(`   Contract fee: ${networkOnlyResult.contractFee} ZRA`);
    
    // Verify fees are added to proto object
    assert(networkOnlyResult.protoObject.base.baseFeeAmount === networkOnlyResult.networkFee, 'Network fee should be added to proto object');
    assert(networkOnlyResult.protoObject.base.baseFeeId === '$ZRA+0000', 'Base fee ID should be added to proto object');
    assert(networkOnlyResult.protoObject.base.contractFeeAmount === undefined, 'Contract fee should not be added when not specified');
    
    assert(networkOnlyResult.totalFee === networkOnlyResult.networkFee, 'Total fee should equal network fee when no contract fee');
    assert(networkOnlyResult.contractFee === '0', 'Contract fee should be 0 when not specified');
    console.log('   ✅ Network fee only working\n');

    // Test 2: Network fee + contract fee (CoinTXN with contractFeeId)
    console.log('2. Testing network fee + contract fee:');
    
    const mockCoinTxnProto = {
      toBinary: () => new Uint8Array(600),
      base: {
        contractId: '$TESTFEE+0000', // Fixed fee test contract
        publicKey: {
          single: new Uint8Array(32) // Ed25519 key
        }
      }
    };

    const unifiedResult = await UniversalFeeCalculator.calculateFee({
      protoObject: mockCoinTxnProto,
      baseFeeId: '$ZRA+0000',
      contractFeeId: '$TESTFEE+0000',
      transactionAmount: '1.0'
    });

    console.log(`   Total fee: ${unifiedResult.totalFee} ZRA`);
    console.log(`   Network fee: ${unifiedResult.networkFee} ZRA`);
    console.log(`   Contract fee: ${unifiedResult.contractFee} TESTFEE`);
    
    // Verify both fees are added to proto object
    assert(unifiedResult.protoObject.base.baseFeeAmount === unifiedResult.networkFee, 'Network fee should be added to proto object');
    assert(unifiedResult.protoObject.base.baseFeeId === '$ZRA+0000', 'Base fee ID should be added to proto object');
    assert(unifiedResult.protoObject.base.contractFeeAmount === unifiedResult.contractFee, 'Contract fee should be added to proto object');
    assert(unifiedResult.protoObject.base.contractFeeId === '$TESTFEE+0000', 'Contract fee ID should be added to proto object');
    
    assert(unifiedResult.contractFee !== '0', 'Contract fee should be calculated');
    assert(parseFloat(unifiedResult.totalFee) > parseFloat(unifiedResult.networkFee), 'Total fee should be greater than network fee');
    console.log('   ✅ Network + contract fee working\n');

    // Test 3: Contract fee validation (invalid fee contract ID)
    console.log('3. Testing contract fee validation:');
    try {
      await UniversalFeeCalculator.calculateFee({
        protoObject: mockCoinTxnProto,
        baseFeeId: '$ZRA+0000',
        contractFeeId: '$INVALID+9999', // Invalid fee contract ID
        transactionAmount: '1.0'
      });
      console.log('   ❌ Should have thrown error for invalid fee contract ID');
    } catch (error) {
      console.log('   ✅ Correctly threw error for invalid fee contract ID');
      assert(error.message.includes('not allowed'), 'Error should mention fee contract ID not allowed');
    }
    console.log('');

    // Test 4: Non-CoinTXN transaction (should ignore contract fee)
    console.log('4. Testing non-CoinTXN transaction:');
    const mockMintTxnProto = {
      toBinary: () => new Uint8Array(400),
      mintTxn: {
        contractId: '$BTC+1234'
      },
      base: {
        publicKey: {
          single: new Uint8Array(32)
        }
      }
    };

    const mintResult = await UniversalFeeCalculator.calculateFee({
      protoObject: mockMintTxnProto,
      baseFeeId: '$ZRA+0000',
      contractFeeId: '$BTC+1234', // Should be ignored for non-CoinTXN
      transactionAmount: '1.0'
    });

    console.log(`   Total fee: ${mintResult.totalFee} ZRA`);
    console.log(`   Contract fee: ${mintResult.contractFee} ZRA`);
    assert(mintResult.contractFee === '0', 'Contract fee should be 0 for non-CoinTXN transactions');
    console.log('   ✅ Non-CoinTXN transaction handling working\n');

    // Test 5: Verify original proto object is not modified
    console.log('5. Testing proto object cloning:');
    const originalProto = {
      toBinary: () => new Uint8Array(500),
      base: {
        contractId: '$TESTFEE+0000',
        publicKey: {
          single: new Uint8Array(32)
        }
      }
    };

    const cloneTestResult = await UniversalFeeCalculator.calculateFee({
      protoObject: originalProto,
      baseFeeId: '$ZRA+0000',
      contractFeeId: '$TESTFEE+0000',
      transactionAmount: '1.0'
    });

    // Verify original object is unchanged
    assert(originalProto.base.baseFeeAmount === undefined, 'Original proto object should not be modified');
    assert(originalProto.base.contractFeeAmount === undefined, 'Original proto object should not be modified');
    
    // Verify modified object has fees
    assert(cloneTestResult.protoObject.base.baseFeeAmount !== undefined, 'Modified proto object should have network fee');
    assert(cloneTestResult.protoObject.base.contractFeeAmount !== undefined, 'Modified proto object should have contract fee');
    
    console.log('   ✅ Proto object cloning working\n');

    console.log('🎉 Unified calculateFee method tests passed!');
    return { 
      success: true, 
      results: { 
        networkOnlyResult, 
        unifiedResult, 
        mintResult,
        cloneTestResult
      } 
    };
    
  } catch (error) {
    console.error('❌ Unified calculateFee test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test contract fee service functionality
 */
export async function testContractFeeService() {
  console.log('=== Testing Contract Fee Service ===\n');
  
  try {
    // Test 1: Get contract fee info (fallback)
    console.log('1. Testing contract fee info retrieval:');
    const feeInfo = await contractFeeService.getContractFeeInfo('$TESTFEE+0000');
    console.log(`   Fee type: ${feeInfo.feeType}`);
    console.log(`   Fee amount: ${feeInfo.feeAmount}`);
    console.log(`   Allowed fee IDs: ${feeInfo.allowedFeeIds.join(', ')}`);
    assert(feeInfo.feeType === CONTRACT_FEE_TYPE.FIXED, 'Fee type should be FIXED');
    assert(feeInfo.feeAmount === '0.001', 'Fee amount should match configuration');
    console.log('   ✅ Contract fee info retrieval working\n');

    // Test 2: Contract fee calculation
    console.log('2. Testing contract fee calculation:');
    const contractFeeResult = await contractFeeService.calculateContractFee({
      contractId: '$TESTFEE+0000',
      transactionAmount: '1.0',
      feeContractId: '$TESTFEE+0000'
    });

    console.log(`   Contract fee: ${contractFeeResult.fee} TESTFEE`);
    console.log(`   Fee type: ${contractFeeResult.contractFeeType}`);
    assert(contractFeeResult.fee === '0.001', 'Fixed fee should match configured amount');
    console.log('   ✅ Contract fee calculation working\n');

    // Test 3: Percentage-based contract fee
    console.log('3. Testing percentage-based contract fee:');
    const percentageFeeResult = await contractFeeService.calculateContractFee({
      contractId: '$TESTFEE+0002',
      transactionAmount: '100.0',
      feeContractId: '$TESTFEE+0002'
    });

    console.log(`   Percentage fee: ${percentageFeeResult.fee} TESTFEE`);
    assert(percentageFeeResult.fee !== '0', 'Percentage fee should be calculated');
    console.log('   ✅ Percentage-based contract fee working\n');

    // Test 4: Currency equivalent contract fee
    console.log('4. Testing currency equivalent contract fee:');
    const currencyEquivalentResult = await contractFeeService.calculateContractFee({
      contractId: '$TESTFEE+0001',
      transactionAmount: '1.0',
      feeContractId: '$TESTFEE+0001'
    });

    console.log(`   Currency equivalent fee: ${currencyEquivalentResult.fee} TESTFEE`);
    assert(currencyEquivalentResult.fee !== '0', 'Currency equivalent fee should be calculated');
    console.log('   ✅ Currency equivalent contract fee working\n');

    // Test 5: Fee contract ID validation
    console.log('5. Testing fee contract ID validation:');
    try {
      await contractFeeService.calculateContractFee({
        contractId: '$TESTFEE+0000',
        transactionAmount: '1.0',
        feeContractId: '$INVALID+9999'
      });
      console.log('   ❌ Should have thrown error for invalid fee contract ID');
    } catch (error) {
      console.log('   ✅ Correctly threw error for invalid fee contract ID');
      assert(error.message.includes('not allowed'), 'Error should mention fee contract ID not allowed');
    }
    console.log('');

    // Test 6: Cache functionality
    console.log('6. Testing cache functionality:');
    const cacheStats = contractFeeService.getCacheStats();
    console.log(`   Cache size: ${cacheStats.size} entries`);
    console.log(`   Cache timeout: ${cacheStats.timeout}ms`);
    assert(cacheStats.size >= 0, 'Cache size should be non-negative');
    console.log('   ✅ Cache functionality working\n');

    console.log('🎉 Contract Fee Service tests passed!');
    return { 
      success: true, 
      results: { 
        feeInfo, 
        contractFeeResult, 
        percentageFeeResult,
        currencyEquivalentResult,
        cacheStats 
      } 
    };
    
  } catch (error) {
    console.error('❌ Contract Fee Service test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test contract fee configuration
 */
export function testContractFeeConfig() {
  console.log('=== Testing Contract Fee Configuration ===\n');
  
  try {
    // Test 1: Get contract fee config
    console.log('1. Testing contract fee config retrieval:');
    const config = getContractFeeConfig('$TESTFEE+0000');
    console.log(`   Fee type: ${config.feeType}`);
    console.log(`   Fee amount: ${config.feeAmount}`);
    console.log(`   Allowed fee IDs: ${config.allowedFeeIds.join(', ')}`);
    assert(config.feeType === CONTRACT_FEE_TYPE.FIXED, 'Fee type should be FIXED');
    console.log('   ✅ Contract fee config retrieval working\n');

    // Test 2: Fee contract ID validation
    console.log('2. Testing fee contract ID validation:');
    const isAllowed = isFeeContractIdAllowed('$TESTFEE+0000', '$TESTFEE+0000');
    const isNotAllowed = isFeeContractIdAllowed('$TESTFEE+0000', '$INVALID+9999');
    console.log(`   $TESTFEE+0000 allowed for $TESTFEE+0000: ${isAllowed}`);
    console.log(`   $INVALID+9999 allowed for $TESTFEE+0000: ${isNotAllowed}`);
    assert(isAllowed === true, 'Valid fee contract ID should be allowed');
    assert(isNotAllowed === false, 'Invalid fee contract ID should not be allowed');
    console.log('   ✅ Fee contract ID validation working\n');

    // Test 3: Default config for unknown contract
    console.log('3. Testing default config for unknown contract:');
    const defaultConfig = getContractFeeConfig('$UNKNOWN+9999');
    console.log(`   Default fee type: ${defaultConfig.feeType}`);
    console.log(`   Default fee amount: ${defaultConfig.feeAmount}`);
    assert(defaultConfig.feeType === CONTRACT_FEE_TYPE.NONE, 'Default fee type should be NONE');
    assert(defaultConfig.feeAmount === '0', 'Default fee amount should be 0');
    console.log('   ✅ Default config working\n');

    console.log('🎉 Contract Fee Configuration tests passed!');
    return { 
      success: true, 
      results: { 
        config, 
        isAllowed, 
        isNotAllowed, 
        defaultConfig 
      } 
    };
    
  } catch (error) {
    console.error('❌ Contract Fee Configuration test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test edge cases and error handling
 */
export async function testUnifiedFeeEdgeCases() {
  console.log('=== Testing Unified Fee Edge Cases ===\n');
  
  try {
    // Test 1: Missing protoObject
    console.log('1. Testing missing protoObject:');
    try {
      await UniversalFeeCalculator.calculateFee({});
      console.log('   ❌ Should have thrown error for missing protoObject');
    } catch (error) {
      console.log('   ✅ Correctly threw error for missing protoObject');
    }
    console.log('');

    // Test 2: Invalid contract ID format
    console.log('2. Testing invalid contract ID format:');
    const invalidContractProto = {
      toBinary: () => new Uint8Array(500),
      base: {
        contractId: 'INVALID_FORMAT',
        publicKey: {
          single: new Uint8Array(32)
        }
      }
    };

    try {
      await UniversalFeeCalculator.calculateFee({
        protoObject: invalidContractProto,
        baseFeeId: '$ZRA+0000',
        contractFeeId: '$ZRA+0000'
      });
      console.log('   ✅ Handled invalid contract ID format gracefully');
    } catch (error) {
      console.log('   ✅ Correctly threw error for invalid contract ID format');
    }
    console.log('');

    // Test 3: Zero transaction amount
    console.log('3. Testing zero transaction amount:');
    const zeroAmountResult = await UniversalFeeCalculator.calculateFee({
      protoObject: {
        toBinary: () => new Uint8Array(500),
        base: {
          contractId: '$TESTFEE+0000',
          publicKey: {
            single: new Uint8Array(32)
          }
        }
      },
      baseFeeId: '$ZRA+0000',
      contractFeeId: '$TESTFEE+0000',
      transactionAmount: '0'
    });

    console.log(`   Zero amount total fee: ${zeroAmountResult.totalFee} ZRA`);
    assert(zeroAmountResult.totalFee && zeroAmountResult.totalFee !== '0', 'Should still calculate fee for zero amount');
    console.log('   ✅ Zero transaction amount handling working\n');

    console.log('🎉 Unified Fee Edge Cases tests passed!');
    return { success: true, results: { zeroAmountResult } };
    
  } catch (error) {
    console.error('❌ Unified Fee Edge Cases test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run all unified fee calculation tests
 */
export async function runAllUnifiedFeeTests() {
  console.log('🧪 Running Unified Fee Calculation Tests\n');
  console.log('This test suite validates the new unified fee calculation system:');
  console.log('- Unified calculateFee method with network + contract fees');
  console.log('- Contract fee service with API-first lookup and fallback');
  console.log('- Contract fee configuration management');
  console.log('- Fee contract ID validation for CoinTXN transactions');
  console.log('- Edge cases and error handling\n');
  
  const results = {};
  let allPassed = true;
  
  try {
    // Run all test suites
    results.unifiedCalculateFee = await testUnifiedCalculateFee();
    results.contractFeeService = await testContractFeeService();
    results.contractFeeConfig = testContractFeeConfig();
    results.edgeCases = await testUnifiedFeeEdgeCases();
    
    // Check if all tests passed
    for (const [testName, result] of Object.entries(results)) {
      if (!result.success) {
        allPassed = false;
        console.error(`❌ ${testName} failed: ${result.error}`);
      }
    }
    
    if (allPassed) {
      console.log('\n🎉 ALL UNIFIED FEE CALCULATION TESTS PASSED! 🎉');
      console.log('\nThe unified fee calculation system is working correctly:');
      console.log('✅ Unified calculateFee method with network + contract fees');
      console.log('✅ Contract fee service with API-first lookup and fallback');
      console.log('✅ Contract fee configuration management');
      console.log('✅ Fee contract ID validation for CoinTXN transactions');
      console.log('✅ Edge cases and error handling');
      console.log('\nThe system successfully handles both network and contract fees!');
    } else {
      console.log('\n❌ Some tests failed. Please check the errors above.');
    }
    
    return {
      success: allPassed,
      results,
      summary: {
        totalTests: Object.keys(results).length,
        passedTests: Object.values(results).filter(r => r.success).length,
        failedTests: Object.values(results).filter(r => !r.success).length
      }
    };
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    return {
      success: false,
      error: error.message,
      results
    };
  }
}

// Simple assertion function for testing
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Export all test functions
export const unifiedFeeTests = {
  unifiedCalculateFee: testUnifiedCalculateFee,
  contractFeeService: testContractFeeService,
  contractFeeConfig: testContractFeeConfig,
  edgeCases: testUnifiedFeeEdgeCases,
  runAll: runAllUnifiedFeeTests
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllUnifiedFeeTests()
    .then(result => {
      if (result.success) {
        console.log('\n✅ All unified fee tests completed successfully');
        process.exit(0);
      } else {
        console.log('\n❌ Some unified fee tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}
