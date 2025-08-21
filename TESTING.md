# Testing Guide

## Overview

This project uses a custom test runner (`test-runner.js`) that discovers and executes test files throughout the codebase. The test structure has been refactored to follow modern testing best practices.

## Test Structure

### Individual Test Functions

Each test file now contains individual test functions that can be run independently:

```javascript
/**
 * Test 1: Basic functionality
 */
async function testBasicFunctionality() {
  // Test implementation
  assert.ok(true, 'Basic functionality should work');
}

/**
 * Test 2: Error handling
 */
async function testErrorHandling() {
  // Test implementation
  assert.throws(() => {
    throw new Error('Expected error');
  }, Error, 'Should throw an error');
}

/**
 * Main test runner that executes all tests in sequence
 */
async function runAllTests() {
  console.log('🧪 Testing Module');
  
  try {
    await testBasicFunctionality();
    await testErrorHandling();
    console.log('✅ All tests passed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Export individual test functions for selective testing
export {
  testBasicFunctionality,
  testErrorHandling
};

// Export the main test function
export default async function test() {
  return runAllTests();
}
```

### Benefits of This Structure

1. **Maintainability**: Each test is isolated and easier to understand
2. **Debugging**: Individual tests can be run in isolation
3. **Selective Testing**: Specific test functions can be imported and run
4. **Better Organization**: Clear separation of concerns
5. **Easier Maintenance**: Adding/removing tests is straightforward
6. **Parallel Execution**: Tests can potentially be run in parallel in the future

## Running Tests

### Run All Tests
```bash
npm test
# or
node test-runner.js
```

### Run Specific Module
```bash
npm run test:wallet-creation
npm run test:transfer
npm run test:api
# or
node test-runner.js --module=wallet-creation
node test-runner.js --module=transfer
node test-runner.js --module=api
```

### Run by Test Type
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
# or
node test-runner.js --type=unit
node test-runner.js --type=integration
```

### Other Options
```bash
node test-runner.js --verbose    # Verbose output
node test-runner.js --watch      # Watch mode
node test-runner.js --coverage   # With coverage
```

## Test File Organization

```
src/
├── wallet-creation/
│   └── tests/
│       ├── test-constants.js      # Constants tests
│       ├── test-ed25519.js        # ed25519 wallet tests
│       ├── test-ed448.js          # ed448 wallet tests
│       ├── test-integration.js    # Integration tests
│       ├── test-shared.js         # Shared utilities tests
│       └── test-simple.js         # Simple example tests
├── transfer/
│   └── test-transfer.js           # Transfer module tests
└── api/
    └── test-api.js                # API module tests
```

## Writing New Tests

### 1. Create Test File
Create a new test file following the naming convention: `test-*.js`

### 2. Structure Your Tests
```javascript
import { assert } from '../test-utils/index.js';
import { functionToTest } from '../module.js';

/**
 * Test 1: Description
 */
async function testDescription() {
  // Test implementation
  const result = functionToTest();
  assert.equal(result, expectedValue, 'Description of assertion');
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🧪 Testing Module');
  
  try {
    await testDescription();
    console.log('✅ All tests passed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Export individual tests
export { testDescription };

// Export main function
export default async function test() {
  return runAllTests();
}
```

### 3. Use Assertions
```javascript
import { assert } from '../test-utils/index.js';

// Basic assertions
assert.ok(condition, 'Message');
assert.equal(actual, expected, 'Message');
assert.deepEqual(actual, expected, 'Message');

// Error handling
assert.throws(() => {
  // Code that should throw
}, ErrorType, 'Message');

assert.doesNotThrow(() => {
  // Code that should not throw
}, 'Message');
```

## Test Runner Features

### Automatic Discovery
- Finds all `test-*.js` files in `src/**/` and `proto/**/`
- Groups tests by module
- Supports nested test directories

### Filtering
- Filter by module: `--module=wallet-creation`
- Filter by type: `--type=unit|integration`
- Combine filters for precise test selection

### Reporting
- Clear test execution output
- Module breakdown with success rates
- Error details for failed tests
- Execution time tracking

### Compatibility
- Maintains backward compatibility with existing test structure
- Supports both default and named exports
- Flexible test function detection

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Naming**: Use descriptive test function names
3. **Proper Assertions**: Include meaningful assertion messages
4. **Error Handling**: Test both success and failure cases
5. **Async Support**: Use async/await for asynchronous tests
6. **Documentation**: Add JSDoc comments for complex tests

## Troubleshooting

### Test Not Found
- Ensure file follows naming convention: `test-*.js`
- Check file is in correct directory structure
- Verify file has proper exports

### Import Errors
- Check import paths are correct
- Ensure dependencies are installed
- Verify module exports

### Test Failures
- Check console output for detailed error messages
- Verify test dependencies are working
- Test individual functions in isolation

## Future Enhancements

- **Parallel Execution**: Run tests concurrently for faster execution
- **Test Coverage**: Integrate with coverage tools
- **Test Reporting**: Generate detailed HTML reports
- **Performance Testing**: Add performance benchmarks
- **Mocking**: Enhanced mocking capabilities for external dependencies
