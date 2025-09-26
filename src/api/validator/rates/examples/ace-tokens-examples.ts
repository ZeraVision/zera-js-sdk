/**
 * ACE Tokens Service Examples
 * 
 * Demonstrates how to use the ACE tokens service to get token rates.
 */

import { getACETokenRates, getACETokenRate } from '../ace.js';
import Decimal from 'decimal.js';

/**
 * Example: Get all ACE token rates
 */
export async function getAllACETokenRatesExample() {
  try {
    console.log('Fetching all ACE token rates...');
    
    const tokens = await getACETokenRates();
    
    console.log(`Found ${tokens.length} ACE tokens:`);
    tokens.forEach((token: { contractId: string; rate: Decimal }) => {
      console.log(`  Contract ID: ${token.contractId}`);
      console.log(`  Rate: ${token.rate.toString()} (as Decimal)`);
      console.log(`  Rate as USD: $${token.rate.toFixed(2)}`);
      console.log('---');
    });
    
    return tokens;
  } catch (error) {
    console.error('Error fetching ACE token rates:', error);
    throw error;
  }
}

/**
 * Example: Get a specific ACE token rate
 */
export async function getSpecificACETokenRateExample(contractId: string) {
  try {
    console.log(`Fetching ACE token rate for contract: ${contractId}`);
    
    const rate = await getACETokenRate(contractId);
    
    if (rate === null) {
      console.log(`No ACE token found for contract ID: ${contractId}`);
      return null;
    }
    
    console.log(`Rate for ${contractId}: ${rate.toString()} (as Decimal)`);
    console.log(`Rate as USD: $${rate.toFixed(2)}`);
    
    // Example: Calculate value for 100 tokens
    const tokenAmount = new Decimal(100);
    const usdValue = tokenAmount.mul(rate);
    console.log(`100 tokens = $${usdValue.toFixed(2)} USD`);
    
    return rate;
  } catch (error) {
    console.error(`Error fetching ACE token rate for ${contractId}:`, error);
    throw error;
  }
}

/**
 * Example: Calculate USD value for a token amount
 */
export async function calculateTokenValueExample(contractId: string, tokenAmount: string) {
  try {
    console.log(`Calculating USD value for ${tokenAmount} tokens of contract ${contractId}`);
    
    const rate = await getACETokenRate(contractId);
    
    if (rate === null) {
      throw new Error(`No ACE token found for contract ID: ${contractId}`);
    }
    
    const amount = new Decimal(tokenAmount);
    const usdValue = amount.mul(rate);
    
    console.log(`Token Amount: ${amount.toString()}`);
    console.log(`Rate: $${rate.toFixed(6)} per token`);
    console.log(`USD Value: $${usdValue.toFixed(2)}`);
    
    return {
      tokenAmount: amount,
      rate,
      usdValue
    };
  } catch (error) {
    console.error('Error calculating token value:', error);
    throw error;
  }
}

/**
 * Example: Compare multiple token rates
 */
export async function compareTokenRatesExample(contractIds: string[]) {
  try {
    console.log('Comparing token rates for multiple contracts...');
    
    const allTokens = await getACETokenRates();
    const comparison = [];
    
    for (const contractId of contractIds) {
      const token = allTokens.find((t: { contractId: string; rate: Decimal }) => t.contractId === contractId);
      if (token) {
        comparison.push({
          contractId: token.contractId,
          rate: token.rate,
          usdValue: token.rate.toFixed(6)
        });
      } else {
        console.warn(`No ACE token found for contract: ${contractId}`);
      }
    }
    
    // Sort by rate (highest first)
    comparison.sort((a, b) => b.rate.comparedTo(a.rate));
    
    console.log('Token rate comparison (highest to lowest):');
    comparison.forEach((item, index) => {
      console.log(`${index + 1}. ${item.contractId}: $${item.usdValue}`);
    });
    
    return comparison;
  } catch (error) {
    console.error('Error comparing token rates:', error);
    throw error;
  }
}

/**
 * Example: Run all examples with sample data
 */
export async function runAllExamples() {
  try {
    console.log('🚀 Running ACE Tokens Service Examples...\n');
    
    // Get all ACE token rates
    const tokens = await getAllACETokenRatesExample();
    
    if (tokens.length > 0) {
      const firstToken = tokens[0];
      
      if (firstToken) {
        // Get a specific token rate
        await getSpecificACETokenRateExample(firstToken.contractId);
        
        // Calculate value for 1000 tokens
        await calculateTokenValueExample(firstToken.contractId, '1000');
      }
      
      // Compare multiple token rates (use first 3 tokens if available)
      const contractIds = tokens.slice(0, 3).map(t => t.contractId);
      if (contractIds.length > 1) {
        await compareTokenRatesExample(contractIds);
      }
    } else {
      console.log('⚠️  No ACE tokens found - cannot run additional examples');
    }
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Example failed:', error);
    throw error;
  }
}

// Example usage (uncomment to run)
/*
async function runExamples() {
  try {
    // Run all examples
    await runAllExamples();
    
    // Or run individual examples:
    // await getAllACETokenRatesExample();
    // await getSpecificACETokenRateExample('some-contract-id');
    // await calculateTokenValueExample('some-contract-id', '1000');
    // await compareTokenRatesExample(['contract-1', 'contract-2', 'contract-3']);
    
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// runExamples();
*/
