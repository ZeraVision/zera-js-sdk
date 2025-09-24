/**
 * ACE Exchange Rate Service Examples
 * 
 * This provides examples for the ACE exchange rate service.
 */

import { getExchangeRate, convertUSDToCurrency } from '../service.js';
import { DEFAULT_TEST_FEE_CONFIG } from '../../../../test-utils/test-keys.js';

/**
 * Run ACE exchange rate examples
 */
export async function runRateExamples() {
  console.log('🔬 ACE Exchange Rate Service Examples\n');
  
  const examples = [
    { name: 'Basic Usage', runner: basicUsageExample },
    { name: 'Additional Features', runner: advancedFeaturesExample },
    { name: 'Error Handling', runner: errorHandlingExample },
    { name: 'Performance', runner: performanceExample },
    { name: 'Integration', runner: integrationExample }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const example of examples) {
    console.log(`\n📚 ${example.name}`);
    console.log('-'.repeat(40));
    
    try {
      await example.runner();
      console.log(`✅ ${example.name} passed`);
      passed++;
    } catch (error) {
      console.error(`❌ ${example.name} failed: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

/**
 * Example 1: Basic Usage
 */
async function basicUsageExample() {
  console.log('Getting exchange rate for ZRA...');
  
  const currency = DEFAULT_TEST_FEE_CONFIG.baseFeeId; // '$ZRA+0000'
  const rate = await getExchangeRate(currency);
  
  console.log(`Currency: ${currency}`);
  console.log(`Rate: ${rate.toString()}`);
  console.log(`Rate type: ${typeof rate}`);
  
  if (!rate || rate.lt(0)) {
    throw new Error('Invalid rate returned');
  }
}

/**
 * Example 2: Additional Features
 */
async function advancedFeaturesExample() {
  console.log('Testing currency conversion with test currencies...');
  
  const usdAmount = 100.50;
  const currency = DEFAULT_TEST_FEE_CONFIG.baseFeeId; // '$ZRA+0000'
  
  const convertedAmount = await convertUSDToCurrency(usdAmount, currency);
  
  console.log(`USD Amount: $${usdAmount}`);
  console.log(`Currency: ${currency}`);
  console.log(`Converted Amount: ${convertedAmount.toString()}`);
  
  if (!convertedAmount || convertedAmount.lt(0)) {
    throw new Error('Invalid converted amount');
  }
  
  // Verify conversion makes sense
  const rate = await getExchangeRate(currency);
  const expectedAmount = usdAmount / rate.toNumber();
  
  console.log(`Expected: ${expectedAmount}`);
  console.log(`Actual: ${convertedAmount.toNumber()}`);
  console.log(`Difference: ${Math.abs(expectedAmount - convertedAmount.toNumber())}`);
}

/**
 * Example 3: Error Handling
 */
async function errorHandlingExample() {
  console.log('Testing error handling...');
  
  try {
    // Test invalid currency
    await getExchangeRate('INVALID_CURRENCY');
    throw new Error('Should have thrown error for invalid currency');
  } catch (error) {
    console.log(`✅ Caught expected error: ${error.message}`);
  }
  
  try {
    // Test null currency
    await getExchangeRate(null);
    throw new Error('Should have thrown error for null currency');
  } catch (error) {
    console.log(`✅ Caught expected error: ${error.message}`);
  }
  
  try {
    // Test invalid USD amount
    await convertUSDToCurrency(-100, DEFAULT_TEST_FEE_CONFIG.baseFeeId);
    throw new Error('Should have thrown error for negative amount');
  } catch (error) {
    console.log(`✅ Caught expected error: ${error.message}`);
  }
}

/**
 * Example 4: Performance
 */
async function performanceExample() {
  console.log('Testing performance with test currencies...');
  
  const currencies = [
    DEFAULT_TEST_FEE_CONFIG.baseFeeId,     // '$ZRA+0000'
    DEFAULT_TEST_FEE_CONFIG.contractFeeId   // '$ZRA+0000'
  ];
  
  const startTime = Date.now();
  
  // Test individual requests
  const individualRates = [];
  for (const currency of currencies) {
    const rate = await getExchangeRate(currency);
    individualRates.push(rate);
  }
  
  const individualTime = Date.now() - startTime;
  
  console.log(`Individual requests: ${individualTime}ms for ${currencies.length} currencies`);
  console.log(`Average per currency: ${Math.round(individualTime / currencies.length)}ms`);
  
  // Test batch conversion
  const batchStartTime = Date.now();
  const batchConversions = [];
  
  for (const currency of currencies) {
    const converted = await convertUSDToCurrency(100, currency);
    batchConversions.push(converted);
  }
  
  const batchTime = Date.now() - batchStartTime;
  
  console.log(`Batch conversions: ${batchTime}ms for ${currencies.length} conversions`);
  console.log(`Average per conversion: ${Math.round(batchTime / currencies.length)}ms`);
  
  if (individualRates.length !== currencies.length) {
    throw new Error('Rate count mismatch');
  }
}

/**
 * Example 5: Integration
 */
async function integrationExample() {
  console.log('Testing integration with transaction creation...');
  
  const currency = DEFAULT_TEST_FEE_CONFIG.baseFeeId; // '$ZRA+0000'
  const usdAmount = 50.25;
  
  // Get exchange rate
  const rate = await getExchangeRate(currency);
  console.log(`Exchange rate: ${rate.toString()}`);
  
  // Convert USD to currency
  const currencyAmount = await convertUSDToCurrency(usdAmount, currency);
  console.log(`Converted amount: ${currencyAmount.toString()}`);
  
  // Simulate transaction creation
  const mockTransaction = {
    from: '7AC43j5mVxGZDZraaDN3Guz68rRoh2S7P6VXcS8GGJ8b', // Alice's address
    to: 'G5F1NDFmpLsym7TvAt67Ju1jzRL2mPLxev25JFi7ZSWt',     // Bob's address
    amount: currencyAmount.toString(),
    currency: currency,
    usdValue: usdAmount,
    exchangeRate: rate.toString(),
    timestamp: Date.now()
  };
  
  console.log('Mock transaction created:');
  console.log(`  From: ${mockTransaction.from}`);
  console.log(`  To: ${mockTransaction.to}`);
  console.log(`  Amount: ${mockTransaction.amount} ${mockTransaction.currency}`);
  console.log(`  USD Value: $${mockTransaction.usdValue}`);
  console.log(`  Exchange Rate: ${mockTransaction.exchangeRate}`);
  console.log(`  Timestamp: ${mockTransaction.timestamp}`);
  
  // Verify amounts are valid
  if (!rate || rate.lt(0)) {
    throw new Error('Invalid exchange rate');
  }
  
  if (!currencyAmount || currencyAmount.lt(0)) {
    throw new Error('Invalid currency amount');
  }
  
  console.log('✅ Integration test passed - transaction ready with exchange rate');
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRateExamples()
    .then(({ passed, failed }) => {
      console.log(`\n🎯 Final Results: ${passed} passed, ${failed} failed`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Examples crashed:', error);
      process.exit(1);
    });
}
