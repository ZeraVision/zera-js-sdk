/**
 * Unified Amount Conversion Utilities
 * 
 * Single smart function that handles all amount conversion scenarios:
 * 1. Uses cached token info if available (most efficient)
 * 2. Falls back to hardcoded cache if token exists there
 * 3. Defaults to 1:1 conversion with warning for unknown tokens
 */

import { Decimal } from 'decimal.js';

import type { AmountInput, ContractId } from '../../types/index.js';
import { getDecimalPlacesFromDenomination } from '../fee-calculators/denomination-fallback.js';

import { getTokenDecimals } from './token-config.js';
import { type TokenInfo } from './token-info.js';

/**
 * Convert various amount types to Decimal for exact arithmetic
 */
function toDecimal(amount: AmountInput): Decimal {
  if (amount instanceof Decimal) {
    return amount;
  }
  if (typeof amount === 'bigint') {
    return new Decimal((amount as bigint).toString());
  }
  if (typeof amount === 'string') {
    // Validate it's a valid number string
    if (!/^-?\d+(\.\d+)?$/.test(amount)) {
      throw new Error(`Invalid amount string: ${amount}`);
    }
    return new Decimal(amount);
  }
  if (typeof amount === 'number') {
    // Convert number to string first to avoid floating point issues
    return new Decimal(amount.toString());
  }
  throw new Error(`Invalid amount type: ${typeof amount}`);
}

/**
 * Unified function to convert user-friendly amount to smallest units
 * 
 * This smart function tries multiple approaches in order of preference:
 * 1. Uses provided denomination if available (most efficient for transaction flows)
 * 2. Falls back to hardcoded token cache
 * 3. Defaults to 1:1 conversion with warning for unknown tokens
 * 
 * @param amount - Amount to convert
 * @param contractId - Contract ID for the token
 * @param options - Optional configuration
 * @param options.isBaseFee - Whether this is for a base fee (affects rounding)
 * @param options.denomination - Pre-fetched denomination (most efficient when available)
 * @param options.tokenInfoMap - Pre-fetched token info map (efficient when available)
 * @returns string - Amount in smallest units
 * 
 * @example
 * ```typescript
 * import { toSmallestUnits } from '@zera/sdk';
 * 
 * // With denomination (most efficient for transaction code)
 * const amount = toSmallestUnits('1.5', '$ZRA+0000', { denomination: 'ZRA' });
 * 
 * // With token info map
 * const amount = toSmallestUnits('1.5', '$ZRA+0000', { tokenInfoMap });
 * 
 * // Simple case (falls back to cache or 1:1)
 * const amount = toSmallestUnits('1.5', '$ZRA+0000');
 * ```
 */
export function toSmallestUnits(
  amount: AmountInput,
  contractId: ContractId = '$ZRA+0000',
  options: {
    isBaseFee?: boolean;
    denomination?: string;
    tokenInfoMap?: Map<string, TokenInfo>;
  } = {}
): string {
  if (amount === undefined || amount === null || amount === '') {
    return '';
  }

  const { isBaseFee = false, denomination, tokenInfoMap } = options;
  const decimalAmount = toDecimal(amount);
  
  let decimals: number;
  let _source: string;

  // Approach 1: Use provided denomination (most efficient for transaction flows)
  if (denomination) {
    decimals = getDecimalPlacesFromDenomination(denomination);
    _source = 'provided denomination';
  }
  // Approach 2: Use token info map if available
  else if (tokenInfoMap && tokenInfoMap.has(contractId)) {
    const tokenInfo = tokenInfoMap.get(contractId);
    if (tokenInfo && tokenInfo.denomination) {
      decimals = getDecimalPlacesFromDenomination(tokenInfo.denomination);
      _source = 'token info map';
    } else {
      throw new Error(`Token info found but missing denomination for ${contractId}`);
    }
  }
  // Approach 3: Fall back to hardcoded cache
  else {
    try {
      decimals = getTokenDecimals(contractId);
      _source = 'hardcoded cache';
    } catch {
      // Approach 4: Default to 1:1 conversion
      decimals = 0;
      _source = 'default 1:1';
    }
  }

  const multiplier = new Decimal(10).pow(decimals);
  const result = decimalAmount.mul(multiplier);
  
  // For base fees, always round DOWN to avoid overcharging
  if (isBaseFee) {
    return result.floor().toString();
  }
  
  // For non-base fees, use precise decimal representation
  return result.toString();
}

/**
 * Convert smallest units to user-friendly amount using the same unified approach
 * 
 * @param amount - Amount in smallest units
 * @param contractId - Contract ID for the token
 * @param options - Optional configuration
 * @param options.denomination - Pre-fetched denomination (most efficient when available)
 * @param options.tokenInfoMap - Pre-fetched token info map (efficient when available)
 * @returns string - User-friendly amount
 * 
 * @example
 * ```typescript
 * import { fromSmallestUnits } from '@zera/sdk';
 * 
 * const userAmount = fromSmallestUnits('1500000000', '$ZRA+0000');
 * console.log(userAmount); // "1.5"
 * ```
 */
export function fromSmallestUnits(
  amount: AmountInput,
  contractId: ContractId = '$ZRA+0000',
  options: {
    denomination?: string;
    tokenInfoMap?: Map<string, TokenInfo>;
  } = {}
): string {
  if (amount === undefined || amount === null || amount === '') {
    return '0';
  }

  const { denomination, tokenInfoMap } = options;
  const decimalAmount = toDecimal(amount);
  
  let decimals: number;

  // Same unified approach as toSmallestUnits
  if (denomination) {
    decimals = getDecimalPlacesFromDenomination(denomination);
  }
  else if (tokenInfoMap && tokenInfoMap.has(contractId)) {
    const tokenInfo = tokenInfoMap.get(contractId);
    if (tokenInfo && tokenInfo.denomination) {
      decimals = getDecimalPlacesFromDenomination(tokenInfo.denomination);
    } else {
      throw new Error(`Token info found but missing denomination for ${contractId}`);
    }
  }
  else {
    try {
      decimals = getTokenDecimals(contractId);
    } catch {
      decimals = 0;
    }
  }

  const divisor = new Decimal(10).pow(decimals);
  return decimalAmount.div(divisor).toString();
}
