/**
 * Transaction Client
 * 
 * Pre-configured gRPC client for the ZERA transaction service.
 * Minimal wrapper around the generic gRPC client.
 */

import { createGenericGRPCClient, makeGRPCCall } from '../generic-grpc-client.js';
import type { GRPCConfig, GRPCClient } from '../../types/index.js';
import type { CoinTXN } from '../../../proto/generated/txn_pb.js';

/**
 * Transaction client interface
 */
export interface TransactionClient extends GRPCClient {
  /**
   * Submit a coin transaction
   */
  submitCoinTransaction(coinTxn: CoinTXN): Promise<{ success: boolean; hash?: string }>;
}

/**
 * Transaction Client Class
 */
class TransactionClientImpl implements TransactionClient {
  public client: any;
  public proto: Record<string, unknown>;
  public host: string;
  public port: number;
  public serviceName: string;

  constructor(options: GRPCConfig = {}) {
    const grpcClient = createGenericGRPCClient({
      protoFile: 'proto/txn.proto',
      packageName: 'zera_txn',
      serviceName: 'TXNService',
      host: options.host || 'routing.zerascan.io',
      port: options.port || 50052
    });

    this.client = grpcClient.client;
    this.proto = grpcClient.proto;
    this.host = grpcClient.host;
    this.port = grpcClient.port;
    this.serviceName = 'TXNService';
  }

  /**
   * Submit a coin transaction
   */
  async submitCoinTransaction(coinTxn: CoinTXN): Promise<{ success: boolean; hash?: string }> {
    return await makeGRPCCall(this.client, 'Coin', coinTxn);
  }
}

/**
 * Create a pre-configured transaction client
 */
export function createTransactionClient(options: GRPCConfig = {}): TransactionClient {
  return new TransactionClientImpl(options);
}
