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
getAllACETokenRatesExample();
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
