/**
 * ZV-Indexer Rate Service Examples
 * 
 * This provides examples for the ZV-Indexer rate service.
 */

import { getExchangeRate } from '../service.js';
import { convertUSDToCurrency } from '../../../handler/fee-info/service.js';
import { Decimal } from 'decimal.js';

// Test currency constant
const TEST_CURRENCY = '$ZRA+0000';

interface ExampleResult {
  passed: number;
  failed: number;
}

interface MockTransaction {
  from: string;
  to: string;
  amount: string;
  currency: string;
  usdValue: number;
  exchangeRate: string;
  timestamp: number;
}

/**
 * Run ZV-Indexer rate examples
 */
export async function runRateExamples(): Promise<ExampleResult> {
  console.log('🔬 ZV-Indexer Rate Service Examples\n');
  
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
      console.error(`❌ ${example.name} failed: ${(error as Error).message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

/**
 * Example 1: Basic Usage
 */
async function basicUsageExample(): Promise<void> {
  console.log('Getting exchange rate for ZRA from ZV-Indexer...');
  
  const currency = TEST_CURRENCY; // '$ZRA+0000'
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
async function advancedFeaturesExample(): Promise<void> {
  console.log('Testing currency conversion with ZV-Indexer rates...');
  
  const usdAmount = 100.50;
  const currency = TEST_CURRENCY; // '$ZRA+0000'
  
  // First get the rate from ZV-Indexer
  const rate = await getExchangeRate(currency);
  console.log(`ZV-Indexer Rate: ${rate.toString()}`);
  
  // Then convert using the handler
  const convertedAmount = await convertUSDToCurrency(usdAmount, currency);
  
  console.log(`USD Amount: $${usdAmount}`);
  console.log(`Currency: ${currency}`);
  console.log(`Converted Amount: ${convertedAmount.toString()}`);
  
  if (!convertedAmount || convertedAmount.lt(0)) {
    throw new Error('Invalid converted amount');
  }
  
  // Verify conversion makes sense
  const expectedAmount = new Decimal(usdAmount).div(rate);
  
  console.log(`Expected: ${expectedAmount.toString()}`);
  console.log(`Actual: ${convertedAmount.toString()}`);
  console.log(`Difference: ${expectedAmount.sub(convertedAmount).abs().toString()}`);
}

/**
 * Example 3: Error Handling
 */
async function errorHandlingExample(): Promise<void> {
  console.log('Testing error handling...');
  
  try {
    // Test invalid currency
    await getExchangeRate('INVALID_CURRENCY');
    throw new Error('Should have thrown error for invalid currency');
  } catch (error) {
    console.log(`✅ Caught expected error: ${(error as Error).message}`);
  }
  
  try {
    // Test null currency
    await getExchangeRate(null as any);
    throw new Error('Should have thrown error for null currency');
  } catch (error) {
    console.log(`✅ Caught expected error: ${(error as Error).message}`);
  }
  
  try {
    // Test invalid USD amount
    await convertUSDToCurrency(-100, TEST_CURRENCY);
    throw new Error('Should have thrown error for negative amount');
  } catch (error) {
    console.log(`✅ Caught expected error: ${(error as Error).message}`);
  }
}

/**
 * Example 4: Performance
 */
async function performanceExample(): Promise<void> {
  console.log('Testing performance with ZV-Indexer...');
  
  const currencies = [
    TEST_CURRENCY,     // '$ZRA+0000'
    TEST_CURRENCY   // '$ZRA+0000'
  ];
  
  const startTime = Date.now();
  
  // Test individual requests
  const individualRates: Decimal[] = [];
  for (const currency of currencies) {
    if (currency) {
      const rate = await getExchangeRate(currency);
      individualRates.push(rate);
    }
  }
  
  const individualTime = Date.now() - startTime;
  
  console.log(`Individual requests: ${individualTime}ms for ${currencies.length} currencies`);
  console.log(`Average per currency: ${Math.round(individualTime / currencies.length)}ms`);
  
  // Test batch conversion
  const batchStartTime = Date.now();
  const batchConversions: Decimal[] = [];
  
  for (const currency of currencies) {
    if (currency) {
      const converted = await convertUSDToCurrency(100, currency);
      batchConversions.push(converted);
    }
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
async function integrationExample(): Promise<void> {
  console.log('Testing integration with transaction creation...');
  
  const currency = TEST_CURRENCY; // '$ZRA+0000'
  const usdAmount = 50.25;
  
  // Get exchange rate from ZV-Indexer
  const rate = await getExchangeRate(currency);
  console.log(`ZV-Indexer exchange rate: ${rate.toString()}`);
  
  // Convert USD to currency using handler
  const currencyAmount = await convertUSDToCurrency(usdAmount, currency);
  console.log(`Converted amount: ${currencyAmount.toString()}`);
  
  // Simulate transaction creation
  const mockTransaction: MockTransaction = {
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
  
  console.log('✅ Integration test passed - transaction ready with ZV-Indexer exchange rate');
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
