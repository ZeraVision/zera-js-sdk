/**
 * Universal Fee Calculator for ZERA JS SDK
 * Handles both network fees (base fees) and contract-specific fees
 * Uses proper USD-based, size-dependent calculation
 */

import { KEY_TYPE, HASH_TYPE } from '../../wallet-creation/constants.js';
import { TRANSACTION_TYPE, CONTRACT_FEE_TYPE } from '../protobuf-enums.js';
import { 
  toDecimal, 
  toAmountString, 
  addAmounts, 
  multiplyAmounts, 
  divideAmounts, 
  calculatePercentage,
  Decimal 
} from '../utils/amount-utils.js';
import { aceExchangeService } from './ace-exchange-rate-service.js';

/**
 * Signature sizes for different key types
 */
export const SIGNATURE_SIZES = {
  [KEY_TYPE.ED25519]: 64,  // Ed25519 signature size in bytes
  [KEY_TYPE.ED448]: 114    // Ed448 signature size in bytes
};

/**
 * Hash size (transaction hash)
 */
export const HASH_SIZE = 32; // SHA3-256 hash size in bytes

/**
 * Fee calculation constants
 * These are a fallback for when remote data is not available
 */
export const FEE_CALCULATION_CONSTANTS = {
  // Multiplier for restricted keys
  RESTRICTED_KEY_FEE: 3.0,          // 3x multiplier on key/hash fees
  
  // Key fees (Fixed Cost)
  A_KEY_FEE: 0.02,                  // 2 cents
  B_KEY_FEE: 0.05,                  // 5 cents
  
  // Hash fees (Fixed Cost in)
  a_HASH_FEE: 0.02,                 // 2 cents
  b_HASH_FEE: 0.05,                 // 5 cents
  c_HASH_FEE: 0.01,                 // 1 cent
  d_hash_fee: 0.50,                 // 50 cents
  e_hash_fee: 1.00,                 // $1.00
  f_hash_fee: 2.00,                 // $2.00
  g_hash_fee: 4.00,                 // $4.00
  dbz_hash_fee: 9.01,               // $9.01
  h_hash_fee: 2.00,                 // $2.00
  i_hash_fee: 4.00,                 // $4.00
  j_hash_fee: 8.00,                 // $8.00
  
  // Transaction type fees (Cost Per Byte)
  DELEGATED_VOTING_TXN_FEE: 0.05,           // 5 cents per byte
  COIN_TXN_FEE: 0.00015,                    // 0.015 cents per byte
  SAFE_SEND_FEE: 0.0001,                    // 0.01 cents per byte
  CONTRACT_TXN_FEE: 0.075,                  // 7.5 cents per byte
  EXPENSE_RATIO_TXN_FEE: 0.10,              // 10 cents per byte
  ITEM_MINT_TXN_FEE: 0.001,                 // 0.1 cents per byte
  MINT_TXN_FEE: 0.001,                      // 0.1 cents per byte
  NFT_TXN_FEE: 0.0003,                      // 0.03 cents per byte
  PROPOSAL_RESULT_TXN_FEE: 0.01,            // 1 cent per byte
  PROPOSAL_TXN_FEE: 0.005,                  // 0.5 cents per byte
  SELF_CURRENCY_EQUIV_TXN_FEE: 0.0005,      // 0.05 cents per byte
  AUTHORIZED_CURRENCY_EQUIV_TXN_FEE: 0.0005, // 0.05 cents per byte
  SMART_CONTRACT_EXECUTE_TXN_FEE: 0.0015,   // 0.15 cents per byte
  SMART_CONTRACT_DEPLOYMENT_TXN_FEE: 0.0004, // 0.04 cents per byte
  SMART_CONTRACT_INSTANTIATE_TXN_FEE: 0.02,  // 2 cents per byte
  UPDATE_CONTRACT_TXN_FEE: 0.075,           // 7.5 cents per byte
  VOTE_TXN_FEE: 0.0001,                     // 0.01 cents per byte
  VALIDATOR_REGISTRATION_TXN_FEE: 0.01,     // 1 cent per byte
  VALIDATOR_HEARTBEAT_TXN_FEE: 0.00005,     // 0.005 cents per byte
  FAST_QUORUM_TXN_FEE: 0.04,                // 4 cents per byte
  QUASH_TXN_FEE: 0.001,                     // 0.1 cents per byte
  REVOKE_TXN_FEE: 0.001,                    // 0.1 cents per byte
};

