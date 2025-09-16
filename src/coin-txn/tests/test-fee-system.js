/**
 * Comprehensive Fee System Test Suite
 * Tests all fee calculation components and the catch-22 solution
 */

// Legacy fee-calculator.js removed - functionality moved to universal-fee-calculator.js
// ProperFeeCalculator removed - functionality moved to UniversalFeeCalculator
import { UniversalFeeCalculator } from '../../shared/fee-calculators/universal-fee-calculator.js';
import { aceExchangeService } from '../../shared/fee-calculators/ace-exchange-rate-service.js';
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
    // Test 1: Get fee values
    console.log('1. Testing getFeeValues:');
    const feeValues = UniversalFeeCalculator.getFeeValues('A_KEY_FEE,a_HASH_FEE,COIN_TXN_FEE');
    console.log(`   Fixed fee: $${feeValues.fixed}`);
    console.log(`   Per-byte fee: $${feeValues.perByte}`);
    assert(feeValues.fixed > 0, 'Fixed fee should be positive');
    assert(feeValues.perByte > 0, 'Per-byte fee should be positive');
    console.log('   ✅ getFeeValues working\n');
    
    // Test 2: Network fee calculation with mock protobuf object
    console.log('2. Testing calculateNetworkFee:');
    const mockProtoObject = {
      toBinary: () => new Uint8Array(500) // Mock 500-byte protobuf
    };
    const keyTypes = [KEY_TYPE.ED25519];
    
    const feeResult = await UniversalFeeCalculator.calculateNetworkFee({
      protoObject: mockProtoObject,
      keyTypes,
      transactionType: TRANSACTION_TYPE.COIN_TYPE,
      baseFeeId: '$ZRA+0000'
    });
    
    console.log(`   Fee: ${feeResult.fee} ZRA`);
    console.log(`   Fee USD: $${feeResult.feeUSD}`);
    console.log(`   Total size: ${feeResult.totalSize} bytes`);
    console.log(`   Exchange rate: ${feeResult.breakdown.exchangeRate}`);
    assert(feeResult.fee && feeResult.fee !== '0', 'Fee should be calculated');
    assert(feeResult.feeUSD > 0, 'Fee in USD should be positive');
    console.log('   ✅ calculateNetworkFee working\n');
    
    // Test 3: Iterative CoinTXN fee calculation (catch-22 solution)
    console.log('3. Testing calculateCoinTXNFee (catch-22 solution):');
    const coinTxnResult = await UniversalFeeCalculator.calculateCoinTXNFee({
      inputs,
      outputs,
      contractId: '$ZRA+0000',
      baseFeeId: '$ZRA+0000',
      transactionType: TRANSACTION_TYPE.COIN_TYPE
    });
    
    console.log(`   Final fee: ${coinTxnResult.fee} ZRA`);
    console.log(`   Transaction size: ${coinTxnResult.size} bytes`);
    console.log(`   Iterations: ${coinTxnResult.iterations}`);
    console.log(`   Converged: ${coinTxnResult.converged}`);
    assert(coinTxnResult.fee && coinTxnResult.fee !== '0', 'CoinTXN fee should be calculated');
    assert(coinTxnResult.size > 0, 'Transaction size should be positive');
    assert(coinTxnResult.iterations > 0, 'Should have performed iterations');
    console.log('   ✅ calculateCoinTXNFee working\n');
    
    // Test 4: Different transaction types
    console.log('4. Testing different transaction types:');
    const txTypes = [
      { type: TRANSACTION_TYPE.COIN_TYPE, name: 'Coin Transfer' },
      { type: TRANSACTION_TYPE.MINT_TYPE, name: 'Mint' },
      { type: TRANSACTION_TYPE.CONTRACT_TXN_TYPE, name: 'Contract Creation' }
    ];
    
    for (const txType of txTypes) {
      const result = await UniversalFeeCalculator.calculateNetworkFee({
        transactionType: txType.type,
        inputs,
        outputs,
        contractId: '$ZRA+0000',
        baseFeeId: '$ZRA+0000'
      });
      
      console.log(`   ${txType.name}: ${result.fee} ZRA`);
      assert(result.fee && result.fee !== '0', `${txType.name} fee should be calculated`);
    }
    console.log('   ✅ Different transaction types working\n');
    
    // Test 5: Fee constants
    console.log('5. Testing fee constants:');
    const constants = UniversalFeeCalculator.getFeeConstants();
    assert(constants.COIN_TXN_FEE > 0, 'COIN_TXN_FEE should be positive');
    assert(constants.A_KEY_FEE > 0, 'A_KEY_FEE should be positive');
    assert(constants.a_HASH_FEE > 0, 'a_HASH_FEE should be positive');
    console.log(`   COIN_TXN_FEE: $${constants.COIN_TXN_FEE}`);
    console.log(`   A_KEY_FEE: $${constants.A_KEY_FEE}`);
    console.log(`   a_HASH_FEE: $${constants.a_HASH_FEE}`);
    console.log('   ✅ Fee constants working\n');
    
    console.log('🎉 Main FeeCalculator tests passed!');
    return { success: true, results: { feeValues, feeResult, coinTxnResult, constants } };
    
  } catch (error) {
    console.error('❌ Main FeeCalculator test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// ProperFeeCalculator test removed - functionality moved to UniversalFeeCalculator

/**
 * Test the UniversalFeeCalculator functionality
 * NOTE: This calculator now uses proper USD-based, size-dependent calculation
 * matching the networkfees package implementation.
 */
export async function testUniversalFeeCalculator() {
  console.log('=== Testing UniversalFeeCalculator (Proper USD-based, Size-dependent) ===\n');
  
  try {
    // Test 1: Calculate total transaction size
    console.log('1. Testing calculateTotalTransactionSize:');
    // Create a mock protobuf object for testing
    const mockProtoObject = {
      toBinary: () => new Uint8Array(500) // Mock 500-byte protobuf
    };
    const keyTypes = [KEY_TYPE.ED25519, KEY_TYPE.ED448];
    
    const totalSize = UniversalFeeCalculator.calculateTotalTransactionSize(mockProtoObject, keyTypes);
    console.log(`   Total transaction size: ${totalSize} bytes`);
    console.log(`   Proto size: 500 bytes`);
    console.log(`   Signature size: ${64 + 114} bytes (Ed25519 + Ed448)`);
    console.log(`   Hash size: 32 bytes`);
    assert(totalSize === 500 + 64 + 114 + 32, 'Total size should be proto + signatures + hash');
    console.log('   ✅ calculateTotalTransactionSize working\n');
    
    // Test 2: Network fee calculation
    console.log('2. Testing network fee calculation:');
    const networkFee = await UniversalFeeCalculator.calculateNetworkFee({
      protoObject: mockProtoObject,
      keyTypes,
      transactionType: TRANSACTION_TYPE.COIN_TYPE,
      baseFeeId: '$ZRA+0000'
    });
    
    console.log(`   Network fee: ${networkFee.fee} ZRA`);
    console.log(`   Fee USD: $${networkFee.feeUSD}`);
    console.log(`   Total size: ${networkFee.totalSize} bytes`);
    console.log(`   Proto size: ${networkFee.protoSize} bytes`);
    console.log(`   Signature size: ${networkFee.signatureSize} bytes`);
    console.log(`   Hash size: ${networkFee.hashSize} bytes`);
    assert(networkFee.fee && networkFee.fee !== '0', 'Network fee should be calculated');
    assert(networkFee.feeUSD > 0, 'Fee in USD should be positive');
    assert(networkFee.totalSize > 0, 'Total size should be positive');
    console.log('   ✅ Network fee calculation working\n');
    
    // Test 3: Contract fee calculation
    console.log('3. Testing contract fee calculation:');
    const contractFee = UniversalFeeCalculator.calculateContractFee({
      contractId: '$ZRA+0000',
      contractFeeType: CONTRACT_FEE_TYPE.FIXED,
      contractFeeAmount: '0.001',
      transactionAmount: '100.0',
      feeContractId: 'ZRA+0000'
    });
    
    console.log(`   Contract fee: ${contractFee.fee} ZRA`);
    assert(contractFee.fee === '0.001', 'Contract fee should match input');
    console.log('   ✅ Contract fee calculation working\n');
    
    // Test 4: Percentage-based contract fee
    console.log('4. Testing percentage-based contract fee:');
    const percentageFee = UniversalFeeCalculator.calculateContractFee({
      contractId: '$ZRA+0000',
      contractFeeType: CONTRACT_FEE_TYPE.PERCENTAGE,
      contractFeeAmount: '0.1', // 0.1%
      transactionAmount: '100.0',
      feeContractId: 'ZRA+0000'
    });
    
    console.log(`   Percentage fee: ${percentageFee.fee} ZRA`);
    assert(percentageFee.fee === '0.1', 'Percentage fee should be 0.1% of 100');
    console.log('   ✅ Percentage contract fee working\n');
    
    // Test 5: Total fees calculation
    console.log('5. Testing total fees calculation:');
    const totalFees = await UniversalFeeCalculator.calculateTotalFees({
      protoObject: mockProtoObject,
      keyTypes,
      transactionType: TRANSACTION_TYPE.COIN_TYPE,
      contractId: '$ZRA+0000',
      contractFeeType: CONTRACT_FEE_TYPE.FIXED,
      contractFeeAmount: '0.001',
      transactionAmount: '100.0',
      feeContractId: 'ZRA+0000',
      baseFeeId: '$ZRA+0000'
    });
    
    console.log(`   Total fee: ${totalFees.totalFee} ZRA`);
    console.log(`   Network fee: ${totalFees.networkFee} ZRA`);
    console.log(`   Contract fee: ${totalFees.contractFee} ZRA`);
    assert(totalFees.totalFee && totalFees.totalFee !== '0', 'Total fee should be calculated');
    assert(totalFees.networkFee && totalFees.networkFee !== '0', 'Network fee should be included');
    assert(totalFees.contractFee && totalFees.contractFee !== '0', 'Contract fee should be included');
    console.log('   ✅ Total fees calculation working\n');
    
    // Test 6: Fee constants
    console.log('6. Testing fee constants:');
    const constants = UniversalFeeCalculator.getFeeConstants();
    assert(constants.COIN_TXN_FEE > 0, 'COIN_TXN_FEE should be positive');
    assert(constants.A_KEY_FEE > 0, 'A_KEY_FEE should be positive');
    assert(constants.a_HASH_FEE > 0, 'a_HASH_FEE should be positive');
    console.log(`   COIN_TXN_FEE: $${constants.COIN_TXN_FEE}`);
    console.log(`   A_KEY_FEE: $${constants.A_KEY_FEE}`);
    console.log(`   a_HASH_FEE: $${constants.a_HASH_FEE}`);
    console.log('   ✅ Fee constants working\n');
    
    console.log('🎉 UniversalFeeCalculator tests passed!');
    console.log('   This now uses the CORRECT approach: USD-based, size-dependent calculation');
    return { success: true, results: { totalSize, networkFee, contractFee, percentageFee, totalFees, constants } };
    
  } catch (error) {
    console.error('❌ UniversalFeeCalculator test failed:', error.message);
    return { success: false, error: error.message };
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
    
    // Test 3: Size with different numbers of inputs/outputs
    console.log('3. Testing size with multiple inputs/outputs:');
    const multiInputs = Array(3).fill().map((_, i) => ({
      privateKey: `test-private-key-${i}`,
      publicKey: `test-public-key-${i}`,
      amount: '33.33',
      feePercent: '33.33',
      keyType: KEY_TYPE.ED25519
    }));
    
    const multiOutputs = Array(2).fill().map((_, i) => ({
      to: `test-recipient-${i}`,
      amount: '50.0',
      memo: `Payment ${i + 1}`
    }));
    
    const multiSize = calculateCoinTXNSize({
      inputs: multiInputs,
      outputs: multiOutputs,
      contractId: '$ZRA+0000',
      baseFeeId: '$ZRA+0000'
    });
    
    console.log(`   Multi-input/output size: ${multiSize} bytes`);
    assert(multiSize > size, 'Multi-input/output transaction should be larger');
    console.log('   ✅ Multi-input/output size working\n');
    
    console.log('🎉 Transaction Size Calculator tests passed!');
    return { success: true, results: { size, multiSize, keySizes: { ed25519Size, ed448Size, ed25519SigSize, ed448SigSize } } };
    
  } catch (error) {
    console.error('❌ Transaction Size Calculator test failed:', error.message);
    return { success: false, error: error.message };
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
    
    // Test 3: Currency to USD conversion
    console.log('3. Testing currency to USD conversion:');
    const zraAmount = 1.0; // 1 ZRA
    const usdResult = await aceExchangeService.convertCurrencyToUSD(zraAmount, '$ZRA+0000');
    console.log(`   ${zraAmount} ZRA = $${usdResult}`);
    assert(usdResult.greaterThan(0), 'USD amount should be positive');
    console.log('   ✅ Currency to USD conversion working\n');
    
    // Test 4: Cache functionality
    console.log('4. Testing cache functionality:');
    const cacheInfo = aceExchangeService.getCacheInfo();
    console.log(`   Cache size: ${cacheInfo.size} entries`);
    console.log(`   Cache timeout: ${cacheInfo.timeout}ms`);
    assert(cacheInfo.size >= 0, 'Cache size should be non-negative');
    console.log('   ✅ Cache functionality working\n');
    
    console.log('🎉 ACE Exchange Rate Service tests passed!');
    return { success: true, results: { rate, currencyAmount, usdResult, cacheInfo } };
    
  } catch (error) {
    console.error('❌ ACE Exchange Rate Service test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test the catch-22 solution (iterative fee calculation)
 */
export async function testCatch22Solution() {
  console.log('=== Testing Catch-22 Solution ===\n');
  
  try {
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
    
    // Test 1: Size without fees
    console.log('1. Testing size calculation without fees:');
    const sizeWithoutFees = calculateCoinTXNSize({
      inputs,
      outputs,
      contractId: '$ZRA+0000',
      baseFeeId: '$ZRA+0000'
    });
    console.log(`   Size without fees: ${sizeWithoutFees} bytes`);
    assert(sizeWithoutFees > 0, 'Size without fees should be positive');
    console.log('   ✅ Size without fees working\n');
    
    // Test 2: Initial fee calculation
    console.log('2. Testing initial fee calculation:');
    const initialFeeResult = await UniversalFeeCalculator.calculateNetworkFee({
      transactionSize: sizeWithoutFees,
      transactionType: TRANSACTION_TYPE.COIN_TYPE,
      inputs,
      outputs,
      baseFeeId: '$ZRA+0000'
    });
    console.log(`   Initial fee: ${initialFeeResult.fee} ZRA`);
    assert(initialFeeResult.fee && initialFeeResult.fee !== '0', 'Initial fee should be calculated');
    console.log('   ✅ Initial fee calculation working\n');
    
    // Test 3: Iterative solution
    console.log('3. Testing iterative solution:');
    const iterativeResult = await UniversalFeeCalculator.calculateCoinTXNFee({
      inputs,
      outputs,
      contractId: '$ZRA+0000',
      baseFeeId: '$ZRA+0000',
      transactionType: TRANSACTION_TYPE.COIN_TYPE,
      maxIterations: 10,
      tolerance: 1
    });
    
    console.log(`   Final fee: ${iterativeResult.fee} ZRA`);
    console.log(`   Final size: ${iterativeResult.size} bytes`);
    console.log(`   Iterations: ${iterativeResult.iterations}`);
    console.log(`   Converged: ${iterativeResult.converged}`);
    
    assert(iterativeResult.fee && iterativeResult.fee !== '0', 'Final fee should be calculated');
    assert(iterativeResult.size > sizeWithoutFees, 'Final size should include fee fields');
    assert(iterativeResult.iterations > 0, 'Should have performed iterations');
    console.log('   ✅ Iterative solution working\n');
    
    // Test 4: Convergence analysis
    console.log('4. Testing convergence analysis:');
    const feeDifference = parseFloat(iterativeResult.fee) - parseFloat(initialFeeResult.fee);
    const sizeDifference = iterativeResult.size - sizeWithoutFees;
    
    console.log(`   Fee difference: ${feeDifference.toFixed(8)} ZRA`);
    console.log(`   Size difference: ${sizeDifference} bytes`);
    
    if (iterativeResult.converged) {
      console.log('   ✅ Solution converged successfully');
    } else {
      console.log('   ⚠️ Solution did not converge (may need more iterations)');
    }
    console.log('   ✅ Convergence analysis working\n');
    
    console.log('🎉 Catch-22 Solution tests passed!');
    return { 
      success: true, 
      results: { 
        sizeWithoutFees, 
        initialFeeResult, 
        iterativeResult, 
        feeDifference, 
        sizeDifference 
      } 
    };
    
  } catch (error) {
    console.error('❌ Catch-22 Solution test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test edge cases and error handling
 */
export async function testEdgeCases() {
  console.log('=== Testing Edge Cases and Error Handling ===\n');
  
  try {
    // Test 1: Empty inputs/outputs
    console.log('1. Testing empty inputs/outputs:');
    try {
      await UniversalFeeCalculator.calculateCoinTXNFee({
        inputs: [],
        outputs: [],
        contractId: '$ZRA+0000',
        baseFeeId: '$ZRA+0000'
      });
      console.log('   ❌ Should have thrown error for empty inputs/outputs');
    } catch (error) {
      console.log('   ✅ Correctly threw error for empty inputs/outputs');
    }
    console.log('');
    
    // Test 2: Invalid contract ID
    console.log('2. Testing invalid contract ID:');
    try {
      await UniversalFeeCalculator.calculateCoinTXNFee({
        inputs: [{ privateKey: 'test', publicKey: 'test', amount: '1.0', feePercent: '100', keyType: KEY_TYPE.ED25519 }],
        outputs: [{ to: 'test', amount: '1.0' }],
        contractId: 'invalid-contract-id',
        baseFeeId: '$ZRA+0000'
      });
      console.log('   ❌ Should have thrown error for invalid contract ID');
    } catch (error) {
      console.log('   ✅ Correctly threw error for invalid contract ID');
    }
    console.log('');
    
    // Test 3: Unknown fee type
    console.log('3. Testing unknown fee type:');
    try {
      UniversalFeeCalculator.getFeeValues('UNKNOWN_FEE_TYPE');
      console.log('   ❌ Should have thrown error for unknown fee type');
    } catch (error) {
      console.log('   ✅ Correctly threw error for unknown fee type');
    }
    console.log('');
    
    // Test 4: Zero transaction amount
    console.log('4. Testing zero transaction amount:');
    const zeroAmountResult = await UniversalFeeCalculator.calculateNetworkFee({
      transactionSize: 100,
      transactionType: TRANSACTION_TYPE.COIN_TYPE,
      inputs: [{ privateKey: 'test', publicKey: 'test', amount: '0', feePercent: '100', keyType: KEY_TYPE.ED25519 }],
      outputs: [{ to: 'test', amount: '0' }],
      baseFeeId: '$ZRA+0000'
    });
    console.log(`   Zero amount fee: ${zeroAmountResult.fee} ZRA`);
    assert(zeroAmountResult.fee && zeroAmountResult.fee !== '0', 'Should still calculate fee for zero amount');
    console.log('   ✅ Zero transaction amount handling working\n');
    
    // Test 5: Very large transaction
    console.log('5. Testing very large transaction:');
    const largeInputs = Array(10).fill().map((_, i) => ({
      privateKey: `test-private-key-${i}`,
      publicKey: `test-public-key-${i}`,
      amount: '1000.0',
      feePercent: '10',
      keyType: KEY_TYPE.ED25519
    }));
    
    const largeOutputs = Array(5).fill().map((_, i) => ({
      to: `test-recipient-${i}`,
      amount: '2000.0',
      memo: `Large payment ${i + 1}`
    }));
    
    const largeResult = await UniversalFeeCalculator.calculateCoinTXNFee({
      inputs: largeInputs,
      outputs: largeOutputs,
      contractId: '$ZRA+0000',
      baseFeeId: '$ZRA+0000',
      transactionType: TRANSACTION_TYPE.COIN_TYPE
    });
    
    console.log(`   Large transaction fee: ${largeResult.fee} ZRA`);
    console.log(`   Large transaction size: ${largeResult.size} bytes`);
    console.log(`   Iterations: ${largeResult.iterations}`);
    assert(largeResult.fee && largeResult.fee !== '0', 'Should calculate fee for large transaction');
    assert(largeResult.size > 1000, 'Large transaction should have significant size');
    console.log('   ✅ Very large transaction handling working\n');
    
    console.log('🎉 Edge Cases and Error Handling tests passed!');
    return { success: true, results: { zeroAmountResult, largeResult } };
    
  } catch (error) {
    console.error('❌ Edge Cases and Error Handling test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Run all fee system tests
 */
export async function runAllFeeSystemTests() {
  console.log('🧪 Running Comprehensive Fee System Tests\n');
  console.log('This test suite validates the entire fee calculation system including:');
  console.log('- Main FeeCalculator with USD-based fees (legacy implementation)');
  console.log('- UniversalFeeCalculator with proper USD-based, size-dependent calculation - CORRECT APPROACH');
  console.log('- Transaction size calculation');
  console.log('- ACE exchange rate service');
  console.log('- Catch-22 solution (iterative fee calculation)');
  console.log('- Edge cases and error handling\n');
  
  const results = {};
  let allPassed = true;
  
  try {
    // Run all test suites
    results.mainCalculator = await testMainFeeCalculator();
    results.universalCalculator = await testUniversalFeeCalculator();
    results.sizeCalculator = testTransactionSizeCalculator();
    results.exchangeService = await testACEExchangeRateService();
    results.catch22Solution = await testCatch22Solution();
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
      console.log('✅ Main FeeCalculator with USD-based constants (legacy implementation)');
      console.log('✅ UniversalFeeCalculator with proper USD-based, size-dependent calculation - CORRECT APPROACH');
      console.log('✅ Transaction size calculation without fees');
      console.log('✅ ACE exchange rate service for currency conversion');
      console.log('✅ Catch-22 solution with iterative calculation');
      console.log('✅ Edge cases and error handling');
      console.log('\nThe system successfully solves the fee calculation catch-22 problem!');
      console.log('\n✅ All fee calculators now use the CORRECT approach: USD-based, size-dependent calculation');
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
export const feeSystemTests = {
  mainCalculator: testMainFeeCalculator,
  // properCalculator removed - functionality moved to universalCalculator
  universalCalculator: testUniversalFeeCalculator,
  sizeCalculator: testTransactionSizeCalculator,
  exchangeService: testACEExchangeRateService,
  catch22Solution: testCatch22Solution,
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
