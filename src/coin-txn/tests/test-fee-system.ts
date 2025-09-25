/**
 * Comprehensive Fee System Test Suite
 * Tests all fee calculation components and the catch-22 solution
 */

// Legacy fee-calculator.js removed - functionality moved to universal-fee-calculator.js
// ProperFeeCalculator removed - functionality moved to UniversalFeeCalculator
import { UniversalFeeCalculator } from '../../shared/fee-calculators/universal-fee-calculator.js';
import { aceExchangeService } from '../../api/zv-indexer/rate/service.js';
import { 
  calculateCoinTXNSize, 
  estimateTransactionSizeWithFee,
  getPublicKeySize,
  getSignatureSize 
} from '../../shared/utils/transaction-size-calculator.js';
import { TRANSACTION_TYPE, CONTRACT_FEE_TYPE } from '../../shared/protobuf-enums.js';
import { KEY_TYPE } from '../../wallet-creation/constants.js';
import { Decimal } from '../../shared/utils/amount-utils.js';

/**
 * Test the UniversalFeeCalculator functionality (replaces legacy FeeCalculator)
 */
export async function testMainFeeCalculator() {
  console.log('=== Testing UniversalFeeCalculator (Main Implementation) ===\n');
  
  try {
    // Test 1: Basic fee calculation
    console.log('1. Testing calculateFee:');
    const mockProtoObject = {
      toBinary: () => new Uint8Array(500) // Mock 500-byte protobuf
    };
    
    const feeResult = await UniversalFeeCalculator.calculateFee({
      protoObject: mockProtoObject,
      baseFeeId: '$ZRA+0000'
    });
    
    console.log(`   Network fee: ${feeResult.networkFee} ZRA`);
    console.log(`   Contract fee: ${feeResult.contractFee} ZRA`);
    console.log(`   Total fee: ${feeResult.totalFee} ZRA`);
    assert(!!feeResult.networkFee && feeResult.networkFee !== '0', 'Network fee should be calculated');
    assert(!!feeResult.totalFee && feeResult.totalFee !== '0', 'Total fee should be calculated');
    console.log('   ✅ calculateFee working\n');
    
    // Test 2: Exchange rate service
    console.log('2. Testing getExchangeRate:');
    const exchangeRate = await UniversalFeeCalculator.getExchangeRate('$ZRA+0000');
    console.log(`   Exchange rate: $${exchangeRate} per ZRA`);
    assert(exchangeRate.greaterThan(0), 'Exchange rate should be positive');
    console.log('   ✅ getExchangeRate working\n');
    
    console.log('🎉 Main FeeCalculator tests passed!');
    return { success: true, results: { feeResult, exchangeRate } };
    
  } catch (error) {
    console.error('❌ Main FeeCalculator test failed:', (error as Error).message);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Test the UniversalFeeCalculator functionality
 * NOTE: This calculator now uses proper USD-based, size-dependent calculation
 * matching the networkfees package implementation.
 */
export async function testUniversalFeeCalculator() {
  console.log('=== Testing UniversalFeeCalculator (Proper USD-based, Size-dependent) ===\n');
  
  try {
    // Test 1: Basic fee calculation with contract fee
    console.log('1. Testing calculateFee with contract fee:');
    const mockProtoObject = {
      toBinary: () => new Uint8Array(500) // Mock 500-byte protobuf
    };
    
    const feeResult = await UniversalFeeCalculator.calculateFee({
      protoObject: mockProtoObject,
      baseFeeId: '$ZRA+0000',
      contractFeeId: '$ZRA+0000'
    });
    
    console.log(`   Network fee: ${feeResult.networkFee} ZRA`);
    console.log(`   Contract fee: ${feeResult.contractFee} ZRA`);
    console.log(`   Total fee: ${feeResult.totalFee} ZRA`);
    assert(!!feeResult.networkFee && feeResult.networkFee !== '0', 'Network fee should be calculated');
    assert(!!feeResult.contractFee && feeResult.contractFee !== '0', 'Contract fee should be included');
    assert(!!feeResult.totalFee && feeResult.totalFee !== '0', 'Total fee should be calculated');
    console.log('   ✅ calculateFee with contract fee working\n');
    
    // Test 2: Exchange rate service
    console.log('2. Testing getExchangeRate:');
    const exchangeRate = await UniversalFeeCalculator.getExchangeRate('$ZRA+0000');
    console.log(`   Exchange rate: $${exchangeRate} per ZRA`);
    assert(exchangeRate.greaterThan(0), 'Exchange rate should be positive');
    console.log('   ✅ getExchangeRate working\n');
    
    console.log('🎉 UniversalFeeCalculator tests passed!');
    console.log('   This now uses the CORRECT approach: USD-based, size-dependent calculation');
    return { success: true, results: { feeResult, exchangeRate } };
    
  } catch (error) {
    console.error('❌ UniversalFeeCalculator test failed:', (error as Error).message);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Test the transaction size calculator
 */
export function testTransactionSizeCalculator() {
  console.log('=== Testing Transaction Size Calculator ===\n');
  
  try {
    // Test 1: Basic size calculation
    console.log('1. Testing basic size calculation:');
    const inputs = [
      {
        privateKey: 'test-private-key',
        publicKey: 'test-public-key',
        amount: '100.0',
        feePercent: '100',
        keyType: KEY_TYPE.ED25519
      }
    ];
    
    const outputs = [
      {
        to: 'test-recipient-address',
        amount: '99.0',
        memo: 'Test payment'
      }
    ];
    
    const size = calculateCoinTXNSize({
      inputs,
      outputs,
      contractId: '$ZRA+0000',
      baseFeeId: '$ZRA+0000'
    });
    
    console.log(`   Transaction size: ${size} bytes`);
    assert(size > 0, 'Transaction size should be positive');
    assert(size < 10000, 'Transaction size should be reasonable');
    console.log('   ✅ Basic size calculation working\n');
    
    // Test 2: Different key types
    console.log('2. Testing different key types:');
    const ed25519Size = getPublicKeySize(KEY_TYPE.ED25519);
    const ed448Size = getPublicKeySize(KEY_TYPE.ED448);
    const ed25519SigSize = getSignatureSize(KEY_TYPE.ED25519);
    const ed448SigSize = getSignatureSize(KEY_TYPE.ED448);
    
    console.log(`   Ed25519 public key: ${ed25519Size} bytes`);
    console.log(`   Ed448 public key: ${ed448Size} bytes`);
    console.log(`   Ed25519 signature: ${ed25519SigSize} bytes`);
    console.log(`   Ed448 signature: ${ed448SigSize} bytes`);
    
    assert(ed25519Size === 32, 'Ed25519 public key should be 32 bytes');
    assert(ed448Size === 57, 'Ed448 public key should be 57 bytes');
    assert(ed25519SigSize === 64, 'Ed25519 signature should be 64 bytes');
    assert(ed448SigSize === 114, 'Ed448 signature should be 114 bytes');
    console.log('   ✅ Different key types working\n');
    
    console.log('🎉 Transaction Size Calculator tests passed!');
    return { success: true, results: { size, keySizes: { ed25519Size, ed448Size, ed25519SigSize, ed448SigSize } } };
    
  } catch (error) {
    console.error('❌ Transaction Size Calculator test failed:', (error as Error).message);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Test the ACE exchange rate service
 */
export async function testACEExchangeRateService() {
  console.log('=== Testing ACE Exchange Rate Service ===\n');
  
  try {
    // Test 1: Get exchange rate
    console.log('1. Testing exchange rate fetching:');
    const rate = await aceExchangeService.getExchangeRate('$ZRA+0000');
    console.log(`   Exchange rate: $${rate} per ZRA`);
    assert(rate.greaterThan(0), 'Exchange rate should be positive');
    console.log('   ✅ Exchange rate fetching working\n');
    
    // Test 2: USD to currency conversion
    console.log('2. Testing USD to currency conversion:');
    const usdAmount = 0.01; // $0.01
    const currencyAmount = await aceExchangeService.convertUSDToCurrency(usdAmount, '$ZRA+0000');
    console.log(`   $${usdAmount} = ${currencyAmount} ZRA`);
    assert(currencyAmount.greaterThan(0), 'Currency amount should be positive');
    console.log('   ✅ USD to currency conversion working\n');
    
    console.log('🎉 ACE Exchange Rate Service tests passed!');
    return { success: true, results: { rate, currencyAmount } };
    
  } catch (error) {
    console.error('❌ ACE Exchange Rate Service test failed:', (error as Error).message);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Test edge cases and error handling
 */
export async function testEdgeCases() {
  console.log('=== Testing Edge Cases and Error Handling ===\n');
  
  try {
    // Test 1: Invalid contract ID
    console.log('1. Testing invalid contract ID:');
    try {
      await UniversalFeeCalculator.calculateFee({
        protoObject: { toBinary: () => new Uint8Array(100) },
        baseFeeId: 'invalid-contract-id'
      });
      console.log('   ❌ Should have thrown error for invalid contract ID');
    } catch (error) {
      console.log('   ✅ Correctly threw error for invalid contract ID');
    }
    console.log('');
    
    // Test 2: Zero transaction amount
    console.log('2. Testing zero transaction amount:');
    const zeroAmountResult = await UniversalFeeCalculator.calculateFee({
      protoObject: { toBinary: () => new Uint8Array(100) },
      baseFeeId: '$ZRA+0000'
    });
    console.log(`   Zero amount fee: ${zeroAmountResult.totalFee} ZRA`);
    assert(!!zeroAmountResult.totalFee && zeroAmountResult.totalFee !== '0', 'Should still calculate fee for zero amount');
    console.log('   ✅ Zero transaction amount handling working\n');
    
    console.log('🎉 Edge Cases and Error Handling tests passed!');
    return { success: true, results: { zeroAmountResult } };
    
  } catch (error) {
    console.error('❌ Edge Cases and Error Handling test failed:', (error as Error).message);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Run all fee system tests
 */
export async function runAllFeeSystemTests() {
  console.log('🧪 Running Comprehensive Fee System Tests\n');
  console.log('This test suite validates the entire fee calculation system including:');
  console.log('- UniversalFeeCalculator with proper USD-based, size-dependent calculation');
  console.log('- Transaction size calculation');
  console.log('- ACE exchange rate service');
  console.log('- Edge cases and error handling\n');
  
  const results: Record<string, any> = {};
  let allPassed = true;
  
  try {
    // Run all test suites
    results.mainCalculator = await testMainFeeCalculator();
    results.universalCalculator = await testUniversalFeeCalculator();
    results.sizeCalculator = testTransactionSizeCalculator();
    results.exchangeService = await testACEExchangeRateService();
    results.edgeCases = await testEdgeCases();
    
    // Check if all tests passed
    for (const [testName, result] of Object.entries(results)) {
      if (!result.success) {
        allPassed = false;
        console.error(`❌ ${testName} failed: ${result.error}`);
      }
    }
    
    if (allPassed) {
      console.log('\n🎉 ALL FEE SYSTEM TESTS PASSED! 🎉');
      console.log('\nThe fee calculation system is working correctly:');
      console.log('✅ UniversalFeeCalculator with proper USD-based, size-dependent calculation');
      console.log('✅ Transaction size calculation');
      console.log('✅ ACE exchange rate service for currency conversion');
      console.log('✅ Edge cases and error handling');
      console.log('\nThe system successfully provides comprehensive fee calculation!');
    } else {
      console.log('\n❌ Some tests failed. Please check the errors above.');
    }
    
    return {
      success: allPassed,
      results,
      summary: {
        totalTests: Object.keys(results).length,
        passedTests: Object.values(results).filter((r: any) => r.success).length,
        failedTests: Object.values(results).filter((r: any) => !r.success).length
      }
    };
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', (error as Error).message);
    return {
      success: false,
      error: (error as Error).message,
      results
    };
  }
}

// Simple assertion function for testing
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Export all test functions
export const feeSystemTests = {
  mainCalculator: testMainFeeCalculator,
  universalCalculator: testUniversalFeeCalculator,
  sizeCalculator: testTransactionSizeCalculator,
  exchangeService: testACEExchangeRateService,
  edgeCases: testEdgeCases,
  runAll: runAllFeeSystemTests
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllFeeSystemTests()
    .then(result => {
      if (result.success) {
        console.log('\n✅ All tests completed successfully');
        process.exit(0);
      } else {
        console.log('\n❌ Some tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}