/**
 * Universal Fee Calculator
 * Uses proper fiat-based, size-dependent calculation
 */
export class UniversalFeeCalculator {
  /**
   * Calculate total transaction size from protobuf object + signatures + hash
   * @param {Object} protoObject - The protobuf transaction object (without signatures/hash)
   * @param {Array} keyTypes - Array of key types for signature size calculation
   * @returns {number} Total transaction size in bytes
   */
  static calculateTotalTransactionSize(protoObject, keyTypes) {
    // Get the serialized size of the protobuf object
    const protoSize = protoObject.toBinary().length;
    
    // Calculate signature sizes
    let signatureSize = 0;
    for (const keyType of keyTypes) {
      signatureSize += SIGNATURE_SIZES[keyType] || SIGNATURE_SIZES[KEY_TYPE.ED25519];
    }
    
    // Add hash size
    const hashSize = HASH_SIZE;
    
    return protoSize + signatureSize + hashSize;
  }

  /**
   * Get fee values based on fee types
   * @param {string} feeTypes - Comma-separated list of fee types
   * @returns {Object} Fee values with fixed and perByte components
   */
  static getFeeValues(feeTypes) {
    const feeTypeList = feeTypes.split(',').map(type => type.trim());
    
    let isRestricted = false;
    let fixed = 0.0;
    let perByte = 0.0;
    
    for (const feeType of feeTypeList) {
      if (feeType === 'RESTRICTED_KEY_FEE') {
        isRestricted = true;
        continue;
      }
      
      const value = FEE_CALCULATION_CONSTANTS[feeType];
      if (value === undefined) {
        throw new Error(`Unknown fee type: ${feeType}`);
      }
      
      if (feeType.includes('KEY_FEE') || feeType.includes('HASH_FEE')) {
        fixed += value;
      } else {
        perByte += value;
      }
    }
    
    if (feeTypeList.length === 0) {
      throw new Error('No fee types found');
    }
    
    if (isRestricted) {
      fixed = fixed * FEE_CALCULATION_CONSTANTS.RESTRICTED_KEY_FEE;
    }
    
    // Round to nearest millionth
    fixed = Math.round(fixed * 1e6) / 1e6;
    perByte = Math.round(perByte * 1e6) / 1e6;
    
    return {
      fixed: fixed,
      perByte: perByte
    };
  }

  /**
   * Calculate network base fee using proper USD-based, size-dependent calculation
   * @param {Object} params - Fee calculation parameters
   * @param {Object} params.protoObject - The protobuf transaction object (without signatures/hash)
   * @param {Array} params.keyTypes - Array of key types for signature size calculation
   * @param {number} params.transactionType - Transaction type (from protobuf TRANSACTION_TYPE enum)
   * @param {string} [params.baseFeeId='$ZRA+0000'] - Base fee instrument ID
   * @param {string} [params.feeTypes] - Comma-separated fee types (if not provided, auto-detected)
   * @returns {Promise<Object>} Network fee calculation result
   */
  static async calculateNetworkFee(params) {
    const {
      protoObject,
      keyTypes,
      transactionType = TRANSACTION_TYPE.COIN_TYPE,
      baseFeeId = '$ZRA+0000',
      feeTypes
    } = params;
    
    // Calculate total transaction size
    const totalSize = this.calculateTotalTransactionSize(protoObject, keyTypes);
    
    // Determine fee types if not provided
    let feeTypesToUse = feeTypes;
    if (!feeTypesToUse) {
      feeTypesToUse = this.determineFeeTypes(transactionType, keyTypes);
    }
    
    // Get fee values
    const feeValues = this.getFeeValues(feeTypesToUse);
    
    // Calculate total fee in USD
    const fixedFeeUSD = feeValues.fixed;
    const perByteFeeUSD = feeValues.perByte * totalSize;
    const totalFeeUSD = fixedFeeUSD + perByteFeeUSD;
    
    // Apply minimum and maximum constraints
    const minFeeUSD = FEE_CALCULATION_CONSTANTS.MINIMUM_FEE_USD;
    const maxFeeUSD = FEE_CALCULATION_CONSTANTS.MAXIMUM_FEE_USD;
    
    const finalFeeUSD = Math.max(minFeeUSD, Math.min(maxFeeUSD, totalFeeUSD));
    
    // Convert USD to target currency using ACE exchange rate
    const finalFeeInCurrency = await aceExchangeService.convertUSDToCurrency(finalFeeUSD, baseFeeId);
    
    return {
      fee: finalFeeInCurrency.toString(),
      feeId: baseFeeId,
      feeUSD: finalFeeUSD,
      totalSize: totalSize,
      protoSize: protoObject.toBinary().length,
      signatureSize: keyTypes.reduce((sum, keyType) => sum + (SIGNATURE_SIZES[keyType] || SIGNATURE_SIZES[KEY_TYPE.ED25519]), 0),
      hashSize: HASH_SIZE,
      transactionType: transactionType,
      breakdown: {
        feeTypes: feeTypesToUse,
        fixedFeeUSD: fixedFeeUSD,
        perByteFeeUSD: perByteFeeUSD,
        totalFeeUSD: finalFeeUSD,
        feeInCurrency: finalFeeInCurrency.toString(),
        totalSize: totalSize,
        protoSize: protoObject.toBinary().length,
        signatureSize: keyTypes.reduce((sum, keyType) => sum + (SIGNATURE_SIZES[keyType] || SIGNATURE_SIZES[KEY_TYPE.ED25519]), 0),
        hashSize: HASH_SIZE,
        transactionType,
        keyCount: keyTypes.length,
        exchangeRate: (await aceExchangeService.getExchangeRate(baseFeeId)).toString()
      }
    };
  }

