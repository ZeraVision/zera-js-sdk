#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Zera Protocol Buffer Example');
console.log('===============================\n');

try {
  // Check if generated files exist
  const generatedDir = join(__dirname, 'generated');
  const indexPath = join(generatedDir, 'index.js');
  
  console.log('📁 Checking generated files...');
  
  // Try to import generated files
  try {
    const generated = await import(indexPath);
    console.log('✅ Generated files loaded successfully!');
    console.log('📦 Available exports:', Object.keys(generated));
    
    // Example usage would go here
    console.log('\n💡 Example usage:');
    console.log('   import { CoinTXN, BaseTXN } from "./proto/generated/index.js";');
    
  } catch (importError) {
    console.log('⚠️  Generated files not found or not compatible');
    console.log('🔧 Run the build command first:');
    console.log('   npm run build:proto');
    console.log('\n📋 Build requirements:');
    console.log('   - buf CLI tool: npm install -g @bufbuild/buf');
    console.log('   - protoc compiler');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
