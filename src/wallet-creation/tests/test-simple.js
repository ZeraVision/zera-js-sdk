import { assert } from '../../test-utils/index.js';

/**
 * Test 1: Basic assertions
 */
async function testBasicAssertions() {
  assert.ok(true, 'Basic assertion should work');
  assert.equal(2 + 2, 4, 'Basic math should work');
  assert.deepEqual([1, 2, 3], [1, 2, 3], 'Array comparison should work');
}

/**
 * Test 2: String operations
 */
async function testStringOperations() {
  const testString = 'Hello, ZERA!';
  assert.ok(testString.includes('ZERA'), 'String should contain ZERA');
  assert.equal(testString.length, 12, 'String length should be correct');
}

/**
 * Test 3: Object operations
 */
async function testObjectOperations() {
  const testObj = { name: 'ZERA', type: 'blockchain' };
  assert.ok(testObj.hasOwnProperty('name'), 'Object should have name property');
  assert.equal(testObj.type, 'blockchain', 'Object type should be correct');
}

/**
 * Test 4: Error handling
 */
async function testErrorHandling() {
  assert.throws(() => {
    throw new Error('Test error');
  }, Error, 'Should throw an error');
  
  assert.doesNotThrow(() => {
    const result = 1 + 1;
    return result;
  }, 'Should not throw an error');
}

/**
 * Main test runner that executes all tests in sequence
 */
async function runAllSimpleTests() {
  console.log('🧪 Testing Simple Module');
  
  try {
    // Test 1: Basic assertions
    await testBasicAssertions();
    
    // Test 2: String operations
    await testStringOperations();
    
    // Test 3: Object operations
    await testObjectOperations();
    
    // Test 4: Error handling
    await testErrorHandling();
    
    console.log('✅ All simple tests passed');
  } catch (error) {
    console.error('❌ Simple test failed:', error.message);
    throw error;
  }
}

// Export individual test functions for selective testing
export {
  testBasicAssertions,
  testStringOperations,
  testObjectOperations,
  testErrorHandling
};

// Export the main test function
export default async function testSimple() {
  return runAllSimpleTests();
}

// Also export as named function for compatibility
export async function test() {
  return runAllSimpleTests();
}
