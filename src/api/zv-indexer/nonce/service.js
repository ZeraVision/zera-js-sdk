/**
 * ZV-Indexer Nonce Service
 * 
 * This service handles nonce requests to the ZERA Vision Indexer via HTTP API.
 * Uses HTTP requests to get nonces from the indexer service.
 */

import Decimal from 'decimal.js';

/**
 * ZV-Indexer Nonce Service Class
 */
export class ZVIndexerNonceService {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://api.zerascan.io/v1';
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 10000; // 10 seconds default
  }

  /**
   * Get nonces for multiple addresses from ZV-Indexer
   * @param {Array<string>} addresses - Array of wallet addresses
   * @returns {Promise<Array<Decimal>>} Array of nonce values as Decimals
   */
  async getNonces(addresses) {
    if (!Array.isArray(addresses) || addresses.length === 0) {
      throw new Error('Addresses must be a non-empty array');
    }

    try {
      // Construct URL with comma-separated addresses
      const addressesParam = addresses.join(',');
      const url = `${this.baseUrl}/nonces?addresses=${encodeURIComponent(addressesParam)}`;
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!Array.isArray(data.nonces)) {
          throw new Error('Invalid response format: expected nonces array');
        }

        if (data.nonces.length !== addresses.length) {
          throw new Error(`Nonce count mismatch: expected ${addresses.length}, got ${data.nonces.length}`);
        }

        // Convert to Decimal objects and add 1
        const nonces = data.nonces.map(nonce => 
          new Decimal(nonce.toString()).add(1)
        );

        return nonces;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error getting nonces from ZV-Indexer:', error);
      throw new Error(`Failed to get nonces from ZV-Indexer: ${error.message}`);
    }
  }

  /**
   * Get nonce for a single address from ZV-Indexer
   * @param {string} address - Wallet address
   * @returns {Promise<Decimal>} Nonce value as Decimal
   */
  async getNonce(address) {
    const nonces = await this.getNonces([address]);
    return nonces[0];
  }
}

/**
 * Create a ZV-Indexer nonce service instance
 * @param {Object} options - Configuration options
 * @param {string} options.baseUrl - ZV-Indexer base URL (default: 'https://api.zerascan.io/v1')
 * @param {string} options.apiKey - API key for authentication
 * @param {number} options.timeout - Request timeout in milliseconds (default: 10000)
 * @returns {ZVIndexerNonceService} Service instance
 */
export function createZVIndexerNonceService(options = {}) {
  return new ZVIndexerNonceService(options);
}
