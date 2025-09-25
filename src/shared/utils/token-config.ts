/**
 * Token Configuration
 * Defines decimal places for different tokens
 * 
 * This file contains the authoritative list of supported tokens
 * and their decimal places. If a token is not in this list,
 * an error will be thrown instead of using a default.
 */

import type { ContractId } from '../../types/index.js';

/**
 * Token decimal places configuration
 * Key: Contract ID (e.g., '$ZRA+0000')
 * Value: Number of decimal places
 */
export const TOKEN_DECIMALS: Record<ContractId, number> = {
  // ZERA Network tokens
  '$ZRA+0000': 9,  // ZERA token (main network token)
} as const;

/**
 * Get the number of decimal places for a given token
 */
export function getTokenDecimals(contractId: ContractId): number {
  if (!contractId || typeof contractId !== 'string') {
    throw new Error('Contract ID must be a non-empty string');
  }
  
  const decimals = TOKEN_DECIMALS[contractId as keyof typeof TOKEN_DECIMALS];
  if (decimals === undefined) {
    throw new Error(`Unsupported token: ${contractId}. Supported tokens: ${Object.keys(TOKEN_DECIMALS).join(', ')}`);
  }
  
  return decimals;
}

/**
 * Add a new token configuration
 */
export function addTokenConfig(contractId: ContractId, decimals: number): void {
  if (!contractId || typeof contractId !== 'string') {
    throw new Error('Contract ID must be a non-empty string');
  }
  
  if (typeof decimals !== 'number' || decimals < 0 || !Number.isInteger(decimals)) {
    throw new Error('Decimals must be a non-negative integer');
  }
  
  (TOKEN_DECIMALS as any)[contractId] = decimals;
}

/**
 * Check if a token is supported
 */
export function isTokenSupported(contractId: ContractId): boolean {
  return contractId in TOKEN_DECIMALS;
}

/**
 * Get all supported token contract IDs
 */
export function getSupportedTokens(): ContractId[] {
  return Object.keys(TOKEN_DECIMALS) as ContractId[];
}

/**
 * Get token symbol from contract ID
 */
export function getTokenSymbol(contractId: ContractId): string {
  if (!contractId || typeof contractId !== 'string') {
    throw new Error('Contract ID must be a non-empty string');
  }
  
  // Extract symbol from contract ID format: $SYMBOL+XXXX
  const match = contractId.match(/^\$([A-Za-z]+)\+\d{4}$/);
  if (!match) {
    throw new Error(`Invalid contract ID format: ${contractId}`);
  }
  
  return match[1]!;
}

/**
 * Get token name from contract ID
 */
export function getTokenName(contractId: ContractId): string {
  const symbol = getTokenSymbol(contractId);
  
  // Convert symbol to name (basic implementation)
  const tokenNames: Record<string, string> = {
    'ZRA': 'ZERA',
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'USDC': 'USD Coin',
    'USDT': 'Tether'
  };
  
  return tokenNames[symbol] || symbol;
}

/**
 * Validate contract ID format
 */
export function validateContractId(contractId: any): contractId is ContractId {
  if (typeof contractId !== 'string') {
    return false;
  }
  
  // Contract ID format: $SYMBOL+XXXX
  const contractIdRegex = /^\$[A-Za-z]+\+\d{4}$/;
  return contractIdRegex.test(contractId);
}

/**
 * Create contract ID from symbol and identifier
 */
export function createContractId(symbol: string, identifier: string | number): ContractId {
  if (!symbol || typeof symbol !== 'string') {
    throw new Error('Symbol must be a non-empty string');
  }
  
  if (!identifier || (typeof identifier !== 'string' && typeof identifier !== 'number')) {
    throw new Error('Identifier must be a non-empty string or number');
  }
  
  const id = typeof identifier === 'number' ? identifier.toString() : identifier;
  
  // Validate identifier is 4 digits
  if (!/^\d{4}$/.test(id)) {
    throw new Error('Identifier must be exactly 4 digits');
  }
  
  // Validate symbol contains only letters
  if (!/^[A-Za-z]+$/.test(symbol)) {
    throw new Error('Symbol must contain only letters');
  }
  
  return `$${symbol}+${id}` as ContractId;
}