  /**
   * Convert various amount types to Decimal for exact arithmetic
   * @param {Decimal|BigInt|string|number} amount - Amount to convert
   * @returns {Decimal} Amount as Decimal
   */
  static toDecimal(amount) {
    return toDecimal(amount);
  }

  /**
   * Calculate contract-specific fee using Decimal for exact arithmetic
   * @param {Object} params - Contract fee parameters
   * @param {string} params.contractId - Contract ID
   * @param {number} params.contractFeeType - Contract fee type (FIXED, PERCENTAGE, etc.)
   * @param {Decimal|string|number} params.contractFeeAmount - Contract fee amount or percentage
   * @param {Decimal|string|number} params.transactionAmount - Transaction amount (for percentage calculations)
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

    // Convert amounts to Decimal for exact arithmetic
    const feeAmountDecimal = this.toDecimal(contractFeeAmount);
    const transactionAmountDecimal = this.toDecimal(transactionAmount);

    let calculatedFeeDecimal = new Decimal(0);

    switch (contractFeeType) {
      case CONTRACT_FEE_TYPE.FIXED:
        // Fixed amount fee
        calculatedFeeDecimal = feeAmountDecimal;
        break;
      
      case CONTRACT_FEE_TYPE.PERCENTAGE:
        // Percentage-based fee (contractFeeAmount is percentage, e.g., 0.1 for 0.1%)
        // Using Decimal arithmetic: (transactionAmount * feeAmount) / 100
        calculatedFeeDecimal = calculatePercentage(transactionAmountDecimal, feeAmountDecimal);
        break;
      
      case CONTRACT_FEE_TYPE.CUR_EQUIVALENT:
        // Currency equivalent fee (contractFeeAmount is in base currency units)
        calculatedFeeDecimal = feeAmountDecimal;
        break;
      
      case CONTRACT_FEE_TYPE.NONE:
      default:
        // No contract fees
        calculatedFeeDecimal = new Decimal(0);
        break;
    }

    return {
      fee: calculatedFeeDecimal.toString(), // Return as string for protobuf compatibility
      feeDecimal: calculatedFeeDecimal, // Also provide Decimal version
      contractId: contractId,
      contractFeeType: contractFeeType,
      contractFeeAmount: feeAmountDecimal.toString(),
      feeContractId: feeContractId,
      breakdown: {
        contractId: contractId,
        contractFeeType: contractFeeType,
        contractFeeAmount: feeAmountDecimal.toString(),
        transactionAmount: transactionAmountDecimal.toString(),
        calculatedFee: calculatedFeeDecimal.toString(),
        feeContractId: feeContractId
      }
    };
  }

  /**
   * Calculate total fees (network + contract) using Decimal for exact arithmetic
   * @param {Object} params - Fee calculation parameters
   * @param {Object} params.protoObject - The protobuf transaction object (without signatures/hash)
   * @param {Array} params.keyTypes - Array of key types for signature size calculation
   * @param {number} params.transactionType - Transaction type (from protobuf TRANSACTION_TYPE enum)
   * @param {string} params.contractId - Contract ID
   * @param {number} params.contractFeeType - Contract fee type (from protobuf CONTRACT_FEE_TYPE enum)
   * @param {Decimal|string|number} params.contractFeeAmount - Contract fee amount
   * @param {Decimal|string|number} params.transactionAmount - Transaction amount
   * @param {string} params.feeContractId - Contract ID to pay fees in
   * @param {string} [params.baseFeeId='$ZRA+0000'] - Base fee instrument ID
   * @returns {Promise<Object>} Total fee calculation result
   */
  static async calculateTotalFees(params) {
    // Calculate network fee
    const networkFee = await this.calculateNetworkFee({
      protoObject: params.protoObject,
      keyTypes: params.keyTypes,
      transactionType: params.transactionType,
      baseFeeId: params.baseFeeId || '$ZRA+0000'
    });

    // Calculate contract fee
    const contractFee = this.calculateContractFee({
      contractId: params.contractId,
      contractFeeType: params.contractFeeType,
      contractFeeAmount: params.contractFeeAmount,
      transactionAmount: params.transactionAmount,
      feeContractId: params.feeContractId
    });

    // Convert network fee to Decimal for exact calculation
    const networkFeeDecimal = this.toDecimal(networkFee.fee);
    const contractFeeDecimal = contractFee.feeDecimal;
    const transactionAmountDecimal = this.toDecimal(params.transactionAmount);

    const totalFeeDecimal = addAmounts(networkFeeDecimal, contractFeeDecimal);
    const totalAmountDecimal = addAmounts(transactionAmountDecimal, totalFeeDecimal);

    return {
      totalFee: totalFeeDecimal.toString(), // String for protobuf compatibility
      totalFeeDecimal: totalFeeDecimal, // Decimal version
      networkFee: networkFee.fee,
      contractFee: contractFee.fee,
      totalAmount: totalAmountDecimal.toString(), // String for protobuf compatibility
      totalAmountDecimal: totalAmountDecimal, // Decimal version
      breakdown: {
        network: networkFee,
        contract: contractFee,
        total: totalFeeDecimal.toString()
      }
    };
  }

