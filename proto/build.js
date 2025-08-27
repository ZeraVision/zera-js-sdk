#!/usr/bin/env node

import { execSync } from 'child_process';
import { rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

const GENERATED_DIR = join(__dirname, 'generated');

console.log('🚀 Building Zera Protocol Buffers...');

try {
  // Clean generated directory
  if (rmSync) {
    rmSync(GENERATED_DIR, { recursive: true, force: true });
  }
  mkdirSync(GENERATED_DIR, { recursive: true });

  // Use buf for modern generation
  console.log('📦 Using buf for modern protobuf generation...');
  execSync('buf generate', { stdio: 'inherit', cwd: __dirname });

  // Fallback to protoc if buf fails
  console.log('🔄 Fallback to protoc...');
  execSync('protoc --js_out=./generated --js_opt=import_style=es6 *.proto', { 
    stdio: 'inherit', 
    cwd: __dirname 
  });

  console.log('✅ Protocol Buffers built successfully!');
  console.log(`📁 Generated files in: ${GENERATED_DIR}`);

} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('\n💡 Make sure you have the following installed:');
  console.log('   - buf: npm install -g @bufbuild/buf');
  console.log('   - protoc: https://grpc.io/docs/protoc-installation/');
  process.exit(1);
}
