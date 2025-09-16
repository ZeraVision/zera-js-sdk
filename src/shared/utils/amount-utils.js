/**
 * Amount Utilities for Blockchain Operations
 * Provides exact decimal arithmetic and BigInt support for blockchain amounts
 * 
 * This module handles:
 * - Exact decimal arithmetic using decimal.js
 * - BigInt operations for integer amounts
 * - Conversion between different amount formats
 * - Precision handling for different token decimals
 */

import Decimal from 'decimal.js';
import { getTokenDecimals } from './token-config.js';

// Configure decimal.js for maximum precision
Decimal.set({
  precision: 50,        // High precision for blockchain calculations
  rounding: Decimal.ROUND_DOWN, // Always round down for blockchain safety
  toExpNeg: -50,        // Support very small numbers
  toExpPos: 50,         // Support very large numbers
  maxE: 9e15,           // Maximum exponent
  minE: -9e15           // Minimum exponent
});

/**
 * Convert various amount types to Decimal for exact arithmetic
 * @param {Decimal|BigInt|string|number} amount - Amount to convert
 * @returns {Decimal} Amount as Decimal
 */
export function toDecimal(amount) {
  if (amount instanceof Decimal) {
    return amount;
  }
  if (typeof amount === 'bigint') {
    return new Decimal(amount.toString());
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
 * Convert various amount types to string for protobuf (smallest units)
 * @param {Decimal|string|number} amount - Amount to convert
 * @param {string} contractId - Contract ID to determine decimal places
 * @returns {string} Amount as string for protobuf
 */
export function toAmountString(amount, contractId = '$ZRA+0000') {
  return toSmallestUnits(amount, contractId);
}

/**
 * Convert user-friendly amount to smallest units (e.g., 1.5 ZRA -> 1500000000000000000)
 * @param {Decimal|string|number} amount - User-friendly amount
 * @param {string} contractId - Contract ID to determine decimal places
 * @returns {string} Amount in smallest units as string
 */
export function toSmallestUnits(amount, contractId = '$ZRA+0000') {
  const decimalAmount = toDecimal(amount);
  const decimals = getTokenDecimals(contractId);
  const multiplier = new Decimal(10).pow(decimals);
  return decimalAmount.mul(multiplier).floor().toString();
}

/**
 * Convert smallest units to user-friendly amount (e.g., 1500000000000000000 -> 1.5 ZRA)
 * @param {Decimal|string|number} amount - Amount in smallest units
 * @param {string} contractId - Contract ID to determine decimal places
 * @returns {string} User-friendly amount as string
 */
export function fromSmallestUnits(amount, contractId = '$ZRA+0000') {
  const decimalAmount = toDecimal(amount);
  const decimals = getTokenDecimals(contractId);
  const divisor = new Decimal(10).pow(decimals);
  return decimalAmount.div(divisor).toString();
}

/**
 * Add multiple amounts with exact decimal arithmetic
 * @param {...(Decimal|string|number)} amounts - Amounts to add
 * @returns {Decimal} Sum as Decimal
 */
export function addAmounts(...amounts) {
  return amounts.reduce((sum, amount) => {
    return sum.add(toDecimal(amount));
  }, new Decimal(0));
}

/**
 * Subtract amounts with exact decimal arithmetic
 * @param {Decimal|string|number} minuend - Amount to subtract from
 * @param {Decimal|string|number} subtrahend - Amount to subtract
 * @returns {Decimal} Difference as Decimal
 */
export function subtractAmounts(minuend, subtrahend) {
  return toDecimal(minuend).sub(toDecimal(subtrahend));
}

/**
 * Multiply amounts with exact decimal arithmetic
 * @param {Decimal|string|number} multiplicand - Amount to multiply
 * @param {Decimal|string|number} multiplier - Amount to multiply by
 * @returns {Decimal} Product as Decimal
 */
export function multiplyAmounts(multiplicand, multiplier) {
  return toDecimal(multiplicand).mul(toDecimal(multiplier));
}

/**
 * Divide amounts with exact decimal arithmetic
 * @param {Decimal|string|number} dividend - Amount to divide
 * @param {Decimal|string|number} divisor - Amount to divide by
 * @returns {Decimal} Quotient as Decimal
 */
export function divideAmounts(dividend, divisor) {
  return toDecimal(dividend).div(toDecimal(divisor));
}

/**
 * Calculate percentage with exact decimal arithmetic
 * @param {Decimal|string|number} amount - Base amount
 * @param {Decimal|string|number} percentage - Percentage (e.g., 1 for 1%)
 * @returns {Decimal} Percentage amount as Decimal
 */
export function calculatePercentage(amount, percentage) {
  return multiplyAmounts(amount, percentage).div(100);
}

/**
 * Compare amounts with exact decimal arithmetic
 * @param {Decimal|string|number} a - First amount
 * @param {Decimal|string|number} b - Second amount
 * @returns {number} -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareAmounts(a, b) {
  return toDecimal(a).cmp(toDecimal(b));
}

/**
 * Check if amounts are equal with exact decimal arithmetic
 * @param {Decimal|string|number} a - First amount
 * @param {Decimal|string|number} b - Second amount
 * @returns {boolean} True if amounts are equal
 */
export function areAmountsEqual(a, b) {
  return compareAmounts(a, b) === 0;
}

/**
 * Validate that input amounts equal output amounts (blockchain requirement)
 * @param {Array} inputAmounts - Array of input amounts
 * @param {Array} outputAmounts - Array of output amounts
 * @throws {Error} If amounts don't balance
 */
export function validateAmountBalance(inputAmounts, outputAmounts) {
  const totalInput = addAmounts(...inputAmounts);
  const totalOutput = addAmounts(...outputAmounts);
  
  if (!areAmountsEqual(totalInput, totalOutput)) {
    throw new Error(
      `Amount balance validation failed: Input total (${totalInput.toString()}) != Output total (${totalOutput.toString()})`
    );
  }
}

/**
 * Format amount for display with proper decimal places
 * @param {Decimal|string|number} amount - Amount to format
 * @param {string} contractId - Contract ID to determine decimal places
 * @param {number} displayDecimals - Number of decimal places to show (optional)
 * @returns {string} Formatted amount string
 */
export function formatAmount(amount, contractId = '$ZRA+0000', displayDecimals = null) {
  const decimalAmount = toDecimal(amount);
  const decimals = getTokenDecimals(contractId);
  
  if (displayDecimals !== null) {
    return decimalAmount.toFixed(displayDecimals);
  }
  
  // Auto-format: show up to the token's decimal places, but remove trailing zeros
  return decimalAmount.toFixed(decimals).replace(/\.?0+$/, '');
}

/**
 * Parse amount from user input with validation
 * @param {string} input - User input string
 * @returns {Decimal} Parsed amount as Decimal
 * @throws {Error} If input is invalid
 */
export function parseAmount(input) {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Remove whitespace and validate format
  const cleaned = input.trim();
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
    throw new Error(`Invalid amount format: ${input}`);
  }
  
  return toDecimal(cleaned);
}

// Export Decimal class for advanced usage
export { Decimal };

// Re-export getTokenDecimals from token-config for convenience
export { getTokenDecimals } from './token-config.js';

// Export default configuration
export default {
  toDecimal,
  toAmountString,
  toSmallestUnits,
  fromSmallestUnits,
  addAmounts,
  subtractAmounts,
  multiplyAmounts,
  divideAmounts,
  calculatePercentage,
  compareAmounts,
  areAmountsEqual,
  validateAmountBalance,
  formatAmount,
  parseAmount,
  getTokenDecimals,
  Decimal
};
