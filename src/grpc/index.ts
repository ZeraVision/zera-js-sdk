import { createGenericGRPCClient, makeGRPCCall } from './generic-grpc-client.js';
import { createValidatorAPIClient } from './api/validator-api-client.js';
import { createTransactionClient } from './transaction/transaction-client.js';

/**
 * gRPC Infrastructure Module
 * 
 * This module provides gRPC client infrastructure for the ZERA Network.
 * It includes generic clients, specific service clients, and utility functions.
 */

// Service ports configuration
export const SERVICE_PORTS = {
  VALIDATOR: 50052,
  TRANSACTION: 50052,
  API: 50052
} as const;

// Service types
export const SERVICE_TYPES = {
  VALIDATOR: 'validator',
  TRANSACTION: 'transaction',
  API: 'api'
} as const;

// Re-export main functions
export { createGenericGRPCClient, makeGRPCCall } from './generic-grpc-client.js';
export { createValidatorAPIClient } from './api/validator-api-client.js';
export { createTransactionClient } from './transaction/transaction-client.js';

// Re-export types
export type { GRPCClientOptions, GRPCClient } from '../types/index.js';

/**
 * Create a gRPC client for validator API
 */
export function createValidatorClient(host: string = 'routing.zerascan.io', port: number = 50052): any {
  return createValidatorAPIClient({ host, port });
}

/**
 * Create a gRPC client for transaction services
 */
export function createTxnClient(host: string = 'routing.zerascan.io', port: number = 50052): any {
  return createTransactionClient({ host, port });
}

/**
 * Get service configuration
 */
export function getServiceConfig(serviceType: keyof typeof SERVICE_TYPES): {
  port: number;
  type: string;
  defaultHost: string;
} {
  return {
    port: SERVICE_PORTS[serviceType.toUpperCase() as keyof typeof SERVICE_PORTS],
    type: SERVICE_TYPES[serviceType],
    defaultHost: 'routing.zerascan.io'
  };
}

export default {
  createGenericGRPCClient,
  makeGRPCCall,
  createValidatorAPIClient,
  createTransactionClient,
  createValidatorClient,
  createTxnClient,
  getServiceConfig,
  SERVICE_PORTS,
  SERVICE_TYPES
};
