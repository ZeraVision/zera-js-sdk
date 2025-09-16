/**
 * ACE (Authorized Currency Equivalent) Exchange Rate Fetcher
 * Fetches current exchange rates to convert USD fees to coin amounts
 */

import { Decimal } from '../utils/amount-utils.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * ACE Exchange Rate Service
 * Handles fetching and caching exchange rates for currency conversion
 */
export class ACEExchangeRateService {
  constructor(options = {}) {
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 3000; // 3 seconds default
    this.baseUrl = options.baseUrl || process.env.INDEXER_URL || 'https://indexer.zeravision.ca'; // Default API endpoint
    this.fallbackRates = options.fallbackRates || {
      '$ZRA+0000': 0.10,  // $0.10 per ZRA (fallback)
    };
    this.minimumRates = options.minimumRates || {
      '$ZRA+0000': 0.10,  // Minimum $0.10 per ZRA for fee evaluation (network enforced safeguard)
    };
  }

  /**
   * Get exchange rate for a currency
   * @param {string} currencyId - Currency ID (e.g., '$ZRA+0000')
   * @param {boolean} [useCache=true] - Whether to use cached rate
   * @returns {Promise<Decimal>} Exchange rate (USD per unit of currency)
   */
  async getExchangeRate(currencyId, useCache = true) {
    // Check cache first
    if (useCache && this.cache.has(currencyId)) {
      const cached = this.cache.get(currencyId);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return this.applyMinimumRateSafeguard(cached.rate, currencyId);
      }
    }

    try {
      // Fetch from API
      const rate = await this.fetchExchangeRateFromAPI(currencyId);
      const rateDecimal = new Decimal(rate);
      
      // Cache the result
      this.cache.set(currencyId, {
        rate: rateDecimal,
        timestamp: Date.now()
      });
      
      return this.applyMinimumRateSafeguard(rateDecimal, currencyId);
    } catch (error) {
      console.warn(`Failed to fetch exchange rate for "${currencyId}":`, error.message);
      
      // Use fallback rate
      const fallbackRate = this.getFallbackRate(currencyId);
      return this.applyMinimumRateSafeguard(new Decimal(fallbackRate), currencyId);
    }
  }

  /**
   * Fetch exchange rate from API
   * @param {string} currencyId - Currency ID
   * @returns {Promise<number>} Exchange rate
   */
  async fetchExchangeRateFromAPI(currencyId) {
    const url = `${this.baseUrl}/api/v1/exchange-rates/${encodeURIComponent(currencyId)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.rate || typeof data.rate !== 'number') {
      throw new Error('Invalid exchange rate data received');
    }
    
    return data.rate;
  }

  /**
   * Apply minimum rate safeguard for fee evaluation
   * Ensures that rates never go below the network-enforced minimum for fee calculations
   * @param {Decimal} rate - The exchange rate
   * @param {string} currencyId - Currency ID
   * @returns {Decimal} Rate with minimum safeguard applied
   */
  applyMinimumRateSafeguard(rate, currencyId) {
    const minimumRate = this.minimumRates[currencyId];
    if (minimumRate && rate.lt(minimumRate)) {
      console.warn(`Rate ${rate.toString()} for ${currencyId} below minimum ${minimumRate}, applying safeguard`);
      return new Decimal(minimumRate);
    }
    return rate;
  }

  /**
   * Get fallback exchange rate
   * @param {string} currencyId - Currency ID
   * @returns {number} Fallback rate
   */
  getFallbackRate(currencyId) {
    // First try to get exact contract ID match
    if (this.fallbackRates[currencyId]) {
      return this.fallbackRates[currencyId];
    }
    
    // Extract currency symbol from contract ID as fallback
    const match = currencyId.match(/^\$([A-Za-z]+)\+\d{4}$/);
    if (match) {
      const symbol = match[1];
      const symbolKey = `$${symbol}+0000`; // Try with +0000 suffix
      if (this.fallbackRates[symbolKey]) {
        return this.fallbackRates[symbolKey];
      }
    }
    
    // Default fallback
    return this.fallbackRates['$ZRA+0000'] || 0.10;
  }

  /**
   * Convert USD amount to currency amount
   * @param {Decimal|string|number} usdAmount - Amount in USD
   * @param {string} currencyId - Target currency ID
   * @returns {Promise<Decimal>} Amount in target currency
   */
  async convertUSDToCurrency(usdAmount, currencyId) {
    const usdDecimal = new Decimal(usdAmount);
    const exchangeRate = await this.getExchangeRate(currencyId);
    
    // Convert USD to currency: currencyAmount = usdAmount / exchangeRate
    return usdDecimal.div(exchangeRate);
  }

  /**
   * Convert currency amount to USD
   * @param {Decimal|string|number} currencyAmount - Amount in currency
   * @param {string} currencyId - Source currency ID
   * @returns {Promise<Decimal>} Amount in USD
   */
  async convertCurrencyToUSD(currencyAmount, currencyId) {
    const currencyDecimal = new Decimal(currencyAmount);
    const exchangeRate = await this.getExchangeRate(currencyId);
    
    // Convert currency to USD: usdAmount = currencyAmount * exchangeRate
    return currencyDecimal.mul(exchangeRate);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cached rates info
   * @returns {Object} Cache information
   */
  getCacheInfo() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([currencyId, data]) => ({
      currencyId,
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
 * @param {string} currencyId - Currency ID
 * @returns {Promise<Decimal>} Exchange rate
 */
export async function getExchangeRate(currencyId) {
  return aceExchangeService.getExchangeRate(currencyId);
}

/**
 * Convenience function to convert USD to currency
 * @param {Decimal|string|number} usdAmount - Amount in USD
 * @param {string} currencyId - Target currency ID
 * @returns {Promise<Decimal>} Amount in target currency
 */
export async function convertUSDToCurrency(usdAmount, currencyId) {
  return aceExchangeService.convertUSDToCurrency(usdAmount, currencyId);
}

/**
 * Convenience function to convert currency to USD
 * @param {Decimal|string|number} currencyAmount - Amount in currency
 * @param {string} currencyId - Source currency ID
 * @returns {Promise<Decimal>} Amount in USD
 */
export async function convertCurrencyToUSD(currencyAmount, currencyId) {
  return aceExchangeService.convertCurrencyToUSD(currencyAmount, currencyId);
}
