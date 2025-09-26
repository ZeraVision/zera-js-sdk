import { createCoinTXN, sendCoinTXN } from './transaction.js';
import type { CoinTXNInput, CoinTXNOutput, FeeConfig, GRPCConfig, GRPCOverrideConfig } from '../types/index.js';

/**
 * CoinTXN Module - Main Entry Point
 * 
 * This module provides functionality for creating and sending CoinTXN transactions
 * on the ZERA Network with automatic fee calculation and comprehensive validation.
 */

// Re-export main functions
export { createCoinTXN, sendCoinTXN } from './transaction.js';

// Re-export types
export type { CoinTXNInput, CoinTXNOutput, FeeConfig, GRPCConfig, GRPCOverrideConfig } from '../types/index.js';

/**
 * Create a CoinTXN transaction with automatic fee calculation
 * 
 * @param inputs - Array of input objects containing private keys and amounts
 * @param outputs - Array of output objects containing recipient addresses and amounts
 * @param contractId - Contract ID (e.g., '$ZRA+0000')
 * @param feeConfig - Optional fee configuration
 * @param baseMemo - Optional base memo for the transaction
 * @param grpcOverrideConfig - Optional gRPC override configuration
 * @returns Promise resolving to the created CoinTXN protobuf object
 */
export async function createTransaction(
  inputs: CoinTXNInput[],
  outputs: CoinTXNOutput[],
  contractId: string,
  feeConfig: FeeConfig = {},
  baseMemo: string = '',
  grpcOverrideConfig: GRPCOverrideConfig = {}
): Promise<any> {
  return await createCoinTXN(inputs, outputs, contractId, feeConfig, baseMemo, grpcOverrideConfig);
}

/**
 * Send a CoinTXN transaction to the network
 * 
 * @param coinTxn - The CoinTXN protobuf object to send
 * @param grpcConfig - Optional gRPC configuration
 * @returns Promise resolving to the transaction hash
 */
export async function sendTransaction(
  coinTxn: any,
  grpcConfig: GRPCConfig = {}
): Promise<string> {
  return await sendCoinTXN(coinTxn, grpcConfig);
}

/**
 * Create and send a CoinTXN transaction in one operation
 * 
 * @param inputs - Array of input objects
 * @param outputs - Array of output objects
 * @param contractId - Contract ID
 * @param feeConfig - Optional fee configuration
 * @param baseMemo - Optional base memo
 * @param grpcOverrideConfig - Optional gRPC override configuration
 * @param grpcConfig - Optional gRPC configuration
 * @returns Promise resolving to the transaction hash
 */
export async function createAndSendTransaction(
  inputs: CoinTXNInput[],
  outputs: CoinTXNOutput[],
  contractId: string,
  feeConfig: FeeConfig = {},
  baseMemo: string = '',
  grpcOverrideConfig: GRPCOverrideConfig = {},
  grpcConfig: GRPCConfig = {}
): Promise<string> {
  const coinTxn = await createCoinTXN(inputs, outputs, contractId, feeConfig, baseMemo, grpcOverrideConfig);
  return await sendCoinTXN(coinTxn, grpcConfig);
}

export default {
  createCoinTXN,
  sendCoinTXN,
  createTransaction,
  sendTransaction,
  createAndSendTransaction
};
