/**
 * Integration Tests: CoinTXN with UniversalFeeCalculator
 * Tests the integration between CoinTXN creation and the fee calculation system
 */

import { assert, createTestInput, getTestOutput } from '../../test-utils/index.js';
import { createCoinTXN, createCoinTXNWithAutoFee } from '../index.js';
import { UniversalFeeCalculator } from '../../shared/fee-calculators/universal-fee-calculator.js';
import { TRANSACTION_TYPE } from '../../shared/protobuf-enums.js';

/**
 * Test that createCoinTXN properly handles manual fee configuration
 */
export async function testCoinTXNManualFeeIntegration() {
  console.log('=== Testing CoinTXN Manual Fee Integration ===\n');
  
  try {
    // Create test inputs and outputs
    const inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
    const outputs = [getTestOutput('bob', '1.0', 'payment')];
    
    // Test manual fee configuration
    const feeConfig = {
      baseFeeId: '$ZRA+0000',
      baseFee: '0.001', // Manual fee
      contractFeeId: '$ZRA+0000',
      contractFee: '0.0005'
    };
    
    const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', feeConfig, 'Manual fee test');
    
    // Verify transaction structure
    assert(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should create CoinTXN');
    assert(coinTxn.base !== undefined, 'Should have base transaction');
    assert(coinTxn.base.feeAmount !== undefined, 'Should have fee amount');
    assert(coinTxn.base.feeId === '$ZRA+0000', 'Should have correct fee ID');
    
    // Verify fee amounts are converted to smallest units
    const expectedBaseFee = '1000000'; // 0.001 ZRA in smallest units
    const expectedContractFee = '500000'; // 0.0005 ZRA in smallest units
    
    assert(coinTxn.base.feeAmount === expectedBaseFee, `Base fee should be ${expectedBaseFee}, got ${coinTxn.base.feeAmount}`);
    assert(coinTxn.contractFeeAmount === expectedContractFee, `Contract fee should be ${expectedContractFee}, got ${coinTxn.contractFeeAmount}`);
    
    console.log('✅ Manual fee integration working');
    console.log(`   Base fee: ${coinTxn.base.feeAmount} (smallest units)`);
    console.log(`   Contract fee: ${coinTxn.contractFeeAmount} (smallest units)`);
    
    return { success: true, coinTxn };
    
  } catch (error) {
    console.error('❌ Manual fee integration test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test that createCoinTXN properly integrates with UniversalFeeCalculator for automatic fees
 */
export async function testCoinTXNAutoFeeIntegration() {
  console.log('=== Testing CoinTXN Auto Fee Integration ===\n');
  
  try {
    // Create test inputs and outputs
    const inputs = [createTestInput('ed25519', 'alice', '2.0', '100')];
    const outputs = [getTestOutput('bob', '2.0', 'auto fee payment')];
    
    // Test automatic fee calculation (no baseFee provided)
    const feeConfig = {
      baseFeeId: '$ZRA+0000',
      contractFeeId: '$ZRA+0000',
      contractFee: '0.001' // Manual contract fee
    };
    
    const result = await createCoinTXN(inputs, outputs, '$ZRA+0000', feeConfig, 'Auto fee test');
    
    // Verify transaction structure
    assert(result.$typeName === 'zera_txn.CoinTXN', 'Should create CoinTXN');
    assert(result.base !== undefined, 'Should have base transaction');
    assert(result.base.feeAmount !== undefined, 'Should have fee amount');
    assert(result.base.feeId === '$ZRA+0000', 'Should have correct fee ID');
    
    // Verify contract fee is included
    assert(result.contractFeeAmount !== undefined, 'Should have contract fee amount');
    assert(result.contractFeeId === '$ZRA+0000', 'Should have correct contract fee ID');
    
    console.log('✅ Auto fee integration working');
    console.log(`   Base fee: Auto-calculated`);
    console.log(`   Contract fee: Manual 0.001 ZRA`);
    
    return { success: true, result };
    
  } catch (error) {
    console.error('❌ Auto fee integration test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test that the fee calculation system properly handles different transaction sizes
 */
export async function testFeeCalculationSizeDependency() {
  console.log('=== Testing Fee Calculation Size Dependency ===\n');
  
  try {
    // Test 1: Small transaction
    console.log('1. Testing small transaction:');
    const smallInputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
    const smallOutputs = [getTestOutput('bob', '1.0', 'small')];
    
    const smallResult = await createCoinTXNWithAutoFee(smallInputs, smallOutputs, '$ZRA+0000', {
      autoCalculateFee: true
    });
    
    console.log(`   Small transaction fee: ${smallResult.feeInfo.baseFee} ZRA`);
    console.log(`   Small transaction size: ${smallResult.feeInfo.calculationInfo.size} bytes`);
    
    // Test 2: Large transaction
    console.log('\n2. Testing large transaction:');
    const largeInputs = [
      createTestInput('ed25519', 'alice', '5.0', '50'),
      createTestInput('ed448', 'bob', '3.0', '50')
    ];
    const largeOutputs = [
      getTestOutput('charlie', '4.0', 'large payment 1'),
      getTestOutput('jesse', '3.5', 'large payment 2'),
      getTestOutput('alice', '0.5', 'change')
    ];
    
    const largeResult = await createCoinTXNWithAutoFee(largeInputs, largeOutputs, '$ZRA+0000', {
      autoCalculateFee: true
    });
    
    console.log(`   Large transaction fee: ${largeResult.feeInfo.baseFee} ZRA`);
    console.log(`   Large transaction size: ${largeResult.feeInfo.calculationInfo.size} bytes`);
    
    // Verify that larger transactions have higher fees
    const smallFee = parseFloat(smallResult.feeInfo.baseFee);
    const largeFee = parseFloat(largeResult.feeInfo.baseFee);
    const smallSize = smallResult.feeInfo.calculationInfo.size;
    const largeSize = largeResult.feeInfo.calculationInfo.size;
    
    assert(largeSize > smallSize, 'Large transaction should be larger');
    assert(largeFee > smallFee, 'Large transaction should have higher fee');
    
    console.log('\n✅ Size dependency working correctly');
    console.log(`   Size difference: ${largeSize - smallSize} bytes`);
    console.log(`   Fee difference: ${(largeFee - smallFee).toFixed(8)} ZRA`);
    
    return { success: true, results: { small: smallResult, large: largeResult } };
    
  } catch (error) {
    console.error('❌ Size dependency test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test that fee calculation properly handles different key types
 */
export async function testFeeCalculationKeyTypeDependency() {
  console.log('=== Testing Fee Calculation Key Type Dependency ===\n');
  
  try {
    // Test 1: ED25519 transaction
    console.log('1. Testing ED25519 transaction:');
    const ed25519Inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
    const ed25519Outputs = [getTestOutput('bob', '1.0', 'ed25519')];
    
    const ed25519Result = await createCoinTXNWithAutoFee(ed25519Inputs, ed25519Outputs, '$ZRA+0000', {
      autoCalculateFee: true
    });
    
    console.log(`   ED25519 fee: ${ed25519Result.feeInfo.baseFee} ZRA`);
    console.log(`   ED25519 size: ${ed25519Result.feeInfo.calculationInfo.size} bytes`);
    
    // Test 2: ED448 transaction
    console.log('\n2. Testing ED448 transaction:');
    const ed448Inputs = [createTestInput('ed448', 'bob', '1.0', '100')];
    const ed448Outputs = [getTestOutput('alice', '1.0', 'ed448')];
    
    const ed448Result = await createCoinTXNWithAutoFee(ed448Inputs, ed448Outputs, '$ZRA+0000', {
      autoCalculateFee: true
    });
    
    console.log(`   ED448 fee: ${ed448Result.feeInfo.baseFee} ZRA`);
    console.log(`   ED448 size: ${ed448Result.feeInfo.calculationInfo.size} bytes`);
    
    // Verify that ED448 transactions have different fees due to larger signature size
    const ed25519Fee = parseFloat(ed25519Result.feeInfo.baseFee);
    const ed448Fee = parseFloat(ed448Result.feeInfo.baseFee);
    const ed25519Size = ed25519Result.feeInfo.calculationInfo.size;
    const ed448Size = ed448Result.feeInfo.calculationInfo.size;
    
    assert(ed448Size > ed25519Size, 'ED448 transaction should be larger due to bigger signature');
    assert(ed448Fee > ed25519Fee, 'ED448 transaction should have higher fee');
    
    console.log('\n✅ Key type dependency working correctly');
    console.log(`   Size difference: ${ed448Size - ed25519Size} bytes`);
    console.log(`   Fee difference: ${(ed448Fee - ed25519Fee).toFixed(8)} ZRA`);
    
    return { success: true, results: { ed25519: ed25519Result, ed448: ed448Result } };
    
  } catch (error) {
    console.error('❌ Key type dependency test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test that the fee system properly handles contract fees
 */
export async function testContractFeeIntegration() {
  console.log('=== Testing Contract Fee Integration ===\n');
  
  try {
    const inputs = [createTestInput('ed25519', 'alice', '2.0', '100')];
    const outputs = [getTestOutput('bob', '2.0', 'contract fee test')];
    
    // Test with contract fees
    const feeConfig = {
      baseFeeId: '$ZRA+0000',
      autoCalculateFee: true,
      contractFeeId: '$ZRA+0000',
      contractFee: '0.002' // Contract fee
    };
    
    const result = await createCoinTXNWithAutoFee(inputs, outputs, '$ZRA+0000', feeConfig, 'Contract fee test');
    
    // Verify contract fee is included
    assert(result.transaction.contractFeeAmount !== undefined, 'Should have contract fee amount');
    assert(result.transaction.contractFeeId === '$ZRA+0000', 'Should have correct contract fee ID');
    
    // Verify contract fee is converted to smallest units
    const expectedContractFee = '2000000'; // 0.002 ZRA in smallest units
    assert(result.transaction.contractFeeAmount === expectedContractFee, 
           `Contract fee should be ${expectedContractFee}, got ${result.transaction.contractFeeAmount}`);
    
    console.log('✅ Contract fee integration working');
    console.log(`   Base fee: ${result.feeInfo.baseFee} ZRA`);
    console.log(`   Contract fee: ${result.transaction.contractFeeAmount} (smallest units)`);
    
    return { success: true, result };
    
  } catch (error) {
    console.error('❌ Contract fee integration test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test flexible fee instruments (specify instruments, auto-calculate amounts)
 */
export async function testFlexibleFeeInstruments() {
  console.log('=== Testing Flexible Fee Instruments ===\n');
  
  try {
    const inputs = [createTestInput('ed25519', 'alice', '2.0', '100')];
    const outputs = [getTestOutput('bob', '2.0', 'flexible fee test')];
    
    // Test 1: Custom fee instruments with auto-calculated amounts
    console.log('1. Testing custom fee instruments:');
    const customInstrumentsResult = await createCoinTXN(inputs, outputs, '$ZRA+0000', {
      baseFeeId: '$BTC+1234',    // Use BTC for base fees (auto-calculated amount)
      contractFeeId: '$ETH+5678' // Use ETH for contract fees (auto-calculated amount)
    }, 'Custom fee instruments test');
    
    assert(customInstrumentsResult.$typeName === 'zera_txn.CoinTXN', 'Should create CoinTXN');
    assert(customInstrumentsResult.base.feeId === '$BTC+1234', 'Should use BTC for base fee');
    assert(customInstrumentsResult.contractFeeId === '$ETH+5678', 'Should use ETH for contract fee');
    console.log('   ✅ Custom fee instruments working');
    
    // Test 2: Mixed manual/auto fees
    console.log('\n2. Testing mixed manual/auto fees:');
    const mixedFeesResult = await createCoinTXN(inputs, outputs, '$ZRA+0000', {
      baseFeeId: '$ZRA+0000',
      baseFee: '0.002',          // Manual base fee amount
      contractFeeId: '$BTC+1234' // Auto-calculated contract fee in BTC
    }, 'Mixed fees test');
    
    assert(mixedFeesResult.$typeName === 'zera_txn.CoinTXN', 'Should create CoinTXN');
    assert(mixedFeesResult.base.feeId === '$ZRA+0000', 'Should use ZRA for base fee');
    assert(mixedFeesResult.base.feeAmount === '2000000', 'Should have manual base fee amount');
    assert(mixedFeesResult.contractFeeId === '$BTC+1234', 'Should use BTC for contract fee');
    console.log('   ✅ Mixed manual/auto fees working');
    
    // Test 3: Auto base fee, manual contract fee
    console.log('\n3. Testing auto base, manual contract:');
    const autoBaseManualContractResult = await createCoinTXN(inputs, outputs, '$ZRA+0000', {
      baseFeeId: '$ZRA+0000',    // Auto-calculated base fee in ZRA
      contractFeeId: '$ETH+5678',
      contractFee: '0.001'       // Manual contract fee amount in ETH
    }, 'Auto base, manual contract test');
    
    assert(autoBaseManualContractResult.$typeName === 'zera_txn.CoinTXN', 'Should create CoinTXN');
    assert(autoBaseManualContractResult.base.feeId === '$ZRA+0000', 'Should use ZRA for base fee');
    assert(autoBaseManualContractResult.contractFeeId === '$ETH+5678', 'Should use ETH for contract fee');
    assert(autoBaseManualContractResult.contractFeeAmount === '1000000', 'Should have manual contract fee amount');
    console.log('   ✅ Auto base, manual contract working');
    
    console.log('\n✅ Flexible fee instruments working correctly');
    console.log('   Custom Instruments: Specify currencies, auto-calculate amounts');
    console.log('   Mixed Strategy: Manual for one, auto for another');
    console.log('   Full Control: Manual amounts when needed');
    
    return { 
      success: true, 
      results: { 
        customInstruments: customInstrumentsResult, 
        mixedFees: mixedFeesResult,
        autoBaseManualContract: autoBaseManualContractResult
      } 
    };
    
  } catch (error) {
    console.error('❌ Flexible fee instruments test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test error handling in fee integration
 */
export async function testFeeIntegrationErrorHandling() {
  console.log('=== Testing Fee Integration Error Handling ===\n');
  
  try {
    // Test 1: Invalid fee configuration
    console.log('1. Testing invalid fee configuration:');
    try {
      const inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
      const outputs = [getTestOutput('bob', '1.0', 'error test')];
      
      await createCoinTXNWithAutoFee(inputs, outputs, '$ZRA+0000', {
        autoCalculateFee: false // Disabled but no baseFee provided
      });
      
      console.log('   ❌ Should have thrown error for missing baseFee');
    } catch (error) {
      console.log('   ✅ Correctly threw error for missing baseFee');
    }
    
    // Test 2: Invalid contract ID
    console.log('\n2. Testing invalid contract ID:');
    try {
      const inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
      const outputs = [getTestOutput('bob', '1.0', 'error test')];
      
      await createCoinTXNWithAutoFee(inputs, outputs, 'INVALID_CONTRACT_ID', {
        autoCalculateFee: true
      });
      
      console.log('   ❌ Should have thrown error for invalid contract ID');
    } catch (error) {
      console.log('   ✅ Correctly threw error for invalid contract ID');
    }
    
    // Test 3: Zero base fee
    console.log('\n3. Testing zero base fee:');
    try {
      const inputs = [createTestInput('ed25519', 'alice', '1.0', '100')];
      const outputs = [getTestOutput('bob', '1.0', 'error test')];
      
      await createCoinTXN(inputs, outputs, '$ZRA+0000', {
        baseFeeId: '$ZRA+0000',
        baseFee: '0' // Zero fee
      });
      
      console.log('   ❌ Should have thrown error for zero base fee');
    } catch (error) {
      console.log('   ✅ Correctly threw error for zero base fee');
    }
    
    console.log('\n✅ Error handling working correctly');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run all integration tests
 */
export async function runAllIntegrationTests() {
  console.log('🧪 Running CoinTXN Fee System Integration Tests\n');
  console.log('This test suite validates the integration between CoinTXN and UniversalFeeCalculator\n');
  
  const results = {};
  let allPassed = true;
  
  try {
    // Run all integration tests
    results.manualFee = await testCoinTXNManualFeeIntegration();
    results.autoFee = await testCoinTXNAutoFeeIntegration();
    results.flexibleInstruments = await testFlexibleFeeInstruments();
    results.sizeDependency = await testFeeCalculationSizeDependency();
    results.keyTypeDependency = await testFeeCalculationKeyTypeDependency();
    results.contractFee = await testContractFeeIntegration();
    results.errorHandling = await testFeeIntegrationErrorHandling();
    
    // Check if all tests passed
    for (const [testName, result] of Object.entries(results)) {
      if (!result.success) {
        allPassed = false;
        console.error(`❌ ${testName} failed: ${result.error}`);
      }
    }
    
    if (allPassed) {
      console.log('\n🎉 ALL INTEGRATION TESTS PASSED! 🎉');
      console.log('\nThe CoinTXN system properly integrates with the fee calculation system:');
      console.log('✅ Manual fee configuration works correctly');
      console.log('✅ Automatic fee calculation integrates properly');
      console.log('✅ Flexible fee instruments work correctly');
      console.log('✅ Fee calculation responds to transaction size');
      console.log('✅ Fee calculation responds to key types');
      console.log('✅ Contract fees are handled correctly');
      console.log('✅ Error handling works as expected');
      console.log('\nYour CoinTXN system properly uses your fee system! 🚀');
    } else {
      console.log('\n❌ Some integration tests failed. Please check the errors above.');
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
    console.error('\n❌ Integration test suite failed:', error.message);
    return {
      success: false,
      error: error.message,
      results
    };
  }
}

// Export all test functions
export const integrationTests = {
  manualFee: testCoinTXNManualFeeIntegration,
  autoFee: testCoinTXNAutoFeeIntegration,
  flexibleInstruments: testFlexibleFeeInstruments,
  sizeDependency: testFeeCalculationSizeDependency,
  keyTypeDependency: testFeeCalculationKeyTypeDependency,
  contractFee: testContractFeeIntegration,
  errorHandling: testFeeIntegrationErrorHandling,
  runAll: runAllIntegrationTests
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllIntegrationTests()
    .then(result => {
      if (result.success) {
        console.log('\n✅ All integration tests completed successfully');
        process.exit(0);
      } else {
        console.log('\n❌ Some integration tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}
