/**
 * Universal Fee Calculator for ZERA JS SDK
 * Handles both network fees (base fees) and contract-specific fees
 */

import { KEY_TYPE, HASH_TYPE } from '../wallet-creation/constants.js';
import { TRANSACTION_TYPE, CONTRACT_FEE_TYPE } from './protobuf-enums.js';

/**
 * Signature size constants for different key types
 */
export const SIGNATURE_SIZES = {
  [KEY_TYPE.ED25519]: 64,  // Ed25519 signature size in bytes
  [KEY_TYPE.ED448]: 114     // Ed448 signature size in bytes
};

/**
 * Network base fees per transaction type (in ZERA)
 * These are fixed network fees that don't depend on contract or amount
 * Based on protobuf TRANSACTION_TYPE enum
 */
export const NETWORK_BASE_FEES = {
  [TRANSACTION_TYPE.COIN_TYPE]: 0.000001,           // 1 microZERA per coin transfer
  [TRANSACTION_TYPE.MINT_TYPE]: 0.0000015,          // 1.5 microZERA per mint
  [TRANSACTION_TYPE.ITEM_MINT_TYPE]: 0.0000012,     // 1.2 microZERA per item mint
  [TRANSACTION_TYPE.CONTRACT_TXN_TYPE]: 0.0000018,  // 1.8 microZERA per contract creation
  [TRANSACTION_TYPE.VOTE_TYPE]: 0.0000005,          // 0.5 microZERA per vote
  [TRANSACTION_TYPE.PROPOSAL_TYPE]: 0.000002,       // 2 microZERA per proposal
  [TRANSACTION_TYPE.SMART_CONTRACT_TYPE]: 0.000003, // 3 microZERA per smart contract
  [TRANSACTION_TYPE.SMART_CONTRACT_EXECUTE_TYPE]: 0.000001, // 1 microZERA per execution
  [TRANSACTION_TYPE.NFT_TYPE]: 0.0000015,           // 1.5 microZERA per NFT
  [TRANSACTION_TYPE.UPDATE_CONTRACT_TYPE]: 0.000001, // 1 microZERA per contract update
  [TRANSACTION_TYPE.VALIDATOR_REGISTRATION_TYPE]: 0.000005, // 5 microZERA per validator registration
  [TRANSACTION_TYPE.VALIDATOR_HEARTBEAT_TYPE]: 0.0000001,   // 0.1 microZERA per heartbeat
  [TRANSACTION_TYPE.DELEGATED_VOTING_TYPE]: 0.000001,      // 1 microZERA per delegated vote
  [TRANSACTION_TYPE.REVOKE_TYPE]: 0.000001,                // 1 microZERA per revoke
  [TRANSACTION_TYPE.QUASH_TYPE]: 0.000001,                 // 1 microZERA per quash
  [TRANSACTION_TYPE.FAST_QUORUM_TYPE]: 0.0000005,          // 0.5 microZERA per fast quorum
  [TRANSACTION_TYPE.COMPLIANCE_TYPE]: 0.000001,            // 1 microZERA per compliance
  [TRANSACTION_TYPE.SBT_BURN_TYPE]: 0.000001,             // 1 microZERA per SBT burn
  [TRANSACTION_TYPE.SMART_CONTRACT_INSTANTIATE_TYPE]: 0.000002, // 2 microZERA per instantiation
  [TRANSACTION_TYPE.ALLOWANCE_TYPE]: 0.000001              // 1 microZERA per allowance
};


/**
 * Universal Fee Calculator
 * Separates network fees from contract-specific fees
 */
export class UniversalFeeCalculator {
  /**
   * Calculate network base fee only
   * @param {Object} params - Fee calculation parameters
   * @param {number} params.transactionType - Transaction type (from protobuf TRANSACTION_TYPE enum)
   * @returns {Object} Network fee calculation result
   */
  static calculateNetworkFee(params) {
    const { transactionType = TRANSACTION_TYPE.COIN_TYPE } = params;
    
    const baseFee = NETWORK_BASE_FEES[transactionType] || NETWORK_BASE_FEES[TRANSACTION_TYPE.COIN_TYPE];
    
    return {
      fee: baseFee,
      transactionType: transactionType,
      breakdown: {
        transactionType: transactionType,
        baseFee: baseFee,
        feeId: 'zera' // Base fee is always paid in ZRA (from BaseTXN.fee_id)
      }
    };
  }

