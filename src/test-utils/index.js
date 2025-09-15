/**
 * Test Utilities for ZERA JS SDK
 * Provides common testing functions and assertions
 */

import chalk from 'chalk';

// Export test keys for universal use
export * from './test-keys.js';

// Test result tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  startTime: Date.now()
};

/**
 * Reset test results for a new test suite
 */
export function resetTestResults() {
  testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    startTime: Date.now()
  };
}

/**
 * Get current test results
 */
export function getTestResults() {
  return { ...testResults };
}

/**
 * Basic assertion functions
 */
export const assert = {
  /**
   * Assert that a condition is true
   */
  ok(condition, message = 'Assertion failed') {
    testResults.total++;
    if (condition) {
      testResults.passed++;
      return true;
    } else {
      testResults.failed++;
      throw new Error(message);
    }
  },

  /**
   * Assert that two values are equal
   */
  equal(actual, expected, message = `Expected ${expected}, but got ${actual}`) {
    testResults.total++;
    if (actual === expected) {
      testResults.passed++;
      return true;
    } else {
      testResults.failed++;
      throw new Error(message);
    }
  },

  /**
   * Assert that two values are deeply equal (for objects/arrays)
   */
  deepEqual(actual, expected, message = 'Objects are not deeply equal') {
    testResults.total++;
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
      testResults.passed++;
      return true;
    } else {
      testResults.failed++;
      throw new Error(message);
    }
  },

  /**
   * Assert that a function throws an error
   */
  throws(fn, expectedError = null, message = 'Expected function to throw an error') {
    testResults.total++;
    try {
      fn();
      testResults.failed++;
      throw new Error(message);
    } catch (error) {
      if (expectedError && !(error instanceof expectedError)) {
        testResults.failed++;
        throw new Error(`Expected ${expectedError.name}, but got ${error.constructor.name}`);
      }
      testResults.passed++;
      return error;
    }
  },

  /**
   * Assert that a function does not throw an error
   */
  doesNotThrow(fn, message = 'Expected function not to throw an error') {
    testResults.total++;
    try {
      fn();
      testResults.passed++;
      return true;
    } catch (error) {
      testResults.failed++;
      throw new Error(`${message}: ${error.message}`);
    }
  }
};

/**
 * Test group management
 */
export class TestGroup {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.beforeEach = null;
    this.afterEach = null;
    this.beforeAll = null;
    this.afterAll = null;
  }

  /**
   * Add a test to the group
   */
  test(name, fn) {
    this.tests.push({ name, fn });
  }

  /**
   * Set beforeEach hook
   */
  beforeEach(fn) {
    this.beforeEach = fn;
  }

  /**
   * Set afterEach hook
   */
  afterEach(fn) {
    this.afterEach = fn;
  }

  /**
   * Set beforeAll hook
   */
  beforeAll(fn) {
    this.beforeAll = fn;
  }

  /**
   * Set afterAll hook
   */
  afterAll(fn) {
    this.afterAll = fn;
  }

  /**
   * Run all tests in the group
   */
  async run() {
    console.log(chalk.blue(`\n📋 Test Group: ${this.name}`));
    
    if (this.beforeAll) {
      await this.beforeAll();
    }

    for (const test of this.tests) {
      try {
        if (this.beforeEach) {
          await this.beforeEach();
        }

        await test.fn();
        console.log(chalk.green(`  ✅ ${test.name}`));

        if (this.afterEach) {
          await this.afterEach();
        }
      } catch (error) {
        console.log(chalk.red(`  ❌ ${test.name}: ${error.message}`));
        throw error;
      }
    }

    if (this.afterAll) {
      await this.afterAll();
    }
  }
}

/**
 * Create a test group
 */
export function describe(name, fn) {
  const group = new TestGroup(name);
  fn(group);
  return group;
}

/**
 * Test runner utilities
 */
export const testRunner = {
  /**
   * Run a test function with proper error handling
   */
  async runTest(testName, testFn) {
    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      console.log(chalk.green(`✅ ${testName} passed (${duration}ms)`));
      return { success: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(chalk.red(`❌ ${testName} failed (${duration}ms): ${error.message}`));
      return { success: false, error, duration };
    }
  },

  /**
   * Run multiple tests and collect results
   */
  async runTests(tests) {
    const results = [];
    for (const [name, fn] of tests) {
      const result = await this.runTest(name, fn);
      results.push({ name, ...result });
    }
    return results;
  }
};

/**
 * Mock utilities
 */
export const mock = {
  /**
   * Create a mock function
   */
  fn(implementation = null) {
    const mockFn = (...args) => {
      mockFn.calls.push(args);
      if (implementation) {
        return implementation(...args);
      }
      return undefined;
    };
    
    mockFn.calls = [];
    mockFn.called = false;
    mockFn.callCount = 0;
    
    Object.defineProperty(mockFn, 'called', {
      get() {
        return this.calls.length > 0;
      }
    });
    
    Object.defineProperty(mockFn, 'callCount', {
      get() {
        return this.calls.length;
      }
    });
    
    return mockFn;
  },

  /**
   * Reset all mock functions
   */
  reset() {
    // This would reset all created mocks
    // Implementation depends on how you want to track mocks
  }
};

/**
 * Utility functions for common test scenarios
 */
export const utils = {
  /**
   * Wait for a specified amount of time
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Generate random test data
   */
  random: {
    string(length = 10) {
      return Math.random().toString(36).substring(2, length + 2);
    },
    
    number(min = 0, max = 100) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    boolean() {
      return Math.random() > 0.5;
    }
  },

  /**
   * Create a test wallet for testing
   */
  async createTestWallet(type = 'ed25519') {
    // This would create a test wallet instance
    // Implementation depends on your wallet creation module
    return {
      type,
      address: `test-${type}-${Date.now()}`,
      privateKey: `private-${type}-${Date.now()}`,
      publicKey: `public-${type}-${Date.now()}`
    };
  }
};

/**
 * Print test summary
 */
export function printTestSummary() {
  const duration = Date.now() - testResults.startTime;
  const successRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;
  
  console.log(chalk.bold.blue('\n📊 Test Summary\n'));
  console.log(chalk.cyan(`Total Tests: ${testResults.total}`));
  console.log(chalk.green(`✅ Passed: ${testResults.passed}`));
  console.log(chalk.red(`❌ Failed: ${testResults.failed}`));
  console.log(chalk.yellow(`⏭️  Skipped: ${testResults.skipped}`));
  console.log(chalk.blue(`📈 Success Rate: ${successRate}%`));
  console.log(chalk.blue(`⏱️  Duration: ${duration}ms`));
  
  if (testResults.failed === 0) {
    console.log(chalk.bold.green('\n🎉 All tests passed successfully!'));
  } else {
    console.log(chalk.bold.red('\n💥 Some tests failed!'));
  }
}

export default {
  assert,
  describe,
  TestGroup,
  testRunner,
  mock,
  utils,
  resetTestResults,
  getTestResults,
  printTestSummary
};
