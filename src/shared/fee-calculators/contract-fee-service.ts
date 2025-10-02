/**
 * Contract Fee Service
 * Handles contract fee lookup with API-first approach and hardcoded fallback
 * API calls are currently placeholders - will be implemented later
 */

import type { ContractId } from '../../types/index.js';
import { CONTRACT_FEE_TYPE } from '../protobuf/index.js';
import { Decimal } from '../utils/amount-utils.js';

import { 
  getContractFeeConfig, 
  DEFAULT_CONTRACT_FEE_CONFIG
} from './contract-fee-constants.js';
import { ExchangeRateService } from './exchange-rate-service.js';
import type { 
  ContractFeeConfig,
  ContractFeeServiceOptions,
  ContractFeeCalculationParams,
  ContractFeeCalculationResult
} from './types.js';


/**
 * Cache entry
 */
interface CacheEntry {
  data: ContractFeeConfig;
  timestamp: number;
}

/**
 * Contract Fee Service
 * Provides contract fee information with API-first lookup and fallback to hardcoded values
 */
export class ContractFeeService {
  private apiEndpoint: string;
  private cacheTimeout: number;
  private cache: Map<string, CacheEntry>;
  private lastCacheCleanup: number;

  constructor(options: ContractFeeServiceOptions = {}) {
    this.apiEndpoint = options.apiEndpoint || 'https://api.zera.network/contracts';
    this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes
    this.cache = new Map();
    this.lastCacheCleanup = Date.now();
  }

