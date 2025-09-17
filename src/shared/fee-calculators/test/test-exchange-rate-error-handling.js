/**
 * Test Exchange Rate Error Handling
 * Verifies that unknown symbols throw errors instead of using default fallbacks
 */

import { ACEExchangeRateService } from '../../../api/zv-indexer/rate/ace.js';

/**
 * Test that unknown symbols throw errors instead of using default fallbacks
 */
export async function testExchangeRateErrorHandling() {
  console.log('🧪 Testing Exchange Rate Error Handling');
  
  try {
    const aceService = new ACEExchangeRateService();
    
    // Test 1: Known symbol with fallback should work
    console.log('📊 Test 1: Known symbol with fallback');
    try {
      const zraRate = await aceService.getExchangeRate('$ZRA+0000');
      console.log(`✅ $ZRA+0000 rate: ${zraRate.toString()} USD (using fallback)`);
    } catch (error) {
      console.log(`⚠️  $ZRA+0000 error: ${error.message}`);
    }
    
    // Test 2: Unknown symbol should throw error
    console.log('📊 Test 2: Unknown symbol should throw error');
    try {
      const unknownRate = await aceService.getExchangeRate('$TESTFEE+0001');
      console.log(`❌ $TESTFEE+0001 rate: ${unknownRate.toString()} USD (should have thrown error!)`);
      return { success: false, error: 'Unknown symbol should have thrown error' };
    } catch (error) {
      console.log(`✅ $TESTFEE+0001 correctly threw error: ${error.message}`);
    }
    
    // Test 3: Another unknown symbol
    console.log('📊 Test 3: Another unknown symbol');
    try {
      const anotherUnknownRate = await aceService.getExchangeRate('$UNKNOWN+9999');
      console.log(`❌ $UNKNOWN+9999 rate: ${anotherUnknownRate.toString()} USD (should have thrown error!)`);
      return { success: false, error: 'Another unknown symbol should have thrown error' };
    } catch (error) {
      console.log(`✅ $UNKNOWN+9999 correctly threw error: ${error.message}`);
    }
    
    console.log('\n✅ Exchange Rate Error Handling Test Completed');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Exchange Rate Error Handling Test Failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testExchangeRateErrorHandling();
}
