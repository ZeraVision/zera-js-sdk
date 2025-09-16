/**
 * Nonce Management Module
 * 
 * This module handles nonce generation and retrieval for transactions.
 * Uses Decimal for internal consistency, converts to bigint for protobuf.
 * Currently uses a template implementation that generates unique nonces.
 * Will be replaced with GRPC protobuf nonce request or API request.
 */

import Decimal from 'decimal.js';

// Simple in-memory nonce counter for template implementation
const nonceCounters = new Map();

/**
 * Get nonce for transaction authentication
 * @param {string} address - Wallet address
 * @param {string} contractId - Contract ID
 * @returns {Promise<Decimal>} Nonce value as Decimal
 */
export async function getNonce(address, contractId) {
  // TODO: Replace with actual GRPC protobuf nonce request or API call
  // For now, generate unique nonces for testing purposes
  
  const key = `${address}-${contractId}`;
  const currentNonce = nonceCounters.get(key) || 0;
  const nextNonce = currentNonce + 1;
  nonceCounters.set(key, nextNonce);
  
  return new Decimal(nextNonce);
}

/**
 * Get multiple nonces for multi-input transactions
 * @param {Array<string>} addresses - Array of wallet addresses
 * @param {string} contractId - Contract ID
 * @returns {Promise<Array<Decimal>>} Array of nonce values as Decimals
 */
export async function getNonces(addresses, contractId) {
  const nonces = [];
  for (const address of addresses) {
    const nonce = await getNonce(address, contractId);
    nonces.push(nonce);
  }
  return nonces;
}

/**
 * Convert Decimal nonce to bigint for protobuf
 * @param {Decimal} nonce - Nonce as Decimal
 * @returns {bigint} Nonce as bigint for protobuf
 */
export function nonceToBigInt(nonce) {
  return BigInt(nonce.toFixed(0)); // Convert to integer string, then to bigint
}