  /**
   * Get contract fee information for a given contract ID
   */
  async getContractFeeInfo(contractId: ContractId): Promise<ContractFeeConfig> {
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
    } catch {
      // console.warn(`Failed to fetch contract fee from API for ${contractId}:`, (error as Error).message);
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
   * Get contract fee amount for a given contract ID
   * This is a simplified version that returns just the fee amount
   */
  async getContractFee(contractId: ContractId): Promise<string> {
    const feeInfo = await this.getContractFeeInfo(contractId);
    return feeInfo.feeAmount || '0';
  }

  /**
   * Fetch contract fee information from API
   */
  async fetchContractFeeFromAPI(_contractId: ContractId): Promise<ContractFeeConfig | null> {
    try {
      // NOTE: This method is intentionally unimplemented as contract fee data
      // is currently retrieved via the validator API in the fee calculation flow.
      // This placeholder exists for future direct contract fee API integration.
      
      // console.log(`[PLACEHOLDER] Would fetch contract fee from API for: ${contractId}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Always return null to use fallback for now
      return null;
    } catch (error) {
      throw new Error(`API fetch failed: ${(error as Error).message}`);
    }
  }

  /**
   * Normalize API response data to standard format
   */
  normalizeAPIData(apiData: Record<string, unknown>): ContractFeeConfig {
    const result: ContractFeeConfig = {
      feeType: this.normalizeFeeType(apiData.feeType || apiData.fee_type),
      feeAmount: String(apiData.feeAmount || apiData.fee_amount || '0'),
      allowedFeeIds: Array.isArray(apiData.allowedFeeIds) ? apiData.allowedFeeIds as string[] : 
        Array.isArray(apiData.allowed_fee_ids) ? apiData.allowed_fee_ids as string[] : 
          ['$ZRA+0000']
    };

    // Only add optional properties if they have valid values
    if (typeof apiData.feePercentage === 'number') {
      result.feePercentage = apiData.feePercentage;
    }
    if (typeof apiData.minimumFee === 'string') {
      result.minimumFee = apiData.minimumFee;
    }
    if (typeof apiData.maximumFee === 'string') {
      result.maximumFee = apiData.maximumFee;
    }

    return result;
  }

  /**
   * Normalize fee type from API response
   */
  normalizeFeeType(feeType: unknown): number {
    if (typeof feeType === 'number') {
      return feeType;
    }

    const typeMap: Record<string, number> = {
      'FIXED': CONTRACT_FEE_TYPE.FIXED,
      'PERCENTAGE': CONTRACT_FEE_TYPE.PERCENTAGE,
      'CUR_EQUIVALENT': CONTRACT_FEE_TYPE.CUR_EQUIVALENT,
      'NONE': CONTRACT_FEE_TYPE.NONE,
      'fixed': CONTRACT_FEE_TYPE.FIXED,
      'percentage': CONTRACT_FEE_TYPE.PERCENTAGE,
      'cur_equivalent': CONTRACT_FEE_TYPE.CUR_EQUIVALENT,
      'none': CONTRACT_FEE_TYPE.NONE
    };

    return typeMap[String(feeType).toUpperCase()] || CONTRACT_FEE_TYPE.FIXED;
  }

  /**
   * Check if a fee contract ID is allowed for a given contract
   */
  async isFeeContractIdAllowed(contractId: ContractId, feeContractId: ContractId): Promise<boolean> {
    const feeInfo = await this.getContractFeeInfo(contractId);
    return (feeInfo.allowedFeeIds).includes(feeContractId);
  }

  /**
   * Calculate contract fee amount
   */
  async calculateContractFee(params: ContractFeeCalculationParams): Promise<ContractFeeCalculationResult> {
    const { contractId, transactionAmount, feeContractId, transactionContractId, exchangeRates = null } = params;

    // Get contract fee information
    const feeInfo = await this.getContractFeeInfo(contractId);

    // If fee contract ID is specified, validate it
    if (feeContractId && !(feeInfo.allowedFeeIds).includes(feeContractId)) {
      throw new Error(`Fee contract ID ${feeContractId} is not allowed for contract ${contractId}. Allowed IDs: ${(feeInfo.allowedFeeIds).join(', ')}`);
    }

    // Calculate fee based on type
    const transactionAmountDecimal = new Decimal(transactionAmount);
    const feeAmountDecimal = new Decimal(feeInfo.feeAmount);
    let calculatedFeeDecimal = new Decimal(0);

    switch (feeInfo.feeType) {
    case CONTRACT_FEE_TYPE.FIXED:
      calculatedFeeDecimal = feeAmountDecimal;
      break;
      
    case CONTRACT_FEE_TYPE.PERCENTAGE: {
      // For percentage fees, we need to:
      // 1. Get the value of the transaction amount in the transaction instrument
      // 2. Calculate the percentage of that value
      // 3. Convert the result to the fee contract ID instrument
        
      // OPTIMIZATION: If transaction and fee contract IDs are the same, skip USD conversion
      const txContractId = transactionContractId || contractId;
      const firstAllowedFeeId = (feeInfo.allowedFeeIds)[0];
      if (!firstAllowedFeeId) {
        throw new Error(`No allowed fee IDs found for contract ${contractId}`);
      }
      const feeContractIdToUse = feeContractId || firstAllowedFeeId;
        
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
    }
      
    case CONTRACT_FEE_TYPE.CUR_EQUIVALENT: {
      // Currency equivalent fee - convert USD amount to fee contract ID
      const firstAllowedFeeIdForEquivalent = (feeInfo.allowedFeeIds)[0];
      if (!firstAllowedFeeIdForEquivalent) {
        throw new Error(`No allowed fee IDs found for contract ${contractId}`);
      }
      calculatedFeeDecimal = await this.convertCurrencyEquivalentFee(
        feeAmountDecimal,
        feeContractId || firstAllowedFeeIdForEquivalent,
        exchangeRates
      );
      break;
    }
      
    case CONTRACT_FEE_TYPE.NONE:
    default:
      calculatedFeeDecimal = new Decimal(0);
      break;
    }

    const firstAllowedFeeIdForResult = (feeInfo.allowedFeeIds)[0];
    if (!firstAllowedFeeIdForResult) {
      throw new Error(`No allowed fee IDs found for contract ${contractId}`);
    }
    const finalFeeContractId = feeContractId || firstAllowedFeeIdForResult;

    return {
      fee: calculatedFeeDecimal.toString(),
      feeDecimal: calculatedFeeDecimal,
      contractId: contractId,
      contractFeeType: feeInfo.feeType,
      contractFeeAmount: feeInfo.feeAmount,
      feeContractId: finalFeeContractId,
      allowedFeeIds: feeInfo.allowedFeeIds,
      breakdown: {
        contractId: contractId,
        contractFeeType: feeInfo.feeType,
        contractFeeAmount: feeInfo.feeAmount,
        transactionAmount: transactionAmountDecimal.toString(),
        calculatedFee: calculatedFeeDecimal.toString(),
        feeContractId: finalFeeContractId,
        allowedFeeIds: feeInfo.allowedFeeIds,
        transactionContractId: transactionContractId || contractId
      }
    };
  }

  /**
   * Calculate percentage-based contract fee with instrument value conversion using cached rates
   */
  async calculatePercentageFee(
    transactionAmount: Decimal, 
    percentage: Decimal, 
    transactionContractId: ContractId, 
    feeContractId: ContractId, 
    exchangeRates: Map<string, Decimal> | null = null
  ): Promise<Decimal> {
    try {
      // Step 1: Convert transaction amount to USD value using cached rate
      let transactionExchangeRate: Decimal;
      if (exchangeRates && exchangeRates.has(transactionContractId)) {
        const rate = exchangeRates.get(transactionContractId);
        if (!rate) throw new Error(`Exchange rate not found for ${transactionContractId}`);
        transactionExchangeRate = rate;
      } else {
        // console.warn(`Transaction exchange rate for ${transactionContractId} not found in pre-fetched rates, fetching separately`);
        transactionExchangeRate = await ExchangeRateService.getExchangeRate(transactionContractId);
      }
      const transactionValueUSD = transactionAmount.mul(transactionExchangeRate);

      // Step 2: Calculate percentage of USD value
      const percentageValueUSD = transactionValueUSD.mul(percentage).div(100);

      // Step 3: Convert USD percentage value to fee contract ID using cached rate
      let feeExchangeRate: Decimal;
      if (exchangeRates && exchangeRates.has(feeContractId)) {
        const rate = exchangeRates.get(feeContractId);
        if (!rate) throw new Error(`Exchange rate not found for ${feeContractId}`);
        feeExchangeRate = rate;
      } else {
        // console.warn(`Fee exchange rate for ${feeContractId} not found in pre-fetched rates, fetching separately`);
        feeExchangeRate = await ExchangeRateService.getExchangeRate(feeContractId);
      }
      const feeAmount = percentageValueUSD.div(feeExchangeRate);

      return feeAmount;
    } catch {
      // console.warn(`Failed to calculate percentage fee with exchange rates: ${(error as Error).message}`);
      // Fallback: simple percentage calculation without conversion
      return transactionAmount.mul(percentage).div(100);
    }
  }

  /**
   * Convert currency equivalent fee from USD to target currency using cached rate
   */
  async convertCurrencyEquivalentFee(
    usdAmount: Decimal, 
    feeContractId: ContractId, 
    exchangeRates: Map<string, Decimal> | null = null
  ): Promise<Decimal> {
    try {
      let exchangeRate: Decimal;
      if (exchangeRates && exchangeRates.has(feeContractId)) {
        const rate = exchangeRates.get(feeContractId);
        if (!rate) throw new Error(`Exchange rate not found for ${feeContractId}`);
        exchangeRate = rate;
      } else {
        // console.warn(`Exchange rate for ${feeContractId} not found in pre-fetched rates, fetching separately`);
        exchangeRate = await ExchangeRateService.getExchangeRate(feeContractId);
      }
      return usdAmount.div(exchangeRate);
    } catch {
      // console.warn(`Failed to convert currency equivalent fee: ${(error as Error).message}`);
      // Fallback: return original amount
      return usdAmount;
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache(): void {
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
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; timeout: number; lastCleanup: number } {
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
