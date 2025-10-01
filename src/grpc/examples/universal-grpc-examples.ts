/**
 * gRPC Client Creation Patterns
 * 
 * This demonstrates different patterns for creating and configuring gRPC clients.
 * Focuses on infrastructure patterns rather than business logic.
 */

import { 
  createGenericGRPCClient,
  createTypedGRPCClient
} from '../generic-grpc-client.js';
import { 
  createValidatorAPIClient
} from '../api/validator-api-client.js';
import { 
  createTransactionClient
} from '../transaction/transaction-client.js';
import { TESTING_GRPC_CONFIG } from '../../shared/utils/testing-defaults/index.js';

/**
 * Example 1: Generic gRPC Client Creation
 */
export async function exampleGenericGRPCClient() {
  console.log('🔧 Example 1: Generic gRPC Client Creation');
  
  try {
    // Create a generic gRPC client for any proto service
    const genericClient = createGenericGRPCClient({
      protoFile: 'proto/api.proto',
      packageName: 'zera_api',
      serviceName: 'APIService',
      host: TESTING_GRPC_CONFIG.host,
      port: 50053
    });
    
    console.log('✅ Generic gRPC client created:');
    console.log(`  Host: ${genericClient.host}`);
    console.log(`  Port: ${genericClient.port}`);
    console.log(`  Service: ${genericClient.serviceName}`);
    console.log(`  Available methods: ${Object.keys(genericClient.client).join(', ')}`);
    
    return genericClient;
  } catch (error) {
    console.error('❌ Error creating generic gRPC client:', (error as Error).message);
    throw error;
  }
}

/**
 * Example 2: Pre-configured Service Clients
 */
export async function examplePreConfiguredClients() {
  console.log('🔧 Example 2: Pre-configured Service Clients');
  
  try {
    // Create validator API client (pre-configured for validator operations)
    const validatorClient = createValidatorAPIClient({
      host: TESTING_GRPC_CONFIG.host,
      port: 50053,
      timeout: 10000
    });
    
    console.log('✅ Validator API client created:');
    console.log(`  Host: ${validatorClient.host}`);
    console.log(`  Port: ${validatorClient.port}`);
    console.log(`  Service: ${validatorClient.serviceName}`);
    
    // Create transaction client (pre-configured for transaction operations)
    const transactionClient = createTransactionClient({
      host: TESTING_GRPC_CONFIG.host,
      port: 50052,
      timeout: 15000
    });
    
    console.log('✅ Transaction client created:');
    console.log(`  Host: ${transactionClient.host}`);
    console.log(`  Port: ${transactionClient.port}`);
    console.log(`  Service: ${transactionClient.serviceName}`);
    
    return { validatorClient, transactionClient };
  } catch (error) {
    console.error('❌ Error creating pre-configured clients:', (error as Error).message);
    throw error;
  }
}
