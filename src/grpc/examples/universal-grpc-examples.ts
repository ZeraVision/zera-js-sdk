/**
 * Universal gRPC Service Architecture Examples
 * 
 * This demonstrates the new clean, service-based architecture for gRPC operations.
 * Shows usage of the restructured src/grpc organization.
 */

/**
 * Universal gRPC Service Architecture Examples
 * 
 * This demonstrates the clean, service-based architecture for gRPC operations.
 * Shows usage of the restructured src/grpc organization.
 */

import { getNonce, getNonces } from '../../api/validator/nonce/index.js';
import Decimal from 'decimal.js';
import { createTestingGRPCConfig } from '../../shared/utils/testing-defaults/index.js';

/**
 * Example 1: Using Functional Nonce Service
 */
export async function exampleFunctionalNonceService() {
  console.log('🔗 Example 1: Functional Nonce Service');
  
  const addresses = [
    '4Sj3Lzf5rKdgPaYHKSMJPduDcMf7PRtk4BDh2YrV7aJ59bAw65i6UcUnnLGpfMjM8vyGiRHqeZnvCf4ZMrCGjJJL',
    '5KJvsngHeMby884zrh6A5u6b4SqzZzAb'
  ];

  const options = createTestingGRPCConfig({
    host: 'localhost',
    port: 50053
  });

  try {
    // Get nonces with Decimal precision and +1 increment
    const nonces = await getNonces(addresses, options);
    
    console.log('✅ Functional nonces from validator:');
    nonces.forEach((nonce, index) => {
      console.log(`  Address ${index + 1}: ${nonce.toString()} (Decimal)`);
    });
    
    return nonces;
  } catch (error) {
    console.error('❌ Error with functional nonce service:', (error as Error).message);
    throw error;
  }
}

/**
 * Example 2: Service Architecture Overview
 */
export async function exampleServiceArchitecture() {
  console.log('🏗️ Example 2: Service Architecture Overview');
  
  console.log('📁 Clean src/grpc Structure:');
  console.log('  src/grpc/');
  console.log('  ├── base/');
  console.log('  │   └── universal-grpc-service.ts      # Base class');
  console.log('  ├── api/');
  console.log('  │   └── validator-api-client.ts        # Port 50053 base');
  console.log('  ├── transaction/');
  console.log('  │   └── transaction-client.ts          # Port 50052');
  console.log('  └── examples/');
  console.log('      └── universal-grpc-examples.ts     # This file');
  
  console.log('\n🔗 Service Hierarchy:');
  console.log('  UniversalGRPCService (base)');
  console.log('  ├── ValidatorAPIClient (50053)');
  console.log('  └── TransactionClient (50052)');
  
  return true;
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Running Universal gRPC Service Examples\n');
  
  try {
    await exampleFunctionalNonceService();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await exampleServiceArchitecture();
    
    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Examples failed:', (error as Error).message);
    process.exit(1);
  }
}