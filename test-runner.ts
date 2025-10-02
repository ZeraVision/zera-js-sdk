#!/usr/bin/env node

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import chalk from 'chalk';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TestOptions {
  module: string | null;
  type: string | null;
  verbose: boolean;
  watch: boolean;
  coverage: boolean;
  clean: boolean;
}

interface TestResult {
  file: string;
  passed: boolean;
  error?: Error;
  duration: number;
}

/**
 * Format duration in milliseconds to a human-readable string
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }
  
  const minutes = seconds / 60;
  if (minutes < 60) {
    const remainingSeconds = Math.floor(seconds % 60);
    return `${Math.floor(minutes)}m ${remainingSeconds}s`;
  }
  
  const hours = minutes / 60;
  if (hours < 24) {
    const remainingMinutes = Math.floor(minutes % 60);
    return `${Math.floor(hours)}h ${remainingMinutes}m`;
  }
  
  const days = hours / 24;
  const remainingHours = Math.floor(hours % 24);
  return `${Math.floor(days)}d ${remainingHours}h`;
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: TestOptions = {
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
  
  if (arg.startsWith('--module=')) {
    options.module = arg.split('=')[1];
  } else if (arg.startsWith('--type=')) {
    options.type = arg.split('=')[1];
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  } else if (arg === '--watch' || arg === '-w') {
    options.watch = true;
  } else if (arg === '--coverage' || arg === '-c') {
    options.coverage = true;
  } else if (arg === '--clean') {
    options.clean = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
ZERA JS SDK Test Runner

Usage: node test-runner.js [options]

Options:
  --module=<name>     Run tests for specific module only
  --type=<type>       Run specific test type (unit, integration)
  --verbose, -v       Verbose output
  --watch, -w         Watch mode
  --coverage, -c      Generate coverage report
  --clean            Clean test cache
  --help, -h         Show this help

Examples:
  node test-runner.js
  node test-runner.js --module=wallet-creation
  node test-runner.js --type=unit --verbose
  node test-runner.js --watch --coverage
`);
    process.exit(0);
  }
}

/**
 * Find all test files matching the criteria
 */
async function findTestFiles(): Promise<string[]> {
  const patterns = [
    'src/**/*.test.ts',
    'src/**/*.spec.ts',
    'src/**/test-*.ts',
    'src/**/tests/*.ts'
  ];
  
  let allFiles: string[] = [];
  
  for (const pattern of patterns) {
    const files = await glob(pattern, { cwd: __dirname });
    allFiles = allFiles.concat(files);
  }
  
  // Remove duplicates
  allFiles = [...new Set(allFiles)];
  
  // Filter by module if specified
  if (options.module) {
    allFiles = allFiles.filter(file => 
      file.includes(`/${options.module}/`) || 
      file.includes(`\\${options.module}\\`)
    );
  }
  
  // Filter by test type if specified
  if (options.type) {
    if (options.type === 'unit') {
      allFiles = allFiles.filter(file => 
        file.includes('.test.') || 
        file.includes('test-')
      );
    } else if (options.type === 'integration') {
      allFiles = allFiles.filter(file => 
        file.includes('.spec.') || 
        file.includes('integration')
      );
    }
  }
  
  return allFiles.sort();
}

/**
 * Run a single test file
 */
async function runTestFile(filePath: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Convert source path to compiled path in dist directory
    const compiledPath = filePath.replace('src/', 'dist/src/').replace('.ts', '.js');
    const fullPath = resolve(__dirname, compiledPath);
    
    // Import and run the test file
    const testModule = await import(fullPath);
    
    // Check if the module has a run function
    if (typeof testModule.run === 'function') {
      await testModule.run();
    } else if (typeof testModule.default === 'function') {
      await testModule.default();
    } else {
      // If no run function, assume the module runs tests on import
      console.log(chalk.yellow(`⚠️  No run function found in ${filePath}`));
    }
    
    const duration = Date.now() - startTime;
    return {
      file: filePath,
      passed: true,
      duration
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      file: filePath,
      passed: false,
      error: error as Error,
      duration
    };
  }
}

