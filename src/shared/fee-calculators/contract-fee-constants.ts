/**
 * Contract Fee Constants
 * Hardcoded fallback values for contract fees when API is unavailable
 * 
 * Each contract can specify:
 * - feeType: FIXED, PERCENTAGE, CUR_EQUIVALENT, or NONE
 * - feeAmount: The fee amount or percentage
 * - allowedFeeIds: Array of contract IDs that can be used to pay the fee
 */

import { CONTRACT_FEE_TYPE } from '../protobuf-enums.js';

export interface ContractFeeConfig {
  feeType: number;
  feeAmount: string;
  allowedFeeIds: string[];
}

/**
 * Contract fee configuration fallback data
 * This serves as a fallback when the API is unavailable
 */
export const CONTRACT_FEE_CONFIG: Record<string, ContractFeeConfig> = {
  // Test contract configurations
  '$TESTFEE+0000': {
    feeType: CONTRACT_FEE_TYPE.FIXED,
    feeAmount: '0.001', // 0.001 TESTFEE fixed fee
    allowedFeeIds: ['$TESTFEE+0000', '$ZRA+0000']
  },
  
  '$TESTFEE+0001': {
    feeType: CONTRACT_FEE_TYPE.CUR_EQUIVALENT,
    feeAmount: '0.01', // $0.01 USD equivalent (rate fetched from API)
    allowedFeeIds: ['$TESTFEE+0001', '$ZRA+0000']
  },
  
  '$TESTFEE+0002': {
    feeType: CONTRACT_FEE_TYPE.PERCENTAGE,
    feeAmount: '0.5', // 0.5% of transaction amount
    allowedFeeIds: ['$TESTFEE+0002', '$ZRA+0000']
  },
  
  // Additional example contracts
  '$BTC+1234': {
    feeType: CONTRACT_FEE_TYPE.FIXED,
    feeAmount: '0.0001', // 0.0001 BTC fixed fee
    allowedFeeIds: ['$BTC+1234', '$ZRA+0000']
  },
  
  '$ETH+5678': {
    feeType: CONTRACT_FEE_TYPE.PERCENTAGE,
    feeAmount: '0.25', // 0.25% of transaction amount
    allowedFeeIds: ['$ETH+5678', '$ZRA+0000']
  },
  
  '$USDC+9999': {
    feeType: CONTRACT_FEE_TYPE.CUR_EQUIVALENT,
    feeAmount: '0.01', // $0.01 USD equivalent
    allowedFeeIds: ['$USDC+9999', '$ZRA+0000']
  }
};

/**
 * Default contract fee configuration for unknown contracts
 */
export const DEFAULT_CONTRACT_FEE_CONFIG: ContractFeeConfig = {
  feeType: CONTRACT_FEE_TYPE.NONE,
  feeAmount: '0',
  allowedFeeIds: ['$ZRA+0000'] // Default to ZRA
};

/**
 * Get contract fee configuration by contract ID
 * @param contractId - Contract ID (e.g., '$BTC+1234')
 * @returns Contract fee configuration
 */
export function getContractFeeConfig(contractId: string): ContractFeeConfig {
  if (!contractId) {
    return DEFAULT_CONTRACT_FEE_CONFIG;
  }
  
  return CONTRACT_FEE_CONFIG[contractId] || DEFAULT_CONTRACT_FEE_CONFIG;
}

/**
 * Check if a fee contract ID is allowed for a given contract
 * @param contractId - The contract ID
 * @param feeContractId - The fee contract ID to check
 * @returns True if the fee contract ID is allowed
 */
export function isFeeContractIdAllowed(contractId: string, feeContractId: string): boolean {
  const config = getContractFeeConfig(contractId);
  return config.allowedFeeIds.includes(feeContractId);
}

/**
 * Get all allowed fee contract IDs for a given contract
 * @param contractId - Contract ID
 * @returns Array of allowed fee contract IDs
 */
export function getAllowedFeeContractIds(contractId: string): string[] {
  const config = getContractFeeConfig(contractId);
  return [...config.allowedFeeIds]; // Return a copy
}

/**
 * Add or update contract fee configuration
 * @param contractId - Contract ID
 * @param config - Contract fee configuration
 */
export function setContractFeeConfig(contractId: string, config: Partial<ContractFeeConfig>): void {
  CONTRACT_FEE_CONFIG[contractId] = {
    feeType: config.feeType || CONTRACT_FEE_TYPE.NONE,
    feeAmount: config.feeAmount || '0',
    allowedFeeIds: config.allowedFeeIds || ['$ZRA+0000']
  };
}

/**
 * Remove contract fee configuration
 * @param contractId - Contract ID to remove
 */
export function removeContractFeeConfig(contractId: string): void {
  delete CONTRACT_FEE_CONFIG[contractId];
}

/**
 * Get all configured contract IDs
 * @returns Array of all configured contract IDs
 */
export function getAllConfiguredContractIds(): string[] {
  return Object.keys(CONTRACT_FEE_CONFIG);
}

export default {
  CONTRACT_FEE_CONFIG,
  DEFAULT_CONTRACT_FEE_CONFIG,
  getContractFeeConfig,
  isFeeContractIdAllowed,
  getAllowedFeeContractIds,
  setContractFeeConfig,
  removeContractFeeConfig,
  getAllConfiguredContractIds
};
