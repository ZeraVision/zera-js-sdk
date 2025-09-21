/**
 * Transaction Service
 * 
 * Handles transaction submission to the ZERA validator via gRPC.
 * Contains all business logic for transaction operations.
 */

import { createTransactionClient } from '../../grpc/transaction/transaction-client.js';

/**
 * Submit a coin transaction
 * @param {Object} coinTxn - CoinTXN protobuf message
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} Transaction hash
 */
export async function submitCoinTransaction(coinTxn, options = {}) {
  try {
    const client = createTransactionClient(options);
    const response = await client.submitCoinTransaction(coinTxn);
    
    // Return transaction hash on success
    return coinTxn.base?.hash ? 
      Buffer.from(coinTxn.base.hash).toString('hex') : 
      'Transaction sent successfully (no hash available)';
  } catch (error) {
    throw new Error(`Failed to submit coin transaction: ${error.message}`);
  }
}
