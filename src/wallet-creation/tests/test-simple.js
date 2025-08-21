import { assert } from '../../test-utils/index.js';

/**
 * Simple test to demonstrate the testing structure
 */
export default async function testSimple() {
  console.log('🧪 Testing Simple Module');
  
  // Test 1: Basic assertions
  assert.ok(true, 'Basic assertion should work');
  assert.equal(2 + 2, 4, 'Basic math should work');
  assert.deepEqual([1, 2, 3], [1, 2, 3], 'Array comparison should work');
  
  // Test 2: String operations
  const testString = 'Hello, ZERA!';
  assert.ok(testString.includes('ZERA'), 'String should contain ZERA');
  assert.equal(testString.length, 12, 'String length should be correct');
  
  // Test 3: Object operations
  const testObj = { name: 'ZERA', type: 'blockchain' };
  assert.ok(testObj.hasOwnProperty('name'), 'Object should have name property');
  assert.equal(testObj.type, 'blockchain', 'Object type should be correct');
  
  // Test 4: Error handling
  assert.throws(() => {
    throw new Error('Test error');
  }, Error, 'Should throw an error');
  
  assert.doesNotThrow(() => {
    const result = 1 + 1;
    return result;
  }, 'Should not throw an error');
  
  console.log('✅ All simple tests passed');
}

// Also export as named function for compatibility
export async function test() {
  return testSimple();
}
