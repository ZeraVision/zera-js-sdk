/**
 * Test Utilities for ZERA JS SDK
 * Provides common testing functions and assertions
 */

import chalk from 'chalk';

// Export test keys for universal use
export * from './test-keys.js';

interface TestResults {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  startTime: number;
}

interface TestResult {
  success: boolean;
  duration: number;
  error?: Error;
}

interface Test {
  name: string;
  fn: () => Promise<void> | void;
}

interface MockFunction {
  (...args: any[]): any;
  calls: any[][];
  called: boolean;
  callCount: number;
}

// Test result tracking
let testResults: TestResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  startTime: Date.now()
};

/**
 * Reset test results for a new test suite
 */
export function resetTestResults(): void {
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
export function getTestResults(): TestResults {
  return { ...testResults };
}

/**
 * Basic assertion functions
 */
export const assert = {
  /**
   * Assert that a condition is true
   */
  ok(condition: any, message: string = 'Assertion failed'): boolean {
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
  equal(actual: any, expected: any, message: string = `Expected ${expected}, but got ${actual}`): boolean {
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
  deepEqual(actual: any, expected: any, message: string = 'Objects are not deeply equal'): boolean {
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
  throws(fn: () => any, expectedError: any = null, message: string = 'Expected function to throw an error'): Error {
    testResults.total++;
    try {
      fn();
      testResults.failed++;
      throw new Error(message);
    } catch (error) {
      if (expectedError && !(error instanceof expectedError)) {
        testResults.failed++;
        throw new Error(`Expected ${expectedError.name}, but got ${(error as Error).constructor.name}`);
      }
      testResults.passed++;
      return error as Error;
    }
  },

  /**
   * Assert that a function does not throw an error
   */
  doesNotThrow(fn: () => any, message: string = 'Expected function not to throw an error'): boolean {
    testResults.total++;
    try {
      fn();
      testResults.passed++;
      return true;
    } catch (error) {
      testResults.failed++;
      throw new Error(`${message}: ${(error as Error).message}`);
    }
  },

  /**
   * Assert that a condition is false
   */
  fail(message: string = 'Test failed'): never {
    testResults.total++;
    testResults.failed++;
    throw new Error(message);
  }
};

/**
 * Test group management
 */
export class TestGroup {
  public name: string;
  public tests: Test[];
  private _beforeEach: (() => Promise<void> | void) | null;
  private _afterEach: (() => Promise<void> | void) | null;
  private _beforeAll: (() => Promise<void> | void) | null;
  private _afterAll: (() => Promise<void> | void) | null;

  constructor(name: string) {
    this.name = name;
    this.tests = [];
    this._beforeEach = null;
    this._afterEach = null;
    this._beforeAll = null;
    this._afterAll = null;
  }

  /**
   * Add a test to the group
   */
  test(name: string, fn: () => Promise<void> | void): void {
    this.tests.push({ name, fn });
  }

  /**
   * Set beforeEach hook
   */
  beforeEach(fn: () => Promise<void> | void): void {
    this._beforeEach = fn;
  }

  /**
   * Set afterEach hook
   */
  afterEach(fn: () => Promise<void> | void): void {
    this._afterEach = fn;
  }

  /**
   * Set beforeAll hook
   */
  beforeAll(fn: () => Promise<void> | void): void {
    this._beforeAll = fn;
  }

  /**
   * Set afterAll hook
   */
  afterAll(fn: () => Promise<void> | void): void {
    this._afterAll = fn;
  }

  /**
   * Run all tests in the group
   */
  async run(): Promise<void> {
    console.log(chalk.blue(`\n📋 Test Group: ${this.name}`));
    
    if (this._beforeAll) {
      await this._beforeAll();
    }

    for (const test of this.tests) {
      try {
        if (this._beforeEach) {
          await this._beforeEach();
        }

        await test.fn();
        console.log(chalk.green(`  ✅ ${test.name}`));

        if (this._afterEach) {
          await this._afterEach();
        }
      } catch (error) {
        console.log(chalk.red(`  ❌ ${test.name}: ${(error as Error).message}`));
        throw error;
      }
    }

    if (this._afterAll) {
      await this._afterAll();
    }
  }
}

/**
 * Create a test group
 */
export function describe(name: string, fn: (group: TestGroup) => void): TestGroup {
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
  async runTest(testName: string, testFn: () => Promise<void> | void): Promise<TestResult> {
    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      console.log(chalk.green(`✅ ${testName} passed (${duration}ms)`));
      return { success: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(chalk.red(`❌ ${testName} failed (${duration}ms): ${(error as Error).message}`));
      return { success: false, error: error as Error, duration };
    }
  },

  /**
   * Run multiple tests and collect results
   */
  async runTests(tests: Array<[string, () => Promise<void> | void]>): Promise<Array<{ name: string } & TestResult>> {
    const results: Array<{ name: string } & TestResult> = [];
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
  fn(implementation: ((...args: any[]) => any) | null = null): MockFunction {
    const mockFn = ((...args: any[]) => {
      mockFn.calls.push(args);
      if (implementation) {
        return implementation(...args);
      }
      return undefined;
    }) as MockFunction;
    
    mockFn.calls = [];
    
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
  reset(): void {
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
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Generate random test data
   */
  random: {
    string(length: number = 10): string {
      return Math.random().toString(36).substring(2, length + 2);
    },
    
    number(min: number = 0, max: number = 100): number {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    boolean(): boolean {
      return Math.random() > 0.5;
    }
  },

  /**
   * Create a test wallet for testing
   */
  async createTestWallet(type: string = 'ed25519'): Promise<{
    type: string;
    address: string;
    privateKey: string;
    publicKey: string;
  }> {
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
export function printTestSummary(): void {
  const duration = Date.now() - testResults.startTime;
  const successRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : '0';
  
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
