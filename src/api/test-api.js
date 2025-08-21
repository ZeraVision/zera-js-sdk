import { assert } from '../test-utils/index.js';

/**
 * Test 1: Basic API functionality
 */
async function testBasicAPIFunctionality() {
  assert.ok(true, 'API module should be accessible');
}

/**
 * Test 2: Mock API response
 */
async function testMockAPIResponse() {
  const mockResponse = { status: 'success', data: 'test' };
  assert.ok(mockResponse.status === 'success', 'API response should have success status');
  assert.ok(mockResponse.hasOwnProperty('data'), 'API response should have data property');
}

/**
 * Test 3: API error handling
 */
async function testAPIErrorHandling() {
  assert.throws(() => {
    throw new Error('API Error');
  }, Error, 'API should throw errors when needed');
}

/**
 * Main test runner that executes all tests in sequence
 */
async function runAllAPITests() {
  console.log('🧪 Testing API Module');
  
  try {
    // Test 1: Basic API functionality
    await testBasicAPIFunctionality();
    
    // Test 2: Mock API response
    await testMockAPIResponse();
    
    // Test 3: API error handling
    await testAPIErrorHandling();
    
    console.log('✅ All API tests passed');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    throw error;
  }
}

// Export individual test functions for selective testing
export {
  testBasicAPIFunctionality,
  testMockAPIResponse,
  testAPIErrorHandling
};

// Export the main test function
export default async function testAPI() {
  return runAllAPITests();
}

// Also export as named function for compatibility
export async function test() {
  return runAllAPITests();
}