  /**
   * Calculate contract-specific fee
   * @param {Object} params - Contract fee parameters
   * @param {string} params.contractId - Contract ID
   * @param {string} params.contractFeeType - Contract fee type (FIXED, PERCENTAGE, etc.)
   * @param {string|number} params.contractFeeAmount - Contract fee amount or percentage
   * @param {string|number} params.transactionAmount - Transaction amount (for percentage calculations)
   * @param {string} params.feeContractId - Contract ID to pay the fee in
   * @returns {Object} Contract fee calculation result
   */
  static calculateContractFee(params) {
    const {
      contractId,
      contractFeeType = CONTRACT_FEE_TYPE.NONE,
      contractFeeAmount = '0',
      transactionAmount = 0,
      feeContractId = 'ZRA+0000'
    } = params;

    // Convert amounts to numbers
    const numericFeeAmount = typeof contractFeeAmount === 'string' ? parseFloat(contractFeeAmount) : contractFeeAmount;
    const numericTransactionAmount = typeof transactionAmount === 'string' ? parseFloat(transactionAmount) : transactionAmount;

    let calculatedFee = 0;

    switch (contractFeeType) {
      case CONTRACT_FEE_TYPE.FIXED:
        // Fixed amount fee
        calculatedFee = numericFeeAmount;
        break;
      
      case CONTRACT_FEE_TYPE.PERCENTAGE:
        // Percentage-based fee (contractFeeAmount is percentage, e.g., 0.1 for 0.1%)
        calculatedFee = numericTransactionAmount * (numericFeeAmount / 100);
        break;
      
      case CONTRACT_FEE_TYPE.CUR_EQUIVALENT:
        // Currency equivalent fee (contractFeeAmount is in base currency units)
        calculatedFee = numericFeeAmount;
        break;
      
      case CONTRACT_FEE_TYPE.NONE:
      default:
        // No contract fees
        calculatedFee = 0;
        break;
    }

    return {
      fee: calculatedFee,
      contractId: contractId,
      contractFeeType: contractFeeType,
      contractFeeAmount: numericFeeAmount,
      feeContractId: feeContractId,
      breakdown: {
        contractId: contractId,
        contractFeeType: contractFeeType,
        contractFeeAmount: numericFeeAmount,
        transactionAmount: numericTransactionAmount,
        calculatedFee: calculatedFee,
        feeContractId: feeContractId
      }
    };
  }

  /**
   * Calculate total fees (network + contract)
   * @param {Object} params - Fee calculation parameters
   * @param {number} params.transactionType - Transaction type (from protobuf TRANSACTION_TYPE enum)
   * @param {string} params.contractId - Contract ID
   * @param {number} params.contractFeeType - Contract fee type (from protobuf CONTRACT_FEE_TYPE enum)
   * @param {string|number} params.contractFeeAmount - Contract fee amount
   * @param {string|number} params.transactionAmount - Transaction amount
   * @param {string} params.feeContractId - Contract ID to pay fees in
   * @returns {Object} Total fee calculation result
   */
  static calculateTotalFees(params) {
    // Calculate network fee
    const networkFee = this.calculateNetworkFee({
      transactionType: params.transactionType
    });

    // Calculate contract fee
    const contractFee = this.calculateContractFee({
      contractId: params.contractId,
      contractFeeType: params.contractFeeType,
      contractFeeAmount: params.contractFeeAmount,
      transactionAmount: params.transactionAmount,
      feeContractId: params.feeContractId
    });

    const totalFee = networkFee.fee + contractFee.fee;

    return {
      totalFee: totalFee,
      networkFee: networkFee.fee,
      contractFee: contractFee.fee,
      totalAmount: (typeof params.transactionAmount === 'string' ? parseFloat(params.transactionAmount) : params.transactionAmount) + totalFee,
      breakdown: {
        network: networkFee,
        contract: contractFee,
        total: totalFee
      }
    };
  }

  /**
   * Get network base fee for a transaction type
   * @param {number} transactionType - Transaction type (from protobuf TRANSACTION_TYPE enum)
   * @returns {number} Base fee in ZERA
   */
  static getNetworkBaseFee(transactionType) {
    return NETWORK_BASE_FEES[transactionType] || NETWORK_BASE_FEES[TRANSACTION_TYPE.COIN_TYPE];
  }

  /**
   * Get signature size for a key type
   * @param {string} keyType - Key type
   * @returns {number} Signature size in bytes
   */
  static getSignatureSize(keyType) {
    return SIGNATURE_SIZES[keyType] || SIGNATURE_SIZES[KEY_TYPE.ED25519];
  }

  /**
   * Estimate transaction size (for gas estimation)
   * @param {Object} params - Transaction parameters
   * @returns {Object} Size estimation
   */
  static estimateTransactionSize(params) {
    const {
      transactionType = TRANSACTION_TYPE.TRANSFER,
      keyType = KEY_TYPE.ED25519
    } = params;

    // Basic size estimation based on transaction type
    let estimatedSize = 200; // Base size
    if (transactionType === TRANSACTION_TYPE.MINT) {
      estimatedSize = 150;
    } else if (transactionType === TRANSACTION_TYPE.BURN) {
      estimatedSize = 120;
    }

    const signatureSize = SIGNATURE_SIZES[keyType] || SIGNATURE_SIZES[KEY_TYPE.ED25519];

    return {
      protobufSize: estimatedSize,
      signatureSize: signatureSize,
      totalSize: estimatedSize + signatureSize,
      transactionType: transactionType,
      keyType: keyType
    };
  }

  /**
   * Legacy method for backward compatibility
   * @param {Object} params - Fee calculation parameters
   * @returns {Object} Fee calculation result
   */
  static calculateFee(params) {
    // For backward compatibility, assume no contract fees
    return this.calculateNetworkFee(params);
  }
}

// Re-export enums for external use
export { TRANSACTION_TYPE, CONTRACT_FEE_TYPE } from './protobuf-enums.js';

// Export constants and calculator
export default {
  UniversalFeeCalculator,
  SIGNATURE_SIZES,
  NETWORK_BASE_FEES,
  TRANSACTION_TYPE,
  CONTRACT_FEE_TYPE
};