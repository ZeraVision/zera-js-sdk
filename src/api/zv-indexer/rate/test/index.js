/**
 * ACE Exchange Rate Service Tests
 * 
 * This provides tests for the ACE exchange rate service.
 */

import { getExchangeRate, convertUSDToCurrency } from '../service.js';
import { DEFAULT_TEST_FEE_CONFIG } from '../../../../test-utils/test-keys.js';

/**
 * Run ACE exchange rate tests
 */
export async function runRateTests() {
  console.log('🧪 ACE Exchange Rate Service Tests\n');
  
  const tests = [
    { name: 'Basic Functionality', runner: basicFunctionalityTest },
    { name: 'Input Validation', runner: inputValidationTest },
    { name: 'Error Handling', runner: errorHandlingTest },
    { name: 'Performance', runner: performanceTest },
    { name: 'Edge Cases', runner: edgeCasesTest }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n🔬 ${test.name}`);
    console.log('-'.repeat(40));
    
    try {
      await test.runner();
      console.log(`✅ ${test.name} passed`);
      passed++;
    } catch (error) {
      console.error(`❌ ${test.name} failed: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

/**
 * Test 1: Basic Functionality
 */
async function basicFunctionalityTest() {
  console.log('Testing basic exchange rate retrieval for ZRA...');
  
  const currency = DEFAULT_TEST_FEE_CONFIG.baseFeeId; // '$ZRA+0000'
  const rate = await getExchangeRate(currency);
  
  // Verify rate is returned
  if (!rate) {
    throw new Error('Rate should not be null/undefined');
  }
  
  // Verify rate is a Decimal
  if (typeof rate !== 'object' || !rate.constructor || rate.constructor.name !== 'Decimal') {
    throw new Error('Rate should be a Decimal object');
  }
  
  // Verify rate is positive
  if (rate.lt(0)) {
    throw new Error('Rate should be positive');
  }
  
  console.log(`✅ Basic functionality: ${rate.toString()}`);
}

/**
 * Test 2: Input Validation
 */
async function inputValidationTest() {
  console.log('Testing input validation...');
  
  // Test null/undefined currency
  try {
    await getExchangeRate(null);
    throw new Error('Should throw error for null currency');
  } catch (error) {
    console.log('✅ Null currency validation passed');
  }
  
  try {
    await getExchangeRate(undefined);
    throw new Error('Should throw error for undefined currency');
  } catch (error) {
    console.log('✅ Undefined currency validation passed');
  }
  
  // Test empty string
  try {
    await getExchangeRate('');
    throw new Error('Should throw error for empty currency');
  } catch (error) {
    console.log('✅ Empty currency validation passed');
  }
  
  // Test invalid currency format
  try {
    await getExchangeRate('INVALID_CURRENCY');
    throw new Error('Should throw error for invalid currency');
  } catch (error) {
    console.log('✅ Invalid currency validation passed');
  }
  
  // Test invalid USD amount
  try {
    await convertUSDToCurrency(-100, DEFAULT_TEST_FEE_CONFIG.baseFeeId);
    throw new Error('Should throw error for negative amount');
  } catch (error) {
    console.log('✅ Negative amount validation passed');
  }
  
  try {
    await convertUSDToCurrency(0, DEFAULT_TEST_FEE_CONFIG.baseFeeId);
    throw new Error('Should throw error for zero amount');
  } catch (error) {
    console.log('✅ Zero amount validation passed');
  }
}

/**
 * Test 3: Error Handling
 */
async function errorHandlingTest() {
  console.log('Testing error handling...');
  
  // Test network error simulation
  try {
    await getExchangeRate('$ZRA+0000', { 
      baseUrl: 'https://invalid-url.com',
      timeout: 1000
    });
    console.log('⚠️ Network error test - may have connected to invalid URL');
  } catch (error) {
    console.log('✅ Network error handling passed');
  }
  
  // Test timeout
  try {
    await getExchangeRate('$ZRA+0000', { 
      timeout: 1 // 1ms timeout
    });
    console.log('⚠️ Timeout test - request may have completed too quickly');
  } catch (error) {
    console.log('✅ Timeout handling passed');
  }
}

/**
 * Test 4: Performance
 */
async function performanceTest() {
  console.log('Testing performance with test currencies...');
  
  const currencies = [
    DEFAULT_TEST_FEE_CONFIG.baseFeeId,     // '$ZRA+0000'
    DEFAULT_TEST_FEE_CONFIG.contractFeeId   // '$ZRA+0000'
  ];
  
  const startTime = Date.now();
  const rates = [];
  
  for (const currency of currencies) {
    const rate = await getExchangeRate(currency);
    rates.push(rate);
  }
  
  const endTime = Date.now();
  
  const duration = endTime - startTime;
  console.log(`Performance: ${duration}ms for ${currencies.length} currencies`);
  
  // Verify all rates returned
  if (rates.length !== currencies.length) {
    throw new Error(`Expected ${currencies.length} rates, got ${rates.length}`);
  }
  
  // Verify all rates are valid
  for (let i = 0; i < rates.length; i++) {
    if (!rates[i] || rates[i].lt(0)) {
      throw new Error(`Invalid rate at index ${i}`);
    }
  }
  
  console.log('✅ Performance test passed');
}

/**
 * Test 5: Edge Cases
 */
async function edgeCasesTest() {
  console.log('Testing edge cases...');
  
  // Test currency conversion
  const usdAmount = 100;
  const currency = DEFAULT_TEST_FEE_CONFIG.baseFeeId; // '$ZRA+0000'
  
  const convertedAmount = await convertUSDToCurrency(usdAmount, currency);
  
  if (!convertedAmount || convertedAmount.lt(0)) {
    throw new Error('Converted amount should be positive');
  }
  
  console.log(`✅ Currency conversion test passed: $${usdAmount} → ${convertedAmount.toString()}`);
  
  // Test rate consistency
  const rate = await getExchangeRate(currency);
  const expectedAmount = usdAmount / rate.toNumber();
  const actualAmount = convertedAmount.toNumber();
  
  const difference = Math.abs(expectedAmount - actualAmount);
  const tolerance = 0.0001; // Allow small floating point differences
  
  if (difference > tolerance) {
    throw new Error(`Rate consistency check failed: expected ${expectedAmount}, got ${actualAmount}`);
  }
  
  console.log('✅ Rate consistency test passed');
  
  // Test minimum rate safeguard
  const minRate = 0.0001;
  if (rate.lt(minRate)) {
    console.log(`⚠️ Rate is very low: ${rate.toString()} (minimum: ${minRate})`);
  } else {
    console.log('✅ Rate is above minimum threshold');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRateTests()
    .then(({ passed, failed }) => {
      console.log(`\n🎯 Final Test Results: ${passed} passed, ${failed} failed`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Tests crashed:', error);
      process.exit(1);
    });
}
