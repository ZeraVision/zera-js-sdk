/**
 * gRPC Infrastructure - Main Exports
 * 
 * This provides generic, reusable gRPC infrastructure.
 * All business logic is handled in the api/ folders.
 */

export { createGenericGRPCClient, makeGRPCCall } from './generic-grpc-client.js';
export { UniversalGRPCService } from './base/universal-grpc-service.js';

// Specific pre-configured clients
export { createValidatorAPIClient } from './api/validator-api-client.js';
export { createTransactionClient } from './transaction/transaction-client.js';

export { sanitizeGrpcPayload } from './utils/sanitize-grpc-payload.js';
export const SERVICE_PORTS = {
  VALIDATOR_API: 50053,
  TRANSACTION: 50052
};

export const SERVICE_TYPES = {
  VALIDATOR_API: 'validator-api',
  TRANSACTION: 'transaction'
};
