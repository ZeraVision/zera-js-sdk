/**
 * ACE Exchange Rate Service
 * 
 * Handles fetching and caching exchange rates for currency conversion.
 * Moved to structured organization.
 */

import { Decimal } from '../../../shared/utils/amount-utils.js';
import dotenv from 'dotenv';
import type { ContractId, AmountInput } from '../../../types/index.js';

// Load environment variables
dotenv.config();

/**
 * Exchange rate service options
 */
export interface ExchangeRateServiceOptions {
  cacheTimeout?: number;
  baseUrl?: string;
  fallbackRates?: Record<string, number>;
  minimumRates?: Record<string, number>;
}

/**
 * Fallback rate information
 */
export interface FallbackRateInfo {
  rate: number;
  source: 'exact_match' | 'symbol_match';
  sourceKey: string;
}

/**
 * Cache entry
 */
interface CacheEntry {
  rate: Decimal;
  timestamp: number;
}

/**
 * Cache information
 */
export interface CacheInfo {
  size: number;
  timeout: number;
  entries: Array<{
    contractId: string;
    rate: string;
    age: number;
    expired: boolean;
  }>;
}

/**
 * ACE Exchange Rate Service
 * Handles fetching and caching exchange rates for currency conversion
 */
export class ACEExchangeRateService {
  private cache: Map<string, CacheEntry>;
  private cacheTimeout: number;
  private baseUrl: string;
  private fallbackRates: Record<string, number>;
  private minimumRates: Record<string, number>;

  constructor(options: ExchangeRateServiceOptions = {}) {
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 3000; // 3 seconds default
    this.baseUrl = options.baseUrl || process.env.INDEXER_URL || 'https://api.zerascan.io'; // Default API endpoint
    this.fallbackRates = options.fallbackRates || {
      '$ZRA+0000': 0.10,  // $0.10 per ZRA (fallback)
    };
    this.minimumRates = options.minimumRates || {
      '$ZRA+0000': 0.10,  // Minimum $0.10 per ZRA for fee evaluation (network enforced safeguard)
    };
  }

  /**
   * Get exchange rate for a currency
   */
  async getExchangeRate(contractId: ContractId, useCache: boolean = true): Promise<Decimal> {
    // Check cache first
    if (useCache && this.cache.has(contractId)) {
      const cached = this.cache.get(contractId)!;
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return this.applyMinimumRateSafeguard(cached.rate, contractId);
      }
    }

