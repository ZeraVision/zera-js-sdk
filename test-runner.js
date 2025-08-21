#!/usr/bin/env node

import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, relative, resolve } from 'path';
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
  clean: false,
  file: null  // Add support for specific file testing
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
  } else if (arg.endsWith('.js') && !arg.startsWith('--')) {
    // Treat .js files as specific file paths to test
    options.file = arg;
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
    // If a specific file is provided, use that
    if (options.file) {
      console.log(chalk.blue(`🎯 Testing specific file: ${options.file}`));
      const filePath = resolve(__dirname, options.file);
      return [filePath];
    }
    
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
 * Run a single test file with individual test function reporting
 */
async function runTestFile(testFile) {
  const relativePath = relative(__dirname, testFile);
  const moduleName = getModuleName(testFile);
  
  console.log(chalk.blue(`\n🧪 Running: ${relativePath}`));
  
  try {
    // Import the test module
    const testModule = await import(`file://${testFile}`);
    
    // Try to find individual test functions first
    const individualTests = [];
    const excludedKeys = ['default', 'test', 'runTests', 'testIntegration', 'runAllTests'];
    
    // Look for exported test functions
    for (const [key, value] of Object.entries(testModule)) {
      if (typeof value === 'function' && 
          key.startsWith('test') && 
          !excludedKeys.includes(key)) {
        individualTests.push({ name: key, func: value });
      }
    }
    
    let filePassedTests = 0;
    let fileFailedTests = 0;
    let fileTotalDuration = 0;
    let fileErrors = [];
    
         if (individualTests.length > 0) {
       // Run individual test functions
       console.log(chalk.cyan(`  Found ${individualTests.length} individual tests`));
       
               for (let i = 0; i < individualTests.length; i++) {
          const { name, func } = individualTests[i];
          const startTime = Date.now();
          
          // Show progress indicator
          console.log(chalk.cyan(`    [${i + 1}/${individualTests.length}] Running ${name}...`));
          
                    // Suppress console output for passed tests
          const originalConsoleLog = console.log;
          const originalConsoleError = console.error;
          let capturedOutput = [];
          
          try {
            // Capture console output during test execution
            console.log = (...args) => {
              capturedOutput.push(['log', ...args]);
            };
            console.error = (...args) => {
              capturedOutput.push(['error', ...args]);
            };
            
            // Add timeout protection (10 seconds per test)
            const testPromise = func();
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Test timeout after 10 seconds')), 10000);
            });
            
            await Promise.race([testPromise, timeoutPromise]);
            
            // Restore console and discard captured output for passed tests
            console.log = originalConsoleLog;
            console.error = originalConsoleError;
            
            const duration = Date.now() - startTime;
            fileTotalDuration += duration;
            filePassedTests++;
            
            // Show pass status (no logs for passed tests)
            console.log(chalk.green(`    ✅ ${name} passed (${duration}ms)`));
            
          } catch (error) {
            // Restore console immediately on error
            console.log = originalConsoleLog;
            console.error = originalConsoleError;
            const duration = Date.now() - startTime;
            fileTotalDuration += duration;
            fileFailedTests++;
            
            console.log(chalk.red(`    ❌ ${name} failed (${duration}ms)`));
            console.error(chalk.red(`       Error: ${error.message}`));
            
            // Show captured output for failed tests
            if (capturedOutput.length > 0) {
              console.log(chalk.yellow(`       Test output:`));
              capturedOutput.forEach(([type, ...args]) => {
                if (type === 'log') {
                  console.log(chalk.gray(`         ${args.join(' ')}`));
                } else if (type === 'error') {
                  console.error(chalk.red(`         ${args.join(' ')}`));
                }
              });
            }
            
            // Always show the full error details for debugging
            console.error(chalk.red(`       Full error details:`));
            console.error(chalk.red(`       Stack trace: ${error.stack}`));
            
            fileErrors.push({
              test: name,
              error: error.message,
              stack: error.stack
            });
          }
       }
       
       // Update test results tracking
       testResults.total += individualTests.length;
       testResults.passed += filePassedTests;
       testResults.failed += fileFailedTests;
      
      // Add file errors to global errors
      fileErrors.forEach(err => {
        testResults.errors.push({
          file: `${relativePath} -> ${err.test}`,
          error: err.error,
          stack: err.stack
        });
      });
      
      if (!testResults.modules.has(moduleName)) {
        testResults.modules.set(moduleName, { passed: 0, failed: 0, total: 0 });
      }
      const moduleStats = testResults.modules.get(moduleName);
      moduleStats.passed += filePassedTests;
      moduleStats.failed += fileFailedTests;
      moduleStats.total += individualTests.length;
      
      // File summary
      if (fileFailedTests === 0) {
        console.log(chalk.green(`✅ ${relativePath} completed: ${filePassedTests}/${individualTests.length} tests passed (${fileTotalDuration}ms)`));
        return { success: true, duration: fileTotalDuration, individualTests: individualTests.length, passed: filePassedTests, failed: fileFailedTests };
      } else {
        console.log(chalk.red(`❌ ${relativePath} completed: ${filePassedTests}/${individualTests.length} tests passed, ${fileFailedTests} failed (${fileTotalDuration}ms)`));
        return { success: false, duration: fileTotalDuration, individualTests: individualTests.length, passed: filePassedTests, failed: fileFailedTests };
      }
      
    } else {
      // Fallback to original behavior for files without individual test exports
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
        
        // Track results (as single test)
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
    }
    
  } catch (error) {
    console.error(chalk.red(`❌ ${relativePath} import failed:`), error.message);
    
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
  
  // Add global timeout (5 minutes)
  const globalTimeout = setTimeout(() => {
    console.error(chalk.red('❌ Test runner timed out after 5 minutes'));
    process.exit(1);
  }, 300000);
  
  try {
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
      clearTimeout(globalTimeout);
      return;
    }
    
    // Show available commands at the top (only when not filtering and after discovery)
    if (!options.module && !options.type && !options.file) {
      showAvailableCommands(testFiles);
      console.log(''); // Add spacing
    }
    
    console.log(chalk.blue(`\n🏃 Starting test execution...\n`));
    
         // Run tests sequentially to avoid conflicts
     for (let fileIndex = 0; fileIndex < testFiles.length; fileIndex++) {
       const testFile = testFiles[fileIndex];
       
       // Show file progress indicator
       console.log(chalk.bold.blue(`📁 File [${fileIndex + 1}/${testFiles.length}]: ${relative(__dirname, testFile)}`));
       
       try {
         const result = await runTestFile(testFile);
         if (result && !result.success) {
           // Continue running other tests even if one fails
           console.log(chalk.yellow(`⚠️  Continuing with remaining tests...\n`));
         }
       } catch (error) {
         console.error(chalk.red(`❌ Test file execution failed: ${error.message}`));
         console.error(chalk.red(`   File: ${testFile}`));
         console.error(chalk.red(`   Stack: ${error.stack}`));
         
         // Add to test results as failed
         testResults.total++;
         testResults.failed++;
         testResults.errors.push({
           file: relative(__dirname, testFile),
           error: error.message,
           stack: error.stack
         });
         
         // Continue with remaining tests
         console.log(chalk.yellow(`⚠️  Continuing with remaining tests...\n`));
       }
     }
     
          // Clear global timeout and print summary
     clearTimeout(globalTimeout);
     
     // Always show summary, even if there were errors
     try {
       printTestSummary();
     } catch (summaryError) {
       console.error(chalk.red('\n💥 Failed to print test summary:'), summaryError);
       console.error(chalk.red('This is a critical error - please report this bug.'));
     }
     
   } catch (error) {
     clearTimeout(globalTimeout);
     console.error(chalk.red('\n💥 Critical error in test runner:'), error);
     console.error(chalk.red('Stack trace:'), error.stack);
     
     // Try to show what we have so far
     try {
       console.log(chalk.bold.red('\n📊 Partial Test Results (due to error)'));
       console.log(chalk.cyan(`Total Tests: ${testResults.total}`));
       console.log(chalk.green(`✅ Passed: ${testResults.passed}`));
       console.log(chalk.red(`❌ Failed: ${testResults.failed}`));
       console.log(chalk.yellow(`⏭️  Skipped: ${testResults.skipped}`));
       
       if (testResults.errors.length > 0) {
         console.log(chalk.bold.red('\n❌ Test Failures:'));
         testResults.errors.forEach((err, index) => {
           console.log(chalk.red(`${index + 1}. ${err.file}`));
           console.log(chalk.red(`   Error: ${err.error}`));
         });
       }
     } catch (partialError) {
       console.error(chalk.red('\n💥 Even partial results failed to display:'), partialError);
     }
     
     throw error;
   }
}

// Main execution
console.log('Starting test runner...');

// Add global error handlers to catch any unhandled errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n💥 UNCAUGHT EXCEPTION:'), error);
  console.error(chalk.red('Stack trace:'), error.stack);
  console.error(chalk.red('\nTest runner crashed unexpectedly!'));
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\n💥 UNHANDLED PROMISE REJECTION:'), reason);
  console.error(chalk.red('Promise:'), promise);
  console.error(chalk.red('\nTest runner crashed due to unhandled promise rejection!'));
  process.exit(1);
});

// Ensure we always show what happened
process.on('exit', (code) => {
  if (code !== 0) {
    console.error(chalk.red(`\n💥 Test runner exited with code ${code}`));
    console.error(chalk.red('This usually means tests failed or crashed.'));
  }
});

runAllTests().catch(error => {
  console.error(chalk.red('\n💥 Test runner failed:'), error);
  console.error(chalk.red('Stack trace:'), error.stack);
  console.error(chalk.red('\nThis should not happen - please report this bug.'));
  process.exit(1);
});
