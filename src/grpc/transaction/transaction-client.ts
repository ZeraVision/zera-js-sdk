/**
 * Transaction Client
 * 
 * Pre-configured gRPC client for the ZERA transaction service.
 * Minimal wrapper around the generic gRPC client.
 */

import { createGenericGRPCClient, makeGRPCCall } from '../generic-grpc-client.js';
import type { GRPCConfig, GRPCClient } from '../../types/index.js';

/**
 * Transaction client interface
 */
export interface TransactionClient extends GRPCClient {
  /**
   * Submit a coin transaction
   */
  submitCoinTransaction(coinTxn: any): Promise<{ success: boolean; hash?: string }>;
}

/**
 * Create a pre-configured transaction client
 */
export function createTransactionClient(options: GRPCConfig = {}): TransactionClient {
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
    serviceName: 'TXNService',
    
    /**
     * Submit a coin transaction
     */
    async submitCoinTransaction(coinTxn: any): Promise<{ success: boolean; hash?: string }> {
      return await makeGRPCCall(this.client, 'Coin', coinTxn);
    }
  };
}
