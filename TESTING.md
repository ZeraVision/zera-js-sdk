# Testing Guide for ZERA JS SDK

This document explains how to use the comprehensive testing structure that allows you to run all tests across the entire project while maintaining a clean modular structure.

## 🚀 Quick Start

### Run All Tests
```bash
npm test
```

### Run Tests for a Specific Module
```bash
npm run test:wallet      # Run wallet-creation tests
npm run test:api         # Run API tests
npm run test:transfer    # Run transfer tests
npm run test:proto       # Run proto tests
```

### Run Tests by Type
```bash
npm run test:unit        # Run only unit tests
npm run test:integration # Run only integration tests
```

### Advanced Options
```bash
npm run test -- --verbose    # Verbose output
npm run test -- --watch      # Watch mode (rerun on changes)
npm run test -- --coverage   # Enable coverage reporting
npm run test -- --module=wallet-creation  # Filter by module
```

## 📁 Project Structure

```
zera-js-sdk/
├── test-runner.js          # Main test runner
├── test.config.js          # Test configuration
├── test-utils.js           # Common testing utilities
├── package.json            # Test scripts and dependencies
├── src/
│   ├── wallet-creation/
│   │   ├── test.js         # Main test file
│   │   └── tests/          # Individual test files
│   │       ├── test-constants.js
│   │       ├── test-ed25519.js
│   │       ├── test-ed448.js
│   │       ├── test-shared.js
│   │       └── test-integration.js
│   ├── api/
│   │   └── [test files]
│   └── transfer/
│       └── [test files]
└── proto/
    └── [test files]
```

## 🧪 Test File Conventions

### 1. Test File Naming
- `test-*.js` - Test files (e.g., `test-constants.js`)
- `*.test.js` - Alternative naming (e.g., `constants.test.js`)
- `*.spec.js` - Specification-style tests
- `tests/` directory - Grouped test files

### 2. Test Function Exports
Your test files should export one of these functions:

```javascript
// Option 1: Default export
export default async function runTests() {
  // Your tests here
}

// Option 2: Named exports
export async function test() {
  // Your tests here
}

export async function runTests() {
  // Your tests here
}

// Option 3: Integration test
export async function testIntegration() {
  // Your tests here
}
```

### 3. Using Test Utilities
```javascript
import { assert, describe, utils } from '../../test-utils.js';

// Basic assertions
assert.ok(condition, 'message');
assert.equal(actual, expected, 'message');
assert.deepEqual(actual, expected, 'message');
assert.throws(() => fn(), Error, 'message');

// Test groups
describe('Wallet Creation', (group) => {
  group.beforeAll(async () => {
    // Setup before all tests
  });

  group.test('should create ed25519 wallet', async () => {
    // Test implementation
    assert.ok(true);
  });

  group.afterEach(async () => {
    // Cleanup after each test
  });
});

// Utility functions
await utils.delay(100); // Wait 100ms
const randomString = utils.random.string(20);
```

## 🔧 Configuration

### Test Configuration (`test.config.js`)
```javascript
export default {
  // Test discovery patterns
  testPatterns: [
    '**/test-*.js',
    '**/tests/**/*.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  
  // Module-specific settings
  modules: {
    'wallet-creation': {
      testFiles: ['src/wallet-creation/test.js', 'src/wallet-creation/tests/**/*.js'],
      dependencies: ['@noble/ed25519', '@noble/hashes', 'bip32', 'bip39'],
      timeout: 30000
    }
  },
  
  // Execution settings
  execution: {
    parallel: false,
    timeout: 30000,
    retries: 1,
    bail: false
  }
};
```

## 📊 Test Results and Reporting

### Console Output
The test runner provides:
- ✅ Passed tests
- ❌ Failed tests
- ⏭️ Skipped tests
- 📊 Test summary with success rates
- 📁 Module breakdown
- ⏱️ Execution time

### Example Output
```
🚀 ZERA JS SDK - Test Runner

🔍 Discovering test files...
✅ Found 8 test files

🏃 Starting test execution...

🧪 Running: src/wallet-creation/test.js
✅ src/wallet-creation/test.js passed (245ms)

🧪 Running: src/wallet-creation/tests/test-constants.js
✅ src/wallet-creation/tests/test-constants.js passed (45ms)

📊 Test Summary

Total Tests: 8
✅ Passed: 8
❌ Failed: 0
⏭️ Skipped: 0
📈 Success Rate: 100.0%
⏱️ Duration: 1250ms

📁 Module Breakdown
wallet-creation: 8/8 passed (100.0%)

🎉 All tests passed successfully!
```

## 🎯 Best Practices

### 1. Test Organization
- Keep tests close to the code they test
- Use descriptive test names
- Group related tests together
- Separate unit tests from integration tests

### 2. Test Structure
```javascript
import { assert, describe } from '../../test-utils.js';

describe('Feature Name', (group) => {
  group.beforeAll(async () => {
    // Setup
  });

  group.test('should do something specific', async () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = await functionUnderTest(input);
    
    // Assert
    assert.equal(result, 'expected');
  });

  group.afterEach(async () => {
    // Cleanup
  });
});
```

### 3. Error Handling
```javascript
group.test('should handle errors gracefully', async () => {
  // Test that errors are thrown
  assert.throws(
    () => functionThatShouldThrow(),
    Error,
    'Should throw an error'
  );
  
  // Test that errors are not thrown
  assert.doesNotThrow(
    () => functionThatShouldNotThrow(),
    'Should not throw an error'
  );
});
```

### 4. Async Testing
```javascript
group.test('should handle async operations', async () => {
  const result = await asyncFunction();
  assert.ok(result);
});
```

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

### Pre-commit Hook
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test"
    }
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Test not discovered**
   - Check file naming convention
   - Verify file is not in excluded directories
   - Check test function exports

2. **Module import errors**
   - Ensure `"type": "module"` in package.json
   - Use correct import paths
   - Check file extensions

3. **Test timeout**
   - Increase timeout in test.config.js
   - Check for infinite loops
   - Verify async operations complete

4. **Permission denied**
   - Make test-runner.js executable: `chmod +x test-runner.js`
   - Check file permissions

### Debug Mode
```bash
npm run test -- --verbose
```

This will show:
- All discovered test files
- Detailed error information
- Stack traces for failures

## 📈 Future Enhancements

- [ ] Code coverage reporting
- [ ] Parallel test execution
- [ ] Test result caching
- [ ] Performance benchmarking
- [ ] Visual test reports
- [ ] Integration with CI/CD platforms

## 🤝 Contributing

When adding new tests:
1. Follow the naming conventions
2. Use the provided test utilities
3. Add tests to the appropriate module
4. Update test configuration if needed
5. Ensure all tests pass before committing

## 📚 Additional Resources

- [Node.js Testing Best Practices](https://nodejs.org/en/docs/guides/testing-and-debugging/)
- [JavaScript Testing Patterns](https://javascript.info/testing)
- [Async Testing in JavaScript](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Async_await)