  /**
   * Determine fee types based on transaction type and key types
   * @param {number} transactionType - Transaction type
   * @param {Array} keyTypes - Array of key types
   * @returns {string} Comma-separated fee types
   */
  static determineFeeTypes(transactionType, keyTypes) {
    const feeTypes = [];
    
    // Add key fees based on key types
    for (const keyType of keyTypes) {
      if (keyType === KEY_TYPE.ED25519) {
        feeTypes.push('A_KEY_FEE');
      } else if (keyType === KEY_TYPE.ED448) {
        feeTypes.push('B_KEY_FEE');
      }
    }
    
    // Add hash fees (assume one hash per transaction for now)
    feeTypes.push('a_HASH_FEE');
    
    // Add transaction type fee
    const txTypeFee = this.getTransactionTypeFee(transactionType);
    if (txTypeFee) {
      feeTypes.push(txTypeFee);
    }
    
    return feeTypes.join(',');
  }

  /**
   * Get transaction type fee constant name
   * @param {number} transactionType - Transaction type
   * @returns {string|null} Fee constant name
   */
  static getTransactionTypeFee(transactionType) {
    const txTypeMap = {
      [TRANSACTION_TYPE.COIN_TYPE]: 'COIN_TXN_FEE',
      [TRANSACTION_TYPE.MINT_TYPE]: 'MINT_TXN_FEE',
      [TRANSACTION_TYPE.ITEM_MINT_TYPE]: 'ITEM_MINT_TXN_FEE',
      [TRANSACTION_TYPE.CONTRACT_TXN_TYPE]: 'CONTRACT_TXN_FEE',
      [TRANSACTION_TYPE.VOTE_TYPE]: 'VOTE_TXN_FEE',
      [TRANSACTION_TYPE.PROPOSAL_TYPE]: 'PROPOSAL_TXN_FEE',
      [TRANSACTION_TYPE.SMART_CONTRACT_TYPE]: 'SMART_CONTRACT_DEPLOYMENT_TXN_FEE',
      [TRANSACTION_TYPE.SMART_CONTRACT_EXECUTE_TYPE]: 'SMART_CONTRACT_EXECUTE_TXN_FEE',
      [TRANSACTION_TYPE.NFT_TYPE]: 'NFT_TXN_FEE',
      [TRANSACTION_TYPE.UPDATE_CONTRACT_TYPE]: 'UPDATE_CONTRACT_TXN_FEE',
      [TRANSACTION_TYPE.VALIDATOR_REGISTRATION_TYPE]: 'VALIDATOR_REGISTRATION_TXN_FEE',
      [TRANSACTION_TYPE.VALIDATOR_HEARTBEAT_TYPE]: 'VALIDATOR_HEARTBEAT_TXN_FEE',
      [TRANSACTION_TYPE.DELEGATED_VOTING_TYPE]: 'DELEGATED_VOTING_TXN_FEE',
      [TRANSACTION_TYPE.REVOKE_TYPE]: 'REVOKE_TXN_FEE',
      [TRANSACTION_TYPE.QUASH_TYPE]: 'QUASH_TXN_FEE',
      [TRANSACTION_TYPE.FAST_QUORUM_TYPE]: 'FAST_QUORUM_TXN_FEE',
      [TRANSACTION_TYPE.SELF_CURRENCY_EQUIV_TYPE]: 'SELF_CURRENCY_EQUIV_TXN_FEE',
      [TRANSACTION_TYPE.AUTHORIZED_CURRENCY_EQUIV_TYPE]: 'AUTHORIZED_CURRENCY_EQUIV_TXN_FEE',
      [TRANSACTION_TYPE.EXPENSE_RATIO_TYPE]: 'EXPENSE_RATIO_TXN_FEE',
      [TRANSACTION_TYPE.SMART_CONTRACT_INSTANTIATE_TYPE]: 'SMART_CONTRACT_INSTANTIATE_TXN_FEE',
      [TRANSACTION_TYPE.PROPOSAL_RESULT_TYPE]: 'PROPOSAL_RESULT_TXN_FEE'
    };
    
    return txTypeMap[transactionType] || null;
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
      transactionType = TRANSACTION_TYPE.COIN_TYPE,
      keyType = KEY_TYPE.ED25519
    } = params;

