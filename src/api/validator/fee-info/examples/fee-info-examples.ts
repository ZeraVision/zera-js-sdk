/**
 * Fee Info Service Examples
 * 
 * Demonstrates how to use the fee info service to get comprehensive token fee information.
 */

import { getTokenFeeInfo } from '../request.js';

/**
 * Example: Get comprehensive fee information for all tokens
 */
async function getAllTokenFeeInfoExample() {
  try {
    console.log('Fetching comprehensive fee information for all tokens...');
    
    const response = await getTokenFeeInfo({
      contractIds: ['$ZRA+0000', '$IIT+0000'],
      includeRates: true,
      includeContractFees: true
    });
    
    console.log(`Found ${response.tokens.length} tokens with fee information:`);
    response.tokens.forEach((info) => {
      console.log(`  Contract ID: ${info.contractId}`);
      console.log(`  Rate: ${info.rate} (raw string)`);
      console.log(`  Authorized: ${info.authorized}`);
      console.log(`  Denomination: ${info.denomination}`);
      if (info.contractFees) {
        console.log(`  Contract Fees:`);
        console.log(`    Fee: ${info.contractFees.fee}`);
        console.log(`    Burn: ${info.contractFees.burn}`);
        console.log(`    Validator: ${info.contractFees.validator}`);
        if (info.contractFees.feeAddress) {
          console.log(`    Fee Address: ${info.contractFees.feeAddress}`);
        }
      }
      console.log('---');
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching token fee information:', error);
    throw error;
  }
}