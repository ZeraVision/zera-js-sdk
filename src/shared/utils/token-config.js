/**
 * Token Configuration
 * Defines decimal places for different tokens
 * 
 * This file contains the authoritative list of supported tokens
 * and their decimal places. If a token is not in this list,
 * an error will be thrown instead of using a default.
 */

/**
 * Token decimal places configuration
 * Key: Contract ID (e.g., '$ZRA+0000')
 * Value: Number of decimal places
 */
export const TOKEN_DECIMALS = {
  // ZERA Network tokens
  '$ZRA+0000': 9,  // ZERA token (main network token)
  
};

/**
 * Get the number of decimal places for a given token
 * @param {string} contractId - The contract ID of the token
 * @returns {number} The number of decimal places
 * @throws {Error} If the token is not supported
 */
export function getTokenDecimals(contractId) {
  if (!contractId || typeof contractId !== 'string') {
    throw new Error('Contract ID must be a non-empty string');
  }
  
  const decimals = TOKEN_DECIMALS[contractId];
  if (decimals === undefined) {
    throw new Error(`Unsupported token: ${contractId}. Supported tokens: ${Object.keys(TOKEN_DECIMALS).join(', ')}`);
  }
  
  return decimals;
}

/**
 * Add a new token configuration
 * @param {string} contractId - The contract ID of the token
 * @param {number} decimals - Number of decimal places
 * @throws {Error} If parameters are invalid
 */
export function addTokenConfig(contractId, decimals) {
  if (!contractId || typeof contractId !== 'string') {
    throw new Error('Contract ID must be a non-empty string');
  }
  
  if (typeof decimals !== 'number' || decimals < 0 || !Number.isInteger(decimals)) {
    throw new Error('Decimals must be a non-negative integer');
  }
  
  TOKEN_DECIMALS[contractId] = decimals;
}

/**
 * Check if a token is supported
 * @param {string} contractId - The contract ID of the token
 * @returns {boolean} True if the token is supported
 */
export function isTokenSupported(contractId) {
  return contractId in TOKEN_DECIMALS;
}

/**
 * Get all supported token contract IDs
 * @returns {string[]} Array of supported contract IDs
 */
export function getSupportedTokens() {
  return Object.keys(TOKEN_DECIMALS);
}
