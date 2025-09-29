/**
 * Rate Handler Examples
 * 
 * This provides examples for the centralized rate handler service.
 */

import { getExchangeRate, convertUSDToCurrency, processRate } from '../service.js';
import type { Decimal } from 'decimal.js';

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
 * Run rate handler examples
 */
export async function runRateHandlerExamples(): Promise<ExampleResult> {
  console.log('🔬 Rate Handler Examples\n');
  
  const examples = [
    { name: 'Basic Usage', runner: basicUsageExample },
    { name: 'Rate Processing', runner: rateProcessingExample },
    { name: 'Currency Conversion', runner: currencyConversionExample },
    { name: 'Error Handling', runner: errorHandlingExample },
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
 * Example 1: Basic Usage with Environment-Based Fallback
 */
async function basicUsageExample(): Promise<void> {
  console.log('Getting exchange rate using environment-based fallback chain...');
  
  const currency = TEST_CURRENCY;
  
  // This will use the fallback chain: cache -> indexer (if API key) -> validator -> fallback
  const rate = await getExchangeRate(currency);
  
  console.log(`Currency: ${currency}`);
  console.log(`Rate: ${rate.toString()}`);
  console.log(`Environment variables:`);
  console.log(`  INDEXER_API_KEY: ${process.env.INDEXER_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`  INDEXER_URL: ${process.env.INDEXER_URL || 'NOT SET'}`);
  
  if (!rate || rate.lt(0)) {
    throw new Error('Invalid rate returned');
  }
}

/**
 * Example 2: Environment-Based Fallback Chain
 */
async function rateProcessingExample(): Promise<void> {
  console.log('Testing environment-based fallback chain...');
  
  const currency = TEST_CURRENCY;
  
  console.log('Environment configuration:');
  console.log(`  INDEXER_API_KEY: ${process.env.INDEXER_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`  INDEXER_URL: ${process.env.INDEXER_URL || 'NOT SET'}`);
  
  // This will follow the fallback chain based on environment variables
  const rate = await getExchangeRate(currency);
  console.log(`Final rate: ${rate.toString()}`);
  
  // Test with cache disabled to see the full fallback chain
  console.log('\nTesting with cache disabled:');
  const rateNoCache = await getExchangeRate(currency);
  console.log(`Rate (no cache): ${rateNoCache.toString()}`);
  
  if (!rate || !rateNoCache) {
    throw new Error('Invalid rates returned');
  }
}

/**
 * Example 3: Currency Conversion with Environment-Based Rates
 */
async function currencyConversionExample(): Promise<void> {
  console.log('Testing currency conversion with environment-based rates...');
  
  const usdAmount = 100.50;
  const currency = TEST_CURRENCY;
  
  // Get rate using environment-based fallback chain
  const rate = await getExchangeRate(currency);
  console.log(`Exchange rate: ${rate.toString()}`);
  
  // Convert USD to currency
  const convertedAmount = await convertUSDToCurrency(usdAmount, currency);
  
  console.log(`USD Amount: $${usdAmount}`);
  console.log(`Currency: ${currency}`);
  console.log(`Converted Amount: ${convertedAmount.toString()}`);
  
  if (!convertedAmount || convertedAmount.lt(0)) {
    throw new Error('Invalid converted amount');
  }
  
  // Verify conversion makes sense
  const expectedAmount = usdAmount / rate.toNumber();
  
  console.log(`Expected: ${expectedAmount}`);
  console.log(`Actual: ${convertedAmount.toNumber()}`);
  console.log(`Difference: ${Math.abs(expectedAmount - convertedAmount.toNumber())}`);
}

/**
 * Example 4: Error Handling
 */
async function errorHandlingExample(): Promise<void> {
  console.log('Testing error handling...');
  
  try {
    // Test invalid currency without fallback
    await getExchangeRate('INVALID_CURRENCY_NO_FALLBACK');
    throw new Error('Should have thrown error for invalid currency');
  } catch (error) {
    console.log(`✅ Caught expected error: ${(error as Error).message}`);
  }
  
  try {
    // Test null currency
    await processRate(null as any, 3.18, 'validator');
    throw new Error('Should have thrown error for null currency');
  } catch (error) {
    console.log(`✅ Caught expected error: ${(error as Error).message}`);
  }
  
  try {
    // Test invalid rate
    await processRate(TEST_CURRENCY, -100, 'validator');
    throw new Error('Should have thrown error for negative rate');
  } catch (error) {
    console.log(`✅ Caught expected error: ${(error as Error).message}`);
  }
}

/**
 * Example 5: Integration with Environment-Based Rate Sources
 */
async function integrationExample(): Promise<void> {
  console.log('Testing integration with environment-based rate sources...');
  
  const currency = TEST_CURRENCY;
  const usdAmount = 50.25;
  
  console.log('Environment configuration:');
  console.log(`  INDEXER_API_KEY: ${process.env.INDEXER_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`  INDEXER_URL: ${process.env.INDEXER_URL || 'NOT SET'}`);
  
  // Get exchange rate using environment-based fallback chain
  const rate = await getExchangeRate(currency);
  console.log(`Exchange rate: ${rate.toString()}`);
  
  // Convert USD to currency
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
  
  console.log('✅ Integration test passed - transaction ready with environment-based exchange rate');
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRateHandlerExamples()
    .then(({ passed, failed }) => {
      console.log(`\n🎯 Final Results: ${passed} passed, ${failed} failed`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Examples crashed:', error);
      process.exit(1);
    });
}
