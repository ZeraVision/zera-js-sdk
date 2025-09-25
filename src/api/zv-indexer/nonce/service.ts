/**
 * ZV-Indexer Nonce Service
 * 
 * This service handles nonce requests to the ZERA Vision Indexer via HTTP API.
 * Uses HTTP requests to get nonces from the indexer service.
 */

import Decimal from 'decimal.js';

export interface ZVIndexerNonceServiceOptions {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * ZV-Indexer Nonce Service Class
 */
export class ZVIndexerNonceService {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(options: ZVIndexerNonceServiceOptions = {}) {
    this.baseUrl = options.baseUrl || 'https://api.zerascan.io/v1';
    if (options.apiKey !== undefined) {
      this.apiKey = options.apiKey;
    }
    this.timeout = options.timeout || 10000; // 10 seconds default
  }

  /**
   * Get nonces for multiple addresses from ZV-Indexer
   * @param addresses - Array of wallet addresses
   * @returns Array of nonce values as Decimals
   */
  async getNonces(addresses: string[]): Promise<Decimal[]> {
    if (!Array.isArray(addresses) || addresses.length === 0) {
      throw new Error('Addresses must be a non-empty array');
    }

    try {
      // Construct URL with comma-separated addresses
      const addressesParam = addresses.join(',');
      const url = `${this.baseUrl}/nonces?addresses=${encodeURIComponent(addressesParam)}`;
      
      // Prepare headers
      const headers: Record<string, string> = {
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

        const data = await response.json() as { nonces: string[] };
        
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
        if ((error as Error).name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error getting nonces from ZV-Indexer:', error);
      throw new Error(`Failed to get nonces from ZV-Indexer: ${(error as Error).message}`);
    }
  }

  /**
   * Get nonce for a single address from ZV-Indexer
   * @param address - Wallet address
   * @returns Nonce value as Decimal
   */
  async getNonce(address: string): Promise<Decimal> {
    const nonces = await this.getNonces([address]);
    const nonce = nonces[0];
    if (!nonce) {
      throw new Error('No nonce returned for address');
    }
    return nonce;
  }
}

/**
 * Create a ZV-Indexer nonce service instance
 * @param options - Configuration options
 * @returns Service instance
 */
export function createZVIndexerNonceService(options: ZVIndexerNonceServiceOptions = {}): ZVIndexerNonceService {
  return new ZVIndexerNonceService(options);
}
