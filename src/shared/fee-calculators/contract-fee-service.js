/**
 * Contract Fee Service
 * Handles contract fee lookup with API-first approach and hardcoded fallback
 * API calls are currently placeholders - will be implemented later
 */

import { CONTRACT_FEE_TYPE } from '../protobuf-enums.js';
import { UniversalFeeCalculator } from './universal-fee-calculator.js';
import { 
  getContractFeeConfig, 
  isFeeContractIdAllowed,
  DEFAULT_CONTRACT_FEE_CONFIG 
} from './contract-fee-constants.js';
import { Decimal } from '../utils/amount-utils.js';

/**
 * Contract Fee Service
 * Provides contract fee information with API-first lookup and fallback to hardcoded values
 */
export class ContractFeeService {
  constructor(options = {}) {
    this.apiEndpoint = options.apiEndpoint || 'https://api.zera.network/contracts';
    this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes
    this.cache = new Map();
    this.lastCacheCleanup = Date.now();
  }

  /**
   * Get contract fee information for a given contract ID
   * @param {string} contractId - Contract ID (e.g., '$BTC+1234')
   * @returns {Promise<Object>} Contract fee information
   */
  async getContractFeeInfo(contractId) {
    if (!contractId) {
      return DEFAULT_CONTRACT_FEE_CONFIG;
    }

    // Clean cache periodically
    this.cleanupCache();

    // Check cache first
    const cacheKey = `contract_fee_${contractId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Try API first
      const apiData = await this.fetchContractFeeFromAPI(contractId);
      if (apiData) {
        // Cache the API result
        this.cache.set(cacheKey, {
          data: apiData,
          timestamp: Date.now()
        });
        return apiData;
      }
    } catch (error) {
      console.warn(`Failed to fetch contract fee from API for ${contractId}:`, error.message);
    }

    // Fallback to hardcoded configuration
    const fallbackData = getContractFeeConfig(contractId);
    
    // Cache the fallback result (with shorter timeout)
    this.cache.set(cacheKey, {
      data: fallbackData,
      timestamp: Date.now()
    });

    return fallbackData;
  }

  /**
   * Fetch contract fee information from API
   * @param {string} contractId - Contract ID
   * @returns {Promise<Object|null>} Contract fee data or null if not found
   */
  async fetchContractFeeFromAPI(contractId) {
    try {
      // TODO: Replace with actual API call when implemented
      // For now, this is a placeholder that always returns null
      // The API will be called from the API folder later
      
      console.log(`[PLACEHOLDER] Would fetch contract fee from API for: ${contractId}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Always return null to use fallback for now
      return null;
      
      /* 
      // Future implementation will look like this:
      const response = await fetch(`${this.apiEndpoint}/${encodeURIComponent(contractId)}/fee`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Contract not found
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.normalizeAPIData(data);
      */
    } catch (error) {
      throw new Error(`API fetch failed: ${error.message}`);
    }
  }

  /**
   * Normalize API response data to standard format
   * @param {Object} apiData - Raw API data
   * @returns {Object} Normalized contract fee data
   */
  normalizeAPIData(apiData) {
    return {
      feeType: this.normalizeFeeType(apiData.feeType || apiData.fee_type),
      feeAmount: apiData.feeAmount || apiData.fee_amount || '0',
      allowedFeeIds: apiData.allowedFeeIds || apiData.allowed_fee_ids || ['$ZRA+0000']
    };
  }

  /**
   * Normalize fee type from API response
   * @param {string|number} feeType - Fee type from API
   * @returns {number} Normalized fee type
   */
  normalizeFeeType(feeType) {
    if (typeof feeType === 'number') {
      return feeType;
    }

    const typeMap = {
      'FIXED': CONTRACT_FEE_TYPE.FIXED,
      'PERCENTAGE': CONTRACT_FEE_TYPE.PERCENTAGE,
      'CUR_EQUIVALENT': CONTRACT_FEE_TYPE.CUR_EQUIVALENT,
      'NONE': CONTRACT_FEE_TYPE.NONE,
      'fixed': CONTRACT_FEE_TYPE.FIXED,
      'percentage': CONTRACT_FEE_TYPE.PERCENTAGE,
      'cur_equivalent': CONTRACT_FEE_TYPE.CUR_EQUIVALENT,
      'none': CONTRACT_FEE_TYPE.NONE
    };

    return typeMap[feeType] || CONTRACT_FEE_TYPE.NONE;
  }

  /**
   * Check if a fee contract ID is allowed for a given contract
   * @param {string} contractId - Contract ID
   * @param {string} feeContractId - Fee contract ID to check
   * @returns {Promise<boolean>} True if allowed
   */
  async isFeeContractIdAllowed(contractId, feeContractId) {
    const feeInfo = await this.getContractFeeInfo(contractId);
    return feeInfo.allowedFeeIds.includes(feeContractId);
  }

  /**
   * Calculate contract fee amount
   * @param {Object} params - Fee calculation parameters
   * @param {string} params.contractId - Contract ID
   * @param {string} params.transactionAmount - Transaction amount
   * @param {string} [params.feeContractId] - Fee contract ID (for validation)
   * @param {string} [params.transactionContractId] - Contract ID of the transaction instrument
   * @returns {Promise<Object>} Contract fee calculation result
   */
  async calculateContractFee(params) {
    const { contractId, transactionAmount, feeContractId, transactionContractId, exchangeRates = null } = params;

    // Get contract fee information
    const feeInfo = await this.getContractFeeInfo(contractId);

    // If fee contract ID is specified, validate it
    if (feeContractId && !feeInfo.allowedFeeIds.includes(feeContractId)) {
      throw new Error(`Fee contract ID ${feeContractId} is not allowed for contract ${contractId}. Allowed IDs: ${feeInfo.allowedFeeIds.join(', ')}`);
    }

    // Calculate fee based on type
    const transactionAmountDecimal = new Decimal(transactionAmount);
    const feeAmountDecimal = new Decimal(feeInfo.feeAmount);
    let calculatedFeeDecimal = new Decimal(0);

    switch (feeInfo.feeType) {
      case CONTRACT_FEE_TYPE.FIXED:
        calculatedFeeDecimal = feeAmountDecimal;
        break;
      
      case CONTRACT_FEE_TYPE.PERCENTAGE:
        // For percentage fees, we need to:
        // 1. Get the value of the transaction amount in the transaction instrument
        // 2. Calculate the percentage of that value
        // 3. Convert the result to the fee contract ID instrument
        
        // OPTIMIZATION: If transaction and fee contract IDs are the same, skip USD conversion
        const txContractId = transactionContractId || contractId;
        const feeContractIdToUse = feeContractId || feeInfo.allowedFeeIds[0];
        
        if (txContractId === feeContractIdToUse) {
          // Same currency - direct percentage calculation without USD conversion
          calculatedFeeDecimal = transactionAmountDecimal.mul(feeAmountDecimal).div(100);
        } else {
          // Different currencies - need USD conversion
          calculatedFeeDecimal = await this.calculatePercentageFee(
            transactionAmountDecimal,
            feeAmountDecimal,
            txContractId,
            feeContractIdToUse,
            exchangeRates
          );
        }
        break;
      
      case CONTRACT_FEE_TYPE.CUR_EQUIVALENT:
        // Currency equivalent fee - convert USD amount to fee contract ID
        calculatedFeeDecimal = await this.convertCurrencyEquivalentFee(
          feeAmountDecimal,
          feeContractId || feeInfo.allowedFeeIds[0],
          exchangeRates
        );
        break;
      
      case CONTRACT_FEE_TYPE.NONE:
      default:
        calculatedFeeDecimal = new Decimal(0);
        break;
    }

    return {
      fee: calculatedFeeDecimal.toString(),
      feeDecimal: calculatedFeeDecimal,
      contractId: contractId,
      contractFeeType: feeInfo.feeType,
      contractFeeAmount: feeInfo.feeAmount,
      feeContractId: feeContractId || feeInfo.allowedFeeIds[0],
      allowedFeeIds: feeInfo.allowedFeeIds,
      breakdown: {
        contractId: contractId,
        contractFeeType: feeInfo.feeType,
        contractFeeAmount: feeInfo.feeAmount,
        transactionAmount: transactionAmountDecimal.toString(),
        calculatedFee: calculatedFeeDecimal.toString(),
        feeContractId: feeContractId || feeInfo.allowedFeeIds[0],
        allowedFeeIds: feeInfo.allowedFeeIds,
        transactionContractId: transactionContractId || contractId
      }
    };
  }

  /**
   * Calculate percentage-based contract fee with instrument value conversion using cached rates
   * @param {Decimal} transactionAmount - Transaction amount
   * @param {Decimal} percentage - Percentage (e.g., 0.5 for 0.5%)
   * @param {string} transactionContractId - Contract ID of transaction instrument
   * @param {string} feeContractId - Contract ID to pay fee in
   * @param {Map} exchangeRates - Pre-fetched exchange rates map
   * @returns {Promise<Decimal>} Calculated fee amount
   */
  async calculatePercentageFee(transactionAmount, percentage, transactionContractId, feeContractId, exchangeRates = null) {
    try {
      // Step 1: Convert transaction amount to USD value using cached rate
      let transactionExchangeRate;
      if (exchangeRates && exchangeRates.has(transactionContractId)) {
        transactionExchangeRate = exchangeRates.get(transactionContractId);
      } else {
        console.warn(`Transaction exchange rate for ${transactionContractId} not found in pre-fetched rates, fetching separately`);
        transactionExchangeRate = await UniversalFeeCalculator.getExchangeRate(transactionContractId);
      }
      const transactionValueUSD = transactionAmount.mul(transactionExchangeRate);

      // Step 2: Calculate percentage of USD value
      const percentageValueUSD = transactionValueUSD.mul(percentage).div(100);

      // Step 3: Convert USD percentage value to fee contract ID using cached rate
      let feeExchangeRate;
      if (exchangeRates && exchangeRates.has(feeContractId)) {
        feeExchangeRate = exchangeRates.get(feeContractId);
      } else {
        console.warn(`Fee exchange rate for ${feeContractId} not found in pre-fetched rates, fetching separately`);
        feeExchangeRate = await UniversalFeeCalculator.getExchangeRate(feeContractId);
      }
      const feeAmount = percentageValueUSD.div(feeExchangeRate);

      return feeAmount;
    } catch (error) {
      console.warn(`Failed to calculate percentage fee with exchange rates: ${error.message}`);
      // Fallback: simple percentage calculation without conversion
      return transactionAmount.mul(percentage).div(100);
    }
  }

  /**
   * Convert currency equivalent fee from USD to target currency using cached rate
   * @param {Decimal} usdAmount - USD amount
   * @param {string} feeContractId - Target contract ID
   * @param {Map} exchangeRates - Pre-fetched exchange rates map
   * @returns {Promise<Decimal>} Converted amount
   */
  async convertCurrencyEquivalentFee(usdAmount, feeContractId, exchangeRates = null) {
    try {
      let exchangeRate;
      if (exchangeRates && exchangeRates.has(feeContractId)) {
        exchangeRate = exchangeRates.get(feeContractId);
      } else {
        console.warn(`Exchange rate for ${feeContractId} not found in pre-fetched rates, fetching separately`);
        exchangeRate = await UniversalFeeCalculator.getExchangeRate(feeContractId);
      }
      return usdAmount.div(exchangeRate);
    } catch (error) {
      console.warn(`Failed to convert currency equivalent fee: ${error.message}`);
      // Fallback: return original amount
      return usdAmount;
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    if (now - this.lastCacheCleanup < 60000) { // Clean up every minute
      return;
    }

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }

    this.lastCacheCleanup = now;
  }

  /**
   * Clear all cache entries
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      lastCleanup: this.lastCacheCleanup
    };
  }
}

// Create a default instance
export const contractFeeService = new ContractFeeService();

export default contractFeeService;