    try {
      // Fetch from API
      const rate = await this.fetchExchangeRateFromAPI(contractId);
      const rateDecimal = new Decimal(rate);
      
      // Cache the result
      this.cache.set(contractId, {
        rate: rateDecimal,
        timestamp: Date.now()
      });
      
      return this.applyMinimumRateSafeguard(rateDecimal, contractId);
    } catch (error) {
      // Get detailed fallback rate information
      const fallbackInfo = this.getFallbackRateInfo(contractId);
      
      // If no fallback is available, throw an error
      if (!fallbackInfo) {
        throw new Error(`No exchange rate available for "${contractId}" and no fallback rate configured. Please add a fallback rate for this contract ID or ensure the API is accessible.`);
      }
      
      const fallbackRateDecimal = this.applyMinimumRateSafeguard(new Decimal(fallbackInfo.rate), contractId);
      
      // Enhanced error message with detailed fallback information
      let sourceDescription: string;
      switch (fallbackInfo.source) {
        case 'exact_match':
          sourceDescription = `exact match for ${fallbackInfo.sourceKey}`;
          break;
        case 'symbol_match':
          sourceDescription = `symbol match using ${fallbackInfo.sourceKey}`;
          break;
        default:
          sourceDescription = 'unknown source';
      }
      
      const errorMessage = `Failed to fetch exchange rate for "${contractId}": ${(error as Error).message}. Using fallback rate: ${fallbackRateDecimal.toString()} USD per ${contractId} (source: ${sourceDescription})`;
      console.warn(errorMessage);
      
      return fallbackRateDecimal;
    }
  }

  /**
   * Fetch exchange rate from API
   */
  async fetchExchangeRateFromAPI(contractId: ContractId): Promise<number> {
    const url = `${this.baseUrl}/api/v1/exchange-rates/${encodeURIComponent(contractId)}`;
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5 second timeout
    
    try {
      const response = await fetch(url, {
        signal: controller.signal
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
        throw new Error('Request timeout after 2.5 seconds');
      }
      throw error;
    }
  }

  /**
   * Apply minimum rate safeguard for fee evaluation
   * Ensures that rates never go below the network-enforced minimum for fee calculations
   */
  applyMinimumRateSafeguard(rate: Decimal, contractId: ContractId): Decimal {
    const minimumRate = this.minimumRates[contractId];
    if (minimumRate && rate.lt(minimumRate)) {
      console.warn(`Rate ${rate.toString()} for ${contractId} below minimum ${minimumRate}, applying safeguard`);
      return new Decimal(minimumRate);
    }
    return rate;
  }

  /**
   * Get fallback rate for a contract ID with detailed information
   */
  getFallbackRateInfo(contractId: ContractId): FallbackRateInfo | null {
    // First try to get exact contract ID match
    if (this.fallbackRates[contractId]) {
      return {
        rate: this.fallbackRates[contractId],
        source: 'exact_match',
        sourceKey: contractId
      };
    }
    
    // Extract currency symbol from contract ID as fallback
    const match = contractId.match(/^\$([A-Za-z]+)\+\d{4}$/);
    if (match) {
      const symbol = match[1];
      const symbolKey = `$${symbol}+0000`; // Try with +0000 suffix
      if (this.fallbackRates[symbolKey]) {
        return {
          rate: this.fallbackRates[symbolKey],
          source: 'symbol_match',
          sourceKey: symbolKey
        };
      }
    }
    
    // No fallback available - return null to indicate no fallback
    return null;
  }

  /**
   * Convert USD amount to currency amount
   */
  async convertUSDToCurrency(usdAmount: AmountInput, contractId: ContractId): Promise<Decimal> {
    const usdDecimal = new Decimal(usdAmount);
    const exchangeRate = await this.getExchangeRate(contractId);
    
    // Convert USD to currency: currencyAmount = usdAmount / exchangeRate
    return usdDecimal.div(exchangeRate);
  }

  /**
   * Convert currency amount to USD
   */
  async convertCurrencyToUSD(currencyAmount: AmountInput, contractId: ContractId): Promise<Decimal> {
    const currencyDecimal = new Decimal(currencyAmount);
    const exchangeRate = await this.getExchangeRate(contractId);
    
    // Convert currency to USD: usdAmount = currencyAmount * exchangeRate
    return currencyDecimal.mul(exchangeRate);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached rates info
   */
  getCacheInfo(): CacheInfo {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([contractId, data]) => ({
      contractId,
      rate: data.rate.toString(),
      age: now - data.timestamp,
      expired: now - data.timestamp >= this.cacheTimeout
    }));
    
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      entries
    };
  }
}

/**
 * Default ACE exchange rate service instance
 */
export const aceExchangeService = new ACEExchangeRateService();

/**
 * Convenience function to get exchange rate
 */
export async function getExchangeRate(contractId: ContractId): Promise<Decimal> {
  return aceExchangeService.getExchangeRate(contractId);
}

/**
 * Convenience function to convert USD to currency
 */
export async function convertUSDToCurrency(usdAmount: AmountInput, contractId: ContractId): Promise<Decimal> {
  return aceExchangeService.convertUSDToCurrency(usdAmount, contractId);
}

/**
 * Convenience function to convert currency to USD
 */
export async function convertCurrencyToUSD(currencyAmount: AmountInput, contractId: ContractId): Promise<Decimal> {
  return aceExchangeService.convertCurrencyToUSD(currencyAmount, contractId);
}
