/**
 * Transaction Client
 * 
 * Pre-configured gRPC client for the ZERA transaction service.
 * Minimal wrapper around the generic gRPC client.
 */

import { createGenericGRPCClient, makeGRPCCall } from '../generic-grpc-client.js';

/**
 * Create a pre-configured transaction client
 * @param {Object} options - Configuration options
 * @param {string} [options.host='routing.zerascan.io'] - Transaction service host
 * @param {number} [options.port=50052] - Transaction service port
 * @returns {Object} Configured transaction client
 */
export function createTransactionClient(options = {}) {
  const client = createGenericGRPCClient({
    protoFile: 'proto/txn.proto',
    packageName: 'zera_txn',
    serviceName: 'TXNService',
    host: options.host || 'routing.zerascan.io',
    port: options.port || 50052
  });

  return {
    client: client.client,
    proto: client.proto,
    host: client.host,
    port: client.port,
    
    /**
     * Submit a coin transaction
     * @param {Object} coinTxn - CoinTXN protobuf message
     * @returns {Promise<Object>} Transaction response
     */
    async submitCoinTransaction(coinTxn) {
      return await makeGRPCCall(this.client, 'Coin', coinTxn);
    }
  };
}
