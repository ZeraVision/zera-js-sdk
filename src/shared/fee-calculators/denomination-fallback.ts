/**
 * Denomination Fallback Constants
 * Fallback denomination values for tokens when not available from validator
 * These are used for precision calculations in fee computations
 */

import type { ContractId } from '../../types/index.js';

/**
 * Fallback denomination values for different contract IDs
 * Key: Contract ID (e.g., '$ZRA+0000')
 * Value: Denomination string (e.g., '1000000000' for 1e9)
 */
export const DENOMINATION_FALLBACKS: Record<ContractId, string> = {
  '$ZRA+0000': '1000000000'  // 1e9 (9 decimal places)
} as const;

/**
 * Get fallback denomination for a contract ID
 * @param contractId - The contract ID to get denomination for
 * @returns The denomination string or throws error if not found
 */
export function getDenominationFallback(contractId: ContractId): string {
  if (!contractId || typeof contractId !== 'string') {
    throw new Error('Contract ID must be a non-empty string');
  }
  
  const denomination = DENOMINATION_FALLBACKS[contractId];
  if (!denomination) {
    throw new Error(`No denomination fallback configured for contract ID: ${contractId}. Please add a denomination fallback for this contract.`);
  }
  
  return denomination;
}

/**
 * Check if a contract ID has a denomination fallback
 * @param contractId - The contract ID to check
 * @returns True if fallback exists, false otherwise
 */
export function hasDenominationFallback(contractId: ContractId): boolean {
  return contractId in DENOMINATION_FALLBACKS;
}

/**
 * Add a new denomination fallback
 * @param contractId - The contract ID
 * @param denomination - The denomination string
 */
export function addDenominationFallback(contractId: ContractId, denomination: string): void {
  if (!contractId || typeof contractId !== 'string') {
    throw new Error('Contract ID must be a non-empty string');
  }
  
  if (!denomination || typeof denomination !== 'string') {
    throw new Error('Denomination must be a non-empty string');
  }
  
  // Validate denomination is a valid number string
  if (!/^\d+$/.test(denomination)) {
    throw new Error('Denomination must be a valid number string');
  }
  
  (DENOMINATION_FALLBACKS)[contractId] = denomination;
}

/**
 * Get all supported contract IDs with denomination fallbacks
 * @returns Array of contract IDs
 */
export function getSupportedContractIds(): ContractId[] {
  return Object.keys(DENOMINATION_FALLBACKS);
}

/**
 * Get decimal places from denomination string
 * @param denomination - The denomination string (e.g., '1000000000')
 * @returns Number of decimal places (e.g., 9)
 */
export function getDecimalPlacesFromDenomination(denomination: string): number {
  if (!denomination || typeof denomination !== 'string') {
    throw new Error('Denomination must be a non-empty string');
  }
  
  // Validate denomination is a valid number string
  if (!/^\d+$/.test(denomination)) {
    throw new Error('Denomination must be a valid number string');
  }
  
  // Calculate decimal places: log10(denomination)
  const denominationNum = parseInt(denomination, 10);
  if (denominationNum <= 0) {
    throw new Error('Denomination must be greater than 0');
  }
  
  return Math.floor(Math.log10(denominationNum));
}
