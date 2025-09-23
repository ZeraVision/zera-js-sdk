/**
 * Validator API Client
 * 
 * Pre-configured gRPC client for the ZERA validator API service.
 * Minimal wrapper around the generic gRPC client.
 */

import { createGenericGRPCClient, makeGRPCCall } from '../generic-grpc-client.js';
import bs58 from 'bs58';

/**
 * Create a pre-configured validator API client
 * @param {Object} options - Configuration options
 * @param {string} [options.host='routing.zerascan.io'] - Validator host
 * @param {number} [options.port=50053] - Validator port
 * @returns {Object} Configured API client
 */
export function createValidatorAPIClient(options = {}) {
  const client = createGenericGRPCClient({
    protoFile: 'proto/api.proto',
    packageName: 'zera_api',
    serviceName: 'APIService',
    host: options.host || 'routing.zerascan.io',
    port: options.port || 50053
  });

  return {
    client: client.client,
    proto: client.proto,
    host: client.host,
    port: client.port,
    
    /**
     * Get nonce for an address
     * @param {string} address - Base58 encoded address
     * @returns {Promise<Object>} Nonce response
     */
    async getNonce(address) {
      const request = {
        walletAddress: bs58.decode(address), // Convert base58 to bytes
        encoded: false
      };
      return await makeGRPCCall(this.client, 'Nonce', request);
    }
  };
}

