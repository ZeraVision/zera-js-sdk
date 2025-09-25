#!/usr/bin/env node

/**
 * Batch JavaScript to TypeScript Converter
 * 
 * This script converts all remaining JavaScript files to TypeScript
 * by adding basic type annotations and ensuring proper imports.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ConversionOptions {
  addTypes: boolean;
  fixImports: boolean;
  addInterfaces: boolean;
}

/**
 * Convert a JavaScript file to TypeScript
 */
function convertJsToTs(filePath: string, options: ConversionOptions = {
  addTypes: true,
  fixImports: true,
  addInterfaces: true
}): void {
  try {
    const content = readFileSync(filePath, 'utf8');
    let convertedContent = content;
    
    // Add basic type annotations for function parameters and returns
    if (options.addTypes) {
      // Convert function declarations
      convertedContent = convertedContent.replace(
        /export\s+(async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*{/g,
        (match, async, funcName, params) => {
          const returnType = async ? ': Promise<void>' : ': void';
          return `export ${async || ''}function ${funcName}(${params})${returnType} {`;
        }
      );
      
      // Convert arrow functions
      convertedContent = convertedContent.replace(
        /export\s+(const|let|var)\s+(\w+)\s*=\s*(async\s+)?\(([^)]*)\)\s*=>/g,
        (match, decl, varName, async, params) => {
          const returnType = async ? ': Promise<void>' : ': void';
          return `export ${decl} ${varName} = ${async || ''}(${params})${returnType} =>`;
        }
      );
      
      // Add type annotations for common patterns
      convertedContent = convertedContent.replace(
        /const\s+(\w+)\s*=\s*\[/g,
        'const $1: any[] = ['
      );
      
      convertedContent = convertedContent.replace(
        /const\s+(\w+)\s*=\s*{/g,
        'const $1: any = {'
      );
    }
    
    // Fix imports to use .js extensions (for ESM compatibility)
    if (options.fixImports) {
      convertedContent = convertedContent.replace(
        /from\s+['"]([^'"]+)\.js['"]/g,
        "from '$1.js'"
      );
    }
    
    // Add basic interface definitions for common objects
    if (options.addInterfaces) {
      const interfaces = `
// Basic type definitions
interface TestResult {
  success: boolean;
  error?: Error;
  duration: number;
}

interface TestOptions {
  verbose?: boolean;
  timeout?: number;
}

interface MockFunction {
  (...args: any[]): any;
  calls: any[][];
  called: boolean;
  callCount: number;
}

`;
      
      // Add interfaces at the top if not already present
      if (!convertedContent.includes('interface ')) {
        convertedContent = interfaces + convertedContent;
      }
    }
    
    // Write the converted file
    const tsFilePath = filePath.replace('.js', '.ts');
    writeFileSync(tsFilePath, convertedContent, 'utf8');
    
    console.log(`✅ Converted: ${basename(filePath)} → ${basename(tsFilePath)}`);
    
  } catch (error) {
    console.error(`❌ Failed to convert ${filePath}:`, (error as Error).message);
  }
}

/**
 * Find all JavaScript files to convert
 */
function findJsFiles(): string[] {
  const jsFiles: string[] = [];
  
  // Common patterns for JavaScript files to convert
  const patterns = [
    'src/**/*.js',
    'scripts/**/*.js'
  ];
  
  // For now, we'll manually specify the remaining files
  // In a real implementation, you'd use glob or similar
  const remainingFiles = [
    'src/api/examples/index.js',
    'src/api/test/index.js',
    'src/api/validator/nonce/examples/index.js',
    'src/api/validator/nonce/test/index.js',
    'src/api/validator/nonce/index.js',
    'src/api/zv-indexer/nonce/examples/index.js',
    'src/api/zv-indexer/nonce/test/index.js',
    'src/api/zv-indexer/nonce/index.js',
    'src/api/zv-indexer/nonce/service.js',
    'src/api/zv-indexer/rate/test/index.js',
    'src/coin-txn/tests/test-fee-system.js',
    'src/grpc/base/universal-grpc-service.js',
    'src/grpc/examples/integration-test.js',
    'src/grpc/examples/universal-grpc-examples.js',
    'src/shared/fee-calculators/test/test-auto-detection.js',
    'src/shared/fee-calculators/test/test-duration-formatter.js',
    'src/shared/fee-calculators/test/test-interface-fees.js',
    'src/shared/fee-calculators/test/test-unified-fee-calculation.js',
    'src/shared/utils/transaction-size-calculator.js',
    'src/shared/utils/transaction-utils.js',
    'src/wallet-creation/demos/complete-showcase.js',
    'src/wallet-creation/demos/enums-showcase.js',
    'src/wallet-creation/demos/unified-curves.js',
    'src/wallet-creation/examples/basic-usage.js',
    'src/wallet-creation/examples/wallet-storage-manager.js',
    'src/wallet-creation/tests/test-constants.js',
    'src/wallet-creation/tests/test-ed25519.js',
    'src/wallet-creation/tests/test-ed448.js',
    'src/wallet-creation/tests/test-enums.js',
    'src/wallet-creation/tests/test-shared.js',
    'scripts/update-test-scripts.js'
  ];
  
  for (const file of remainingFiles) {
    const fullPath = join(__dirname, '..', file);
    if (existsSync(fullPath)) {
      jsFiles.push(fullPath);
    }
  }
  
  return jsFiles;
}

/**
 * Main conversion function
 */
function main(): void {
  console.log('🔄 Starting batch JavaScript to TypeScript conversion...\n');
  
  const jsFiles = findJsFiles();
  
  if (jsFiles.length === 0) {
    console.log('✅ No JavaScript files found to convert');
    return;
  }
  
  console.log(`📁 Found ${jsFiles.length} JavaScript file(s) to convert:\n`);
  
  let converted = 0;
  let failed = 0;
  
  for (const file of jsFiles) {
    try {
      convertJsToTs(file);
      converted++;
    } catch (error) {
      console.error(`❌ Failed to convert ${file}:`, (error as Error).message);
      failed++;
    }
  }
  
  console.log(`\n📊 Conversion Summary:`);
  console.log(`✅ Converted: ${converted}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All files converted successfully!');
  } else {
    console.log('\n⚠️  Some files failed to convert');
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
