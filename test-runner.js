#!/usr/bin/env node

import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, relative } from 'path';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  module: null,
  type: null,
  verbose: false,
  watch: false,
  coverage: false,
  clean: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  // Handle --module=value format
  if (arg.startsWith('--module=')) {
    options.module = arg.split('=')[1];
  }
  // Handle --module value format
  else if (arg === '--module' && i + 1 < args.length) {
    options.module = args[++i];
  }
  // Handle --type=value format
  else if (arg.startsWith('--type=')) {
    options.type = arg.split('=')[1];
  }
  // Handle --type value format
  else if (arg === '--type' && i + 1 < args.length) {
    options.type = args[++i];
  }
  else if (arg === '--verbose') {
    options.verbose = true;
  } else if (arg === '--watch') {
    options.watch = true;
  } else if (arg === '--coverage') {
    options.coverage = true;
  } else if (arg === '--clean') {
    options.clean = true;
  }
}

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [],
  startTime: Date.now(),
  modules: new Map()
};

/**
 * Discover all test files in the project
 */
async function discoverTests() {
  console.log(chalk.blue('🔍 Discovering test files...'));
  
  try {
    // Find all test files using multiple patterns
    const patterns = [
      'src/**/test-*.js',      // test-*.js files in src subdirectories
      'src/**/tests/**/*.js',  // All .js files in tests subdirectories
      'proto/**/test-*.js',    // test-*.js files in proto
      'proto/**/tests/**/*.js' // All .js files in proto tests
    ];
    
    let allTestFiles = [];
    
    for (const pattern of patterns) {
      const files = await glob(pattern, {
        cwd: __dirname,
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/coverage/**',
          '**/.git/**'
        ],
        absolute: true
      });
      allTestFiles.push(...files);
    }
    
    // Remove duplicates and sort
    let uniqueFiles = [...new Set(allTestFiles)].sort();
    
    // Filter by module if specified
    if (options.module) {
      const beforeCount = uniqueFiles.length;
      console.log(chalk.blue(`🔍 Filtering for module: ${options.module}`));
      
      uniqueFiles = uniqueFiles.filter(file => {
        const relativePath = relative(__dirname, file);
        const parts = relativePath.split(/[\/\\]/);
        
        let shouldInclude = false;
        
        // Dynamic module detection - no more hardcoding!
        if (options.module === 'proto' && parts[0] === 'proto') {
          shouldInclude = true;
        } else if (parts[0] === 'src' && parts.length > 1) {
          // For src modules, check if the second part matches the requested module
          shouldInclude = parts[1] === options.module;
        }
        
        if (shouldInclude) {
          console.log(chalk.green(`  ✅ Including: ${relativePath}`));
        } else {
          console.log(chalk.gray(`  ❌ Excluding: ${relativePath}`));
        }
        
        return shouldInclude;
      });
      
      console.log(chalk.blue(`🔍 Filtered from ${beforeCount} to ${uniqueFiles.length} test files for module: ${options.module}`));
      
      if (uniqueFiles.length === 0) {
        console.log(chalk.yellow(`⚠️  No test files found for module: ${options.module}`));
        return [];
      }
    }
    
    // Filter by type if specified
    if (options.type) {
      uniqueFiles = uniqueFiles.filter(file => {
        const fileName = file.split(/[\/\\]/).pop();
        if (options.type === 'unit') {
          return !fileName.includes('integration');
        } else if (options.type === 'integration') {
          return fileName.includes('integration');
        }
        return true;
      });
    }
    
    console.log(chalk.green(`✅ Found ${uniqueFiles.length} test files`));
    
    // Group by module for better organization
    const filesByModule = groupFilesByModule(uniqueFiles);
    
    for (const [moduleName, files] of filesByModule) {
      console.log(chalk.cyan(`\n📁 ${moduleName}:`));
      files.forEach(file => {
        const relativePath = relative(__dirname, file);
        console.log(chalk.gray(`  └─ ${relativePath}`));
      });
    }
    
    // If filtering by module, show what will actually be executed
    if (options.module) {
      console.log(chalk.blue(`\n🎯 Will execute only ${uniqueFiles.length} test file(s) for module: ${options.module}`));
      console.log(chalk.blue('📋 Files to be executed:'));
      uniqueFiles.forEach(file => {
        const relativePath = relative(__dirname, file);
        console.log(chalk.blue(`  🎯 ${relativePath}`));
      });
    }
    
    return uniqueFiles;
  } catch (error) {
    console.error(chalk.red('Error discovering tests:'), error);
    return [];
  }
}

/**
 * Group test files by module
 */
function groupFilesByModule(files) {
  const modules = new Map();
  
  files.forEach(file => {
    const relativePath = relative(__dirname, file);
    const parts = relativePath.split(/[\/\\]/);
    
    let moduleName = 'root';
    if (parts[0] === 'src' && parts.length > 1) {
      moduleName = parts[1];
    } else if (parts[0] === 'proto') {
      moduleName = 'proto';
    }
    
    if (!modules.has(moduleName)) {
      modules.set(moduleName, []);
    }
    modules.get(moduleName).push(file);
  });
  
  return modules;
}

/**
 * Run a single test file
 */
async function runTestFile(testFile) {
  const relativePath = relative(__dirname, testFile);
  const moduleName = getModuleName(testFile);
  
  console.log(chalk.blue(`\n🧪 Running: ${relativePath}`));
  
  try {
    // Import and run the test file
    const testModule = await import(`file://${testFile}`);
    
    // Check if the module has a main test function
    let testFunction = null;
    if (testModule.default && typeof testModule.default === 'function') {
      testFunction = testModule.default;
    } else if (testModule.test && typeof testModule.test === 'function') {
      testFunction = testModule.test;
    } else if (testModule.runTests && typeof testModule.runTests === 'function') {
      testFunction = testModule.runTests;
    } else if (testModule.testIntegration && typeof testModule.testIntegration === 'function') {
      testFunction = testModule.testIntegration;
    } else if (testModule.runAllTests && typeof testModule.runAllTests === 'function') {
      testFunction = testModule.runAllTests;
    }
    
    if (testFunction) {
      const startTime = Date.now();
      await testFunction();
      const duration = Date.now() - startTime;
      
      console.log(chalk.green(`✅ ${relativePath} passed (${duration}ms)`));
      
      // Track results
      testResults.total++;
      testResults.passed++;
      
      if (!testResults.modules.has(moduleName)) {
        testResults.modules.set(moduleName, { passed: 0, failed: 0, total: 0 });
      }
      const moduleStats = testResults.modules.get(moduleName);
      moduleStats.passed++;
      moduleStats.total++;
      
      return { success: true, duration };
    } else {
      console.log(chalk.yellow(`⚠️  ${relativePath} - No test function found, skipping`));
      testResults.skipped++;
      return { success: false, reason: 'No test function found' };
    }
    
  } catch (error) {
    console.error(chalk.red(`❌ ${relativePath} failed:`), error.message);
    
    // Track results
    testResults.total++;
    testResults.failed++;
    testResults.errors.push({
      file: relativePath,
      error: error.message,
      stack: error.stack
    });
    
    if (!testResults.modules.has(moduleName)) {
      testResults.modules.set(moduleName, { passed: 0, failed: 0, total: 0 });
    }
    const moduleStats = testResults.modules.get(moduleName);
    moduleStats.failed++;
    moduleStats.total++;
    
    return { success: false, error };
  }
}

/**
 * Extract module name from file path
 */
function getModuleName(filePath) {
  const relativePath = relative(__dirname, filePath);
  const parts = relativePath.split(/[\/\\]/);
  
  if (parts[0] === 'src' && parts.length > 1) {
    return parts[1];
  } else if (parts[0] === 'proto') {
    return 'proto';
  } else {
    return 'root';
  }
}

/**
 * Print test execution summary
 */
function printTestSummary() {
  const duration = Date.now() - testResults.startTime;
  const successRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;
  
  console.log(chalk.bold.blue('\n📊 Test Summary\n'));
  
  // Show filter information if any
  if (options.module) {
    console.log(chalk.cyan(`🔍 Filtered by module: ${options.module}`));
  }
  if (options.type) {
    console.log(chalk.cyan(`🔍 Filtered by type: ${options.type}`));
  }
  console.log('');
  
  console.log(chalk.cyan(`Total Tests: ${testResults.total}`));
  console.log(chalk.green(`✅ Passed: ${testResults.passed}`));
  console.log(chalk.red(`❌ Failed: ${testResults.failed}`));
  console.log(chalk.yellow(`⏭️  Skipped: ${testResults.skipped}`));
  console.log(chalk.blue(`📈 Success Rate: ${successRate}%`));
  console.log(chalk.blue(`⏱️  Duration: ${duration}ms`));
  
  // Module breakdown
  if (testResults.modules.size > 0) {
    console.log(chalk.bold.blue('\n📁 Module Breakdown\n'));
    for (const [moduleName, stats] of testResults.modules) {
      const moduleSuccessRate = stats.total > 0 ? (stats.passed / stats.total * 100).toFixed(1) : 0;
      const statusColor = moduleSuccessRate === 100 ? 'green' : moduleSuccessRate >= 80 ? 'yellow' : 'red';
      
      console.log(chalk[statusColor](`${moduleName}: ${stats.passed}/${stats.total} passed (${moduleSuccessRate}%)`));
    }
  }
  
  // Error details
  if (testResults.errors.length > 0) {
    console.log(chalk.bold.red('\n❌ Test Failures\n'));
    testResults.errors.forEach((error, index) => {
      console.log(chalk.red(`${index + 1}. ${error.file}`));
      console.log(chalk.red(`   Error: ${error.error}`));
    });
  }
  
  // Final status
  if (testResults.failed === 0) {
    console.log(chalk.bold.green('\n🎉 All tests passed successfully!'));
    process.exit(0);
  } else {
    console.log(chalk.bold.red('\n💥 Some tests failed!'));
    process.exit(1);
  }
}

/**
 * Show available commands for running specific modules and test types
 */
function showAvailableCommands(testFiles) {
  // Don't show commands if we're already filtering (user knows what they're doing)
  if (options.module || options.type) {
    return;
  }
  
  console.log(chalk.bold.blue('💡 Available Commands:'));
  
  // Extract module names from test files
  const moduleNames = new Set();
  testFiles.forEach(file => {
    const relativePath = relative(__dirname, file);
    const parts = relativePath.split(/[\/\\]/);
    
    if (parts[0] === 'src' && parts.length > 1) {
      moduleNames.add(parts[1]);
    } else if (parts[0] === 'proto') {
      moduleNames.add('proto');
    }
  });
  
  const sortedModuleNames = Array.from(moduleNames).sort();
  
  if (sortedModuleNames.length > 0) {
    console.log(chalk.cyan('\n📁 Run specific modules:'));
    sortedModuleNames.forEach(moduleName => {
      console.log(chalk.cyan(`  npm run test:${moduleName}`));
    });
  }
  
  console.log(chalk.cyan('\n🎯 Run by test type:'));
  console.log(chalk.cyan('  npm run test:unit          # Unit tests only'));
  console.log(chalk.cyan('  npm run test:integration   # Integration tests only'));
  
  console.log(chalk.cyan('\n⚙️  Other options:'));
  console.log(chalk.cyan('  npm test                   # Run all tests'));
  console.log(chalk.cyan('  npm run test:verbose       # Verbose output'));
  console.log(chalk.cyan('  npm run test:watch         # Watch mode'));
  console.log(chalk.cyan('  npm run test:coverage      # With coverage'));
  
  console.log(chalk.cyan('\n🔧 Direct commands:'));
  console.log(chalk.cyan('  node test-runner.js --module=MODULE_NAME'));
  console.log(chalk.cyan('  node test-runner.js --type=unit|integration'));
  console.log(chalk.cyan('  node test-runner.js --verbose --watch'));
  
  console.log(chalk.cyan('\n🔄 Update scripts:'));
  console.log(chalk.cyan('  npm run update:test-scripts   # Auto-generate npm scripts'));
}

/**
 * Run all discovered tests
 */
async function runAllTests() {
  console.log(chalk.bold.blue('\n🚀 ZERA JS SDK - Test Runner\n'));
  console.log(chalk.cyan(`Project: ${__dirname}\n`));
  
  // Show current options
  if (options.module || options.type || options.verbose || options.watch || options.coverage) {
    console.log(chalk.blue('🔧 Active Options:'));
    if (options.module) console.log(chalk.blue(`  - Module: ${options.module}`));
    if (options.type) console.log(chalk.blue(`  - Type: ${options.type}`));
    if (options.verbose) console.log(chalk.blue(`  - Verbose: enabled`));
    if (options.watch) console.log(chalk.blue(`  - Watch: enabled`));
    if (options.coverage) console.log(chalk.blue(`  - Coverage: enabled`));
    console.log('');
  }
  
  const testFiles = await discoverTests();
  
  if (testFiles.length === 0) {
    console.log(chalk.yellow('⚠️  No test files found'));
    return;
  }
  
  // Show available commands at the top (only when not filtering and after discovery)
  if (!options.module && !options.type) {
    showAvailableCommands(testFiles);
    console.log(''); // Add spacing
  }
  
  console.log(chalk.blue(`\n🏃 Starting test execution...\n`));
  
  // Run tests sequentially to avoid conflicts
  for (const testFile of testFiles) {
    await runTestFile(testFile);
  }
  
  // Print summary
  printTestSummary();
}

// Main execution
console.log('Starting test runner...');
runAllTests().catch(error => {
  console.error(chalk.red('\n💥 Test runner failed:'), error);
  process.exit(1);
});
