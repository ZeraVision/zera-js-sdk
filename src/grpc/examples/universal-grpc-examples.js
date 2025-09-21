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

import { createValidatorAPIService } from './api/validator-api-service.js';
import { getNonce, getNonces } from '../../api/validator/nonce/index.js';
import { createTransactionService } from './transaction/transaction-service.js';
import Decimal from 'decimal.js';

/**
 * Example 1: Using Universal Validator API Service
 */
export async function exampleUniversalValidatorAPI() {
  console.log('🔗 Example 1: Universal Validator API Service');
  
  // Create validator API service
  const validatorAPI = createValidatorAPIService({
    host: 'localhost',
    port: 50053,
    protocol: 'http'
  });

  const address = '4Sj3Lzf5rKdgPaYHKSMJPduDcMf7PRtk4BDh2YrV7aJ59bAw65i6UcUnnLGpfMjM8vyGiRHqeZnvCf4ZMrCGjJJL';

  try {
    // Get raw nonce (uint64)
    const rawNonce = await validatorAPI.getNonce(address);
    console.log(`✅ Raw nonce from validator: ${rawNonce}`);
    
    // Get multiple raw nonces
    const addresses = [address, '5KJvsngHeMby884zrh6A5u6b4SqzZzAb'];
    const rawNonces = await validatorAPI.getNonces(addresses);
    console.log(`✅ Raw nonces from validator: ${rawNonces.join(', ')}`);
    
    return rawNonces;
  } catch (error) {
    console.error('❌ Error with validator API:', error.message);
    throw error;
  }
}

/**
 * Example 2: Using Functional Nonce Service
 */
export async function exampleFunctionalNonceService() {
  console.log('🔗 Example 2: Functional Nonce Service');
  
  const addresses = [
    '4Sj3Lzf5rKdgPaYHKSMJPduDcMf7PRtk4BDh2YrV7aJ59bAw65i6UcUnnLGpfMjM8vyGiRHqeZnvCf4ZMrCGjJJL',
    '5KJvsngHeMby884zrh6A5u6b4SqzZzAb'
  ];

  const options = {
    host: 'localhost',
    port: 50053,
    protocol: 'http'
  };

  try {
    // Get nonces with Decimal precision and +1 increment
    const nonces = await getNonces(addresses, options);
    
    console.log('✅ Functional nonces from validator:');
    nonces.forEach((nonce, index) => {
      console.log(`  Address ${index + 1}: ${nonce.toString()} (Decimal)`);
    });
    
    return nonces;
  } catch (error) {
    console.error('❌ Error with functional nonce service:', error.message);
    throw error;
  }
}

/**
 * Example 3: Using Transaction Service
 */
export async function exampleTransactionService() {
  console.log('💰 Example 3: Transaction Service');
  
  // Create transaction service
  const transactionService = createTransactionService({
    host: 'routing.zerascan.io',
    port: 50052,
    protocol: 'http'
  });

  // Mock coin transaction (in real usage, this would be a proper CoinTXN)
  const mockCoinTxn = {
    base: {
      hash: Buffer.from('mock-hash-data', 'utf8')
    }
  };

  try {
    // Submit transaction using service
    const hash = await transactionService.submitCoinTransaction(mockCoinTxn);
    console.log(`✅ Transaction submitted successfully: ${hash}`);
    
    return hash;
  } catch (error) {
    console.error('❌ Error with transaction service:', error.message);
    throw error;
  }
}

/**
 * Example 4: Service Configuration Management
 */
export async function exampleServiceConfiguration() {
  console.log('⚙️ Example 4: Service Configuration Management');
  
  // Create service with initial config
  const validatorAPI = createValidatorAPIService({
    host: 'localhost',
    port: 50053,
    protocol: 'http'
  });

  console.log('📡 Initial configuration:');
  console.log(`  Host: ${validatorAPI.host}`);
  console.log(`  Port: ${validatorAPI.port}`);
  console.log(`  Protocol: ${validatorAPI.protocol}`);
  console.log(`  Base URL: ${validatorAPI.getBaseUrl()}`);

  // Update configuration dynamically
  validatorAPI.updateConfig({
    host: 'validator.example.com',
    port: 50054,
    protocol: 'https'
  });

  console.log('📡 Updated configuration:');
  console.log(`  Host: ${validatorAPI.host}`);
  console.log(`  Port: ${validatorAPI.port}`);
  console.log(`  Protocol: ${validatorAPI.protocol}`);
  console.log(`  Base URL: ${validatorAPI.getBaseUrl()}`);

  return validatorAPI;
}

/**
 * Example 5: Service Architecture Overview
 */
export async function exampleServiceArchitecture() {
  console.log('🏗️ Example 5: Service Architecture Overview');
  
  console.log('📁 Clean src/grpc Structure:');
  console.log('  src/grpc/');
  console.log('  ├── base/');
  console.log('  │   └── universal-grpc-service.js      # Base class');
  console.log('  ├── api/');
  console.log('  │   ├── validator-api-service.js      # Port 50053 base');
  console.log('  │   └── validator-nonce-service.js     # Nonce with Decimal');
  console.log('  ├── transaction/');
  console.log('  │   └── transaction-service.js         # Port 50052');
  console.log('  └── examples/');
  console.log('      └── universal-grpc-examples.js    # This file');
  
  console.log('\n🔗 Service Hierarchy:');
  console.log('  UniversalGRPCService (base)');
  console.log('  ├── ValidatorAPIService (50053) → ValidatorNonceService');
  console.log('  └── TransactionService (50052)');
  
  return true;
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Running Universal gRPC Service Examples\n');
  
  try {
    await exampleUniversalValidatorAPI();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await exampleFunctionalNonceService();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await exampleTransactionService();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await exampleServiceConfiguration();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await exampleServiceArchitecture();
    
    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Examples failed:', error.message);
    process.exit(1);
  }
}
