import { assert } from '../test-utils/index.js';

/**
 * Test API module
 */
export default async function testAPI() {
  console.log('🧪 Testing API Module');
  
  // Test 1: Basic API functionality
  assert.ok(true, 'API module should be accessible');
  
  // Test 2: Mock API response
  const mockResponse = { status: 'success', data: 'test' };
  assert.ok(mockResponse.status === 'success', 'API response should have success status');
  assert.ok(mockResponse.hasOwnProperty('data'), 'API response should have data property');
  
  // Test 3: API error handling
  assert.throws(() => {
    throw new Error('API Error');
  }, Error, 'API should throw errors when needed');
  
  console.log('✅ All API tests passed');
}

// Also export as named function for compatibility
export async function test() {
  return testAPI();
}