    // Basic size estimation based on transaction type
    let estimatedSize = 200; // Base size
    if (transactionType === TRANSACTION_TYPE.MINT_TYPE) {
      estimatedSize = 150;
    } else if (transactionType === TRANSACTION_TYPE.CONTRACT_TXN_TYPE) {
      estimatedSize = 500;
    }

    const signatureSize = SIGNATURE_SIZES[keyType] || SIGNATURE_SIZES[KEY_TYPE.ED25519];

    return {
      protobufSize: estimatedSize,
      signatureSize: signatureSize,
      totalSize: estimatedSize + signatureSize + HASH_SIZE,
      transactionType: transactionType,
      keyType: keyType
    };
  }

  /**
   * Get fee calculation constants for external use
   * @returns {Object} Fee calculation constants
   */
  static getFeeConstants() {
    return { ...FEE_CALCULATION_CONSTANTS };
  }

  /**
   * Update fee calculation constants
   * @param {Object} newConstants - New constants to merge
   */
  static updateFeeConstants(newConstants) {
    Object.assign(FEE_CALCULATION_CONSTANTS, newConstants);
  }

  /**
   * Calculate CoinTXN fee with iterative catch-22 solution
   * @param {Object} params - Fee calculation parameters
   * @param {Array} params.inputs - Input objects
   * @param {Array} params.outputs - Output objects
   * @param {string} params.contractId - Contract ID
   * @param {string} params.baseFeeId - Base fee instrument ID
   * @param {string} [params.baseMemo=''] - Base memo
   * @param {string} [params.contractFeeId] - Contract fee instrument
   * @param {Decimal|string|number} [params.contractFee] - Contract fee amount
   * @param {number} [params.transactionType=TRANSACTION_TYPE.COIN_TYPE] - Transaction type
   * @param {number} [params.maxIterations=10] - Maximum iterations for convergence
   * @param {number} [params.tolerance=1] - Size tolerance for convergence
   * @returns {Promise<Object>} Fee calculation result
   */
  static async calculateCoinTXNFee(params) {
    const {
      inputs,
      outputs,
      contractId,
      baseFeeId,
      baseMemo = '',
      contractFeeId,
      contractFee,
      transactionType = TRANSACTION_TYPE.COIN_TYPE,
      maxIterations = 10,
      tolerance = 1
    } = params;

    // Extract key types from inputs
    const keyTypes = inputs.map(input => input.keyType || KEY_TYPE.ED25519);

    // Create initial mock protobuf object for size estimation
    let currentProtoSize = this.estimateCoinTXNSize(inputs, outputs, baseMemo);
    let currentFee = '0';
    let iterations = 0;

    while (iterations < maxIterations) {
      // Create mock protobuf object with current size
      const mockProtoObject = {
        toBinary: () => new Uint8Array(currentProtoSize)
      };

      // Calculate fee based on current size
      const feeResult = await this.calculateNetworkFee({
        protoObject: mockProtoObject,
        keyTypes,
        transactionType,
        baseFeeId
      });

      const newFee = feeResult.fee;

      // Estimate new proto size based on fee (simplified estimation)
      const feeStringLength = newFee.length;
      const newProtoSize = this.estimateCoinTXNSize(inputs, outputs, baseMemo) + feeStringLength;

      const sizeDiff = Math.abs(newProtoSize - currentProtoSize);
      const feeDiff = Math.abs(parseFloat(newFee) - parseFloat(currentFee));

      if (sizeDiff <= tolerance && feeDiff <= 0.000001) {
        return {
          ...feeResult,
          size: this.calculateTotalTransactionSize(mockProtoObject, keyTypes),
          iterations: iterations + 1,
          converged: true,
          breakdown: {
            ...feeResult.breakdown,
            iterations: iterations + 1,
            converged: true
          }
        };
      }

      currentProtoSize = newProtoSize;
      currentFee = newFee;
      iterations++;
    }

    // Final calculation
    const finalMockProtoObject = {
      toBinary: () => new Uint8Array(currentProtoSize)
    };

    const finalFeeResult = await this.calculateNetworkFee({
      protoObject: finalMockProtoObject,
      keyTypes,
      transactionType,
      baseFeeId
    });

    return {
      ...finalFeeResult,
      size: this.calculateTotalTransactionSize(finalMockProtoObject, keyTypes),
      iterations,
      converged: false,
      breakdown: {
        ...finalFeeResult.breakdown,
        iterations,
        converged: false
      }
    };
  }

  /**
   * Estimate CoinTXN protobuf size (without signatures/hash)
   * @param {Array} inputs - Input objects
   * @param {Array} outputs - Output objects
   * @param {string} baseMemo - Base memo
   * @returns {number} Estimated protobuf size in bytes
   */
  static estimateCoinTXNSize(inputs, outputs, baseMemo = '') {
    // Base transaction size
    let size = 50; // Base transaction overhead
    
    // Add memo size
    if (baseMemo) {
      size += baseMemo.length;
    }
    
    // Add input sizes
    for (const input of inputs) {
      size += 50; // Base input overhead
      size += (input.publicKey || '').length;
      size += (input.amount || '').toString().length;
    }
    
    // Add output sizes
    for (const output of outputs) {
      size += 50; // Base output overhead
      size += (output.to || '').length;
      size += (output.amount || '').toString().length;
      if (output.memo) {
        size += output.memo.length;
      }
    }
    
    return size;
  }

  /**
   * Legacy method for backward compatibility
   * @param {Object} params - Fee calculation parameters
   * @returns {Promise<Object>} Fee calculation result
   */
  static async calculateFee(params) {
    // For backward compatibility, assume no contract fees
    return await this.calculateNetworkFee(params);
  }
}

// Re-export enums for external use
export { TRANSACTION_TYPE, CONTRACT_FEE_TYPE } from '../protobuf-enums.js';

// Export constants and calculator
export default {
  UniversalFeeCalculator,
  SIGNATURE_SIZES,
  FEE_CALCULATION_CONSTANTS,
  TRANSACTION_TYPE,
  CONTRACT_FEE_TYPE
};