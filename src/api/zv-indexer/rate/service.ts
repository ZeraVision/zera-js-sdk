/**
 * ZV-Indexer Rate Service
 * 
 * Handles fetching exchange rates from the ZV-Indexer API.
 * This service ONLY fetches data and feeds it to the rate handler.
 */

import { Decimal } from '../../../shared/utils/amount-utils.js';
import { processRate } from '../../handler/rate/service.js';
import dotenv from 'dotenv';
import type { ContractId, AmountInput } from '../../../types/index.js';

// Load environment variables
dotenv.config();

/**
 * ZV-Indexer rate service options
 */
export interface ZVIndexerRateServiceOptions {
  baseUrl?: string;
  requestTimeout?: number;
  apiKey?: string;
}

/**
 * ZV-Indexer Rate Service
 * Handles fetching exchange rates from the ZV-Indexer API and feeding them to the rate handler
 */
export class ZVIndexerRateService {
  private baseUrl: string;
  private requestTimeout: number;
  private apiKey: string | undefined;

  constructor(options: ZVIndexerRateServiceOptions = {}) {
    this.baseUrl = options.baseUrl || process.env.INDEXER_URL || 'https://api.zerascan.io'; // Default API endpoint
    this.requestTimeout = options.requestTimeout || 2500; // 2.5 second timeout
    this.apiKey = options.apiKey || process.env.INDEXER_API_KEY;
  }

  /**
   * Get exchange rate for a currency from ZV-Indexer
   * Fetches data and feeds it to the rate handler
   */
  async getExchangeRate(contractId: ContractId): Promise<Decimal> {
    try {
      // Fetch from ZV-Indexer API
      const rate = await this.fetchExchangeRateFromAPI(contractId);
      
      // Feed the rate to the handler for processing and caching
      return await processRate(contractId, rate, 'zv-indexer');
    } catch (error) {
      throw new Error(`Failed to fetch exchange rate for "${contractId}" from ZV-Indexer: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch exchange rate from ZV-Indexer API
   */
  async fetchExchangeRateFromAPI(contractId: ContractId): Promise<number> {
    const url = `${this.baseUrl}/api/v1/exchange-rates/${encodeURIComponent(contractId)}`;
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add API key if available
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.rate || typeof data.rate !== 'number') {
        throw new Error('Invalid exchange rate data received');
      }
      
      return data.rate;
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === 'AbortError') {
        throw new Error(`Request timeout after ${this.requestTimeout}ms`);
      }
      throw error;
    }
  }

}

/**
 * Default ZV-Indexer rate service instance
 */
export const zvIndexerRateService = new ZVIndexerRateService();

/**
 * Convenience function to get exchange rate from ZV-Indexer
 */
export async function getExchangeRate(contractId: ContractId): Promise<Decimal> {
  return zvIndexerRateService.getExchangeRate(contractId);
}