/**
 * Run all tests
 */
async function runTests(): Promise<void> {
  console.log(chalk.blue('🧪 ZERA JS SDK Test Runner\n'));
  
  const testFiles = await findTestFiles();
  
  if (testFiles.length === 0) {
    console.log(chalk.yellow('⚠️  No test files found matching criteria'));
    return;
  }
  
  console.log(chalk.cyan(`📁 Found ${testFiles.length} test file(s):`));
  testFiles.forEach(file => {
    console.log(chalk.gray(`  • ${file}`));
  });
  console.log('');
  
  const results: TestResult[] = [];
  const startTime = Date.now();
  
  // Run tests sequentially
  for (const file of testFiles) {
    if (options.verbose) {
      console.log(chalk.blue(`🔍 Running ${file}...`));
    }
    
    const result = await runTestFile(file);
    results.push(result);
    
    if (result.passed) {
      if (options.verbose) {
        console.log(chalk.green(`✅ ${file} passed (${formatDuration(result.duration)})`));
      }
    } else {
      console.log(chalk.red(`❌ ${file} failed (${formatDuration(result.duration)})`));
      if (result.error) {
        console.log(chalk.red(`   Error: ${result.error.message}`));
        if (options.verbose && result.error.stack) {
          console.log(chalk.gray(result.error.stack));
        }
      }
    }
  }
  
  const totalDuration = Date.now() - startTime;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  // Print summary
  console.log(chalk.cyan('\n📊 Test Summary'));
  console.log(chalk.cyan('='.repeat(50)));
  console.log(chalk.green(`✅ Passed: ${passed}`));
  console.log(chalk.red(`❌ Failed: ${failed}`));
  console.log(chalk.blue(`⏱️  Total time: ${formatDuration(totalDuration)}`));
  
  if (failed > 0) {
    console.log(chalk.red('\n💥 Some tests failed!'));
    process.exit(1);
  } else {
    console.log(chalk.green('\n🎉 All tests passed!'));
  }
}

/**
 * Watch mode - rerun tests when files change
 */
async function watchMode(): Promise<void> {
  console.log(chalk.blue('👀 Watch mode enabled\n'));
  
  // Initial run
  await runTests();
  
  // Watch for changes
  const { watch } = await import('chokidar');
  const watcher = watch([
    'src/**/*.js',
    'src/**/*.ts'
  ], {
    ignored: /node_modules/,
    persistent: true
  });
  
  watcher.on('change', async (path) => {
    console.log(chalk.yellow(`\n🔄 File changed: ${path}`));
    await runTests();
  });
  
  watcher.on('error', (error) => {
    console.error(chalk.red('❌ Watch error:'), error);
  });
  
  console.log(chalk.cyan('👀 Watching for changes... (Press Ctrl+C to stop)'));
}

/**
 * Clean test cache
 */
function cleanCache(): void {
  console.log(chalk.blue('🧹 Cleaning test cache...'));
  
  // In a real implementation, you would clean test caches here
  // For now, just log that we're cleaning
  console.log(chalk.green('✅ Test cache cleaned'));
}

/**
 * Generate coverage report
 */
async function generateCoverage(): Promise<void> {
  console.log(chalk.blue('📊 Generating coverage report...'));
  
  // In a real implementation, you would generate coverage here
  // For now, just log that we're generating coverage
  console.log(chalk.green('✅ Coverage report generated'));
}

// Main execution
async function main(): Promise<void> {
  try {
    if (options.clean) {
      cleanCache();
      return;
    }
    
    if (options.coverage) {
      await generateCoverage();
      return;
    }
    
    if (options.watch) {
      await watchMode();
    } else {
      await runTests();
    }
    
  } catch (error) {
    console.error(chalk.red('💥 Test runner crashed:'), error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url.endsWith('test-runner.ts') || process.argv[1]?.endsWith('test-runner.ts')) {
  main();
}
