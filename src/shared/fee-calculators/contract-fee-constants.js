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

/**
 * Contract fee configuration fallback data
 * This serves as a fallback when the API is unavailable
 */
export const CONTRACT_FEE_CONFIG = {
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
export const DEFAULT_CONTRACT_FEE_CONFIG = {
  feeType: CONTRACT_FEE_TYPE.NONE,
  feeAmount: '0',
  allowedFeeIds: ['$ZRA+0000'] // Default to ZRA
};

/**
 * Get contract fee configuration by contract ID
 * @param {string} contractId - Contract ID (e.g., '$BTC+1234')
 * @returns {Object} Contract fee configuration
 */
export function getContractFeeConfig(contractId) {
  if (!contractId) {
    return DEFAULT_CONTRACT_FEE_CONFIG;
  }
  
  return CONTRACT_FEE_CONFIG[contractId] || DEFAULT_CONTRACT_FEE_CONFIG;
}

/**
 * Check if a fee contract ID is allowed for a given contract
 * @param {string} contractId - The contract ID
 * @param {string} feeContractId - The fee contract ID to check
 * @returns {boolean} True if the fee contract ID is allowed
 */
export function isFeeContractIdAllowed(contractId, feeContractId) {
  const config = getContractFeeConfig(contractId);
  return config.allowedFeeIds.includes(feeContractId);
}

/**
 * Get all allowed fee contract IDs for a given contract
 * @param {string} contractId - Contract ID
 * @returns {Array<string>} Array of allowed fee contract IDs
 */
export function getAllowedFeeContractIds(contractId) {
  const config = getContractFeeConfig(contractId);
  return [...config.allowedFeeIds]; // Return a copy
}

/**
 * Add or update contract fee configuration
 * @param {string} contractId - Contract ID
 * @param {Object} config - Contract fee configuration
 * @param {number} config.feeType - Fee type (CONTRACT_FEE_TYPE)
 * @param {string} config.feeAmount - Fee amount
 * @param {Array<string>} config.allowedFeeIds - Allowed fee contract IDs
 */
export function setContractFeeConfig(contractId, config) {
  CONTRACT_FEE_CONFIG[contractId] = {
    feeType: config.feeType || CONTRACT_FEE_TYPE.NONE,
    feeAmount: config.feeAmount || '0',
    allowedFeeIds: config.allowedFeeIds || ['$ZRA+0000']
  };
}

/**
 * Remove contract fee configuration
 * @param {string} contractId - Contract ID to remove
 */
export function removeContractFeeConfig(contractId) {
  delete CONTRACT_FEE_CONFIG[contractId];
}

/**
 * Get all configured contract IDs
 * @returns {Array<string>} Array of all configured contract IDs
 */
export function getAllConfiguredContractIds() {
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
