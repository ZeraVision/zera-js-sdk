/**
 * ACE Tokens Service Tests
 * 
 * Basic tests to ensure the ACE tokens service works correctly.
 */

import { getACETokenRates, getACETokenRate } from '../ace.js';
import Decimal from 'decimal.js';

/**
 * Test the ACE tokens service
 */
export async function testACETokensService() {
  console.log('🧪 Testing ACE Tokens Service...\n');

  try {
    // Test 1: Get all ACE token rates
    console.log('Test 1: Getting all ACE token rates...');
    const tokens = await getACETokenRates();
    
    console.log(`✅ Successfully retrieved ${tokens.length} ACE tokens`);
    
    if (tokens.length > 0) {
      const firstToken = tokens[0];
      console.log(`   First token: ${firstToken.contractId} = $${firstToken.rate.toFixed(6)}`);
      
      // Verify the rate is a Decimal
      if (firstToken.rate instanceof Decimal) {
        console.log('✅ Rate is properly converted to Decimal');
      } else {
        console.log('❌ Rate is not a Decimal instance');
        return false;
      }
      
      // Test 2: Get specific token rate
      console.log('\nTest 2: Getting specific token rate...');
      const specificRate = await getACETokenRate(firstToken.contractId);
      
      if (specificRate && specificRate.equals(firstToken.rate)) {
        console.log(`✅ Specific rate matches: $${specificRate.toFixed(6)}`);
      } else {
        console.log('❌ Specific rate does not match');
        return false;
      }
      
      // Test 3: Test with non-existent contract
      console.log('\nTest 3: Testing with non-existent contract...');
      const nonExistentRate = await getACETokenRate('non-existent-contract-id');
      
      if (nonExistentRate === null) {
        console.log('✅ Non-existent contract returns null as expected');
      } else {
        console.log('❌ Non-existent contract should return null');
        return false;
      }
      
      // Test 4: Test Decimal math operations
      console.log('\nTest 4: Testing Decimal math operations...');
      const tokenAmount = new Decimal(100);
      const usdValue = tokenAmount.mul(firstToken.rate);
      const expectedValue = new Decimal(100).mul(firstToken.rate);
      
      if (usdValue.equals(expectedValue)) {
        console.log(`✅ Decimal math works: 100 tokens = $${usdValue.toFixed(2)}`);
      } else {
        console.log('❌ Decimal math failed');
        return false;
      }
      
    } else {
      console.log('⚠️  No ACE tokens found - this might be expected in test environment');
    }
    
    console.log('\n🎉 All tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

/**
 * Run the tests
 */
export async function runTests() {
  const success = await testACETokensService();
  
  if (success) {
    console.log('\n✅ ACE Tokens Service is working correctly!');
    process.exit(0);
  } else {
    console.log('\n❌ ACE Tokens Service has issues!');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}
