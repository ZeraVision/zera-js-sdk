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
import { contractFeeService } from './contract-fee-service.js';
import { getKeyTypeFromPublicKey } from '../crypto/address-utils.js';
import { 
  SIGNATURE_SIZES, 
  HASH_SIZE, 
  FEE_CALCULATION_CONSTANTS,
  getFeeConstants,
  updateFeeConstants,
  getSignatureSize
} from './base-fee-constants.js';
import bs58 from 'bs58';

/**
 * Extract transaction type from a protobuf object
 * @param {Object} protoObject - The protobuf transaction object
 * @returns {number} Transaction type from TRANSACTION_TYPE enum
 */
function extractTransactionTypeFromProtoObject(protoObject) {
  try {
    // Check for specific transaction type fields in the protoObject
    if (protoObject.coinTxn) {
      return TRANSACTION_TYPE.COIN_TYPE;
    } else if (protoObject.mintTxn) {
      return TRANSACTION_TYPE.MINT_TYPE;
    } else if (protoObject.itemMintTxn) {
      return TRANSACTION_TYPE.ITEM_MINT_TYPE;
    } else if (protoObject.contractTxn) {
      return TRANSACTION_TYPE.CONTRACT_TXN_TYPE;
    } else if (protoObject.governanceVote) {
      return TRANSACTION_TYPE.VOTE_TYPE;
    } else if (protoObject.governanceProposal) {
      return TRANSACTION_TYPE.PROPOSAL_TYPE;
    } else if (protoObject.smartContractTxn) {
      return TRANSACTION_TYPE.SMART_CONTRACT_TYPE;
    } else if (protoObject.smartContractExecuteTxn) {
      return TRANSACTION_TYPE.SMART_CONTRACT_EXECUTE_TYPE;
    } else if (protoObject.selfCurEquiv) {
      return TRANSACTION_TYPE.SELF_CURRENCY_EQUIV_TYPE;
    } else if (protoObject.authorizedCurEquiv) {
      return TRANSACTION_TYPE.AUTHORIZED_CURRENCY_EQUIV_TYPE;
    } else if (protoObject.expenseRatioTxn) {
      return TRANSACTION_TYPE.EXPENSE_RATIO_TYPE;
    } else if (protoObject.nftTxn) {
      return TRANSACTION_TYPE.NFT_TYPE;
    } else if (protoObject.contractUpdateTxn) {
      return TRANSACTION_TYPE.UPDATE_CONTRACT_TYPE;
    } else if (protoObject.validatorRegistration) {
      return TRANSACTION_TYPE.VALIDATOR_REGISTRATION_TYPE;
    } else if (protoObject.validatorHeartbeat) {
      return TRANSACTION_TYPE.VALIDATOR_HEARTBEAT_TYPE;
    } else if (protoObject.proposalResult) {
      return TRANSACTION_TYPE.PROPOSAL_RESULT_TYPE;
    } else if (protoObject.delegatedTxn) {
      return TRANSACTION_TYPE.DELEGATED_VOTING_TYPE;
    } else if (protoObject.revokeTxn) {
      return TRANSACTION_TYPE.REVOKE_TYPE;
    } else if (protoObject.quashTxn) {
      return TRANSACTION_TYPE.QUASH_TYPE;
    } else if (protoObject.fastQuorumTxn) {
      return TRANSACTION_TYPE.FAST_QUORUM_TYPE;
    } else if (protoObject.complianceTxn) {
      return TRANSACTION_TYPE.COMPLIANCE_TYPE;
    } else if (protoObject.burnSbtTxn) {
      return TRANSACTION_TYPE.SBT_BURN_TYPE;
    } else if (protoObject.requiredVersion) {
      return TRANSACTION_TYPE.REQUIRED_VERSION;
    } else if (protoObject.smartContractInstantiateTxn) {
      return TRANSACTION_TYPE.SMART_CONTRACT_INSTANTIATE_TYPE;
    } else if (protoObject.allowanceTxn) {
      return TRANSACTION_TYPE.ALLOWANCE_TYPE;
    } else if (protoObject.foundationTxn) {
      return TRANSACTION_TYPE.FOUNDATION_TYPE;
    }
    
    // If we can't determine the type, throw an error
    throw new Error('Unable to determine transaction type from protoObject structure');
  } catch (error) {
    throw new Error(`Failed to extract transaction type from protoObject: ${error.message}`);
  }
}

/**
 * Extract key types from a transaction protobuf object
 * @param {Object} protoObject - The protobuf transaction object
 * @returns {Array} Array of key types
 */
function extractKeyTypesFromTransaction(protoObject) {
  const keyTypes = [];
  
  try {
    // Check if this is a CoinTXN (has auth field with public_key array)
    if (protoObject.auth && protoObject.auth.publicKey && Array.isArray(protoObject.auth.publicKey)) {
      // CoinTXN: extract key types from TransferAuthentication.public_key array
      for (const publicKey of protoObject.auth.publicKey) {
        if (publicKey.single) {
          // Single key - convert bytes to base58 identifier for key type detection
          const keyType = detectKeyTypeFromBytes(publicKey.single);
          if (keyType) {
            keyTypes.push(keyType);
          }
        } else if (publicKey.multi && publicKey.multi.publicKeys) {
          // Multi key - extract from each public key in the multi key
          for (const multiKeyBytes of publicKey.multi.publicKeys) {
            const keyType = detectKeyTypeFromBytes(multiKeyBytes);
            if (keyType) {
              keyTypes.push(keyType);
            }
          }
        }
      }
    } else if (protoObject.base && protoObject.base.publicKey) {
      // Non-CoinTXN: extract key type from BaseTXN.public_key
      const publicKey = protoObject.base.publicKey;
      if (publicKey.single) {
        const keyType = detectKeyTypeFromBytes(publicKey.single);
        if (keyType) {
          keyTypes.push(keyType);
        }
      } else if (publicKey.multi && publicKey.multi.publicKeys) {
        // Multi key in base transaction
        for (const multiKeyBytes of publicKey.multi.publicKeys) {
          const keyType = detectKeyTypeFromBytes(multiKeyBytes);
          if (keyType) {
            keyTypes.push(keyType);
          }
        }
      }
    }
  } catch (error) {
    throw new Error(`Failed to extract key types from transaction: ${error.message}`);
  }
  
  // Throw error if no key types found
  if (keyTypes.length === 0) {
    if (protoObject.auth && protoObject.auth.publicKey) {
      throw new Error('Failed to detect key types from CoinTXN transaction. Check that publicKey array contains valid key structures.');
    } else if (protoObject.base && protoObject.base.publicKey) {
      throw new Error('Failed to detect key type from BaseTXN transaction. Check that publicKey contains valid key structure.');
    } else {
      throw new Error('Failed to detect key types from transaction. Transaction must have either auth.publicKey (CoinTXN) or base.publicKey (other types).');
    }
  }
  
  return keyTypes;
}

/**
 * Detect key type from raw public key bytes
 * @param {Uint8Array} keyBytes - Raw public key bytes (may include KeyType_HashType prefixes)
 * @returns {string|null} Key type or null if detection fails
 */
function detectKeyTypeFromBytes(keyBytes) {
  try {    
    // Convert bytes to string to find the first underscore
    const keyString = new TextDecoder('utf-8').decode(keyBytes);
    const firstUnderscoreIndex = keyString.indexOf('_');
    
    if (firstUnderscoreIndex > 0) {
      // Extract the key type prefix (everything up to the first underscore)
      const keyTypePrefix = keyString.substring(0, firstUnderscoreIndex);
      
      if (keyTypePrefix === 'A') {
        return KEY_TYPE.ED25519;
      } else if (keyTypePrefix === 'B') {
        return KEY_TYPE.ED448;
      }
    }
  
    throw new Error(`Failed to detect key type from bytes. Unsupported key length: ${keyBytes.length} bytes. Expected 32 bytes (ED25519), 57 bytes (ED448), or bytes with KeyType_HashType prefixes.`);
  } catch (error) {
    if (error.message.includes('Failed to detect key type from bytes')) {
      throw error; // Re-throw our custom error
    }
    throw new Error(`Failed to detect key type from bytes: ${error.message}`);
  }
}

/**
 * Universal Fee Calculator
 * Uses proper fiat-based, size-dependent calculation
 */
export class UniversalFeeCalculator {
  /**
   * Calculate total transaction size from protobuf object + signatures + hash
   * @param {Object} protoObject - The protobuf transaction object (without signatures/hash)
   * @returns {number} Total transaction size in bytes
   */
  static calculateTotalTransactionSize(protoObject) {
    // Get the serialized size of the protobuf object
    const protoSize = protoObject.toBinary().length;
    
    // Auto-detect key types from transaction
    const keyTypes = extractKeyTypesFromTransaction(protoObject);
    
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
   * @param {string} [params.baseFeeId='$ZRA+0000'] - Base fee instrument ID
   * @returns {Promise<Object>} Network fee calculation result
   */
  static async calculateNetworkFee(params) {
    const {
      protoObject,
      baseFeeId = '$ZRA+0000'
    } = params;
    
    // Auto-detect transaction type from protobuf object
    const detectedTransactionType = extractTransactionTypeFromProtoObject(protoObject);
    
    // Auto-detect key types from transaction
    const keyTypes = extractKeyTypesFromTransaction(protoObject);
    
    // Calculate total transaction size
    const totalSize = this.calculateTotalTransactionSize(protoObject);
    
    // Auto-determine fee types based on transaction type and key types
    const feeTypesToUse = this.determineFeeTypes(detectedTransactionType, keyTypes);
    
    // Get fee values
    const feeValues = this.getFeeValues(feeTypesToUse);
    
    // Calculate total fee in USD
    const fixedFeeUSD = feeValues.fixed;
    const perByteFeeUSD = feeValues.perByte * totalSize;
    const totalFeeUSD = fixedFeeUSD + perByteFeeUSD;
    
    // Convert USD to target currency using ACE exchange rate
    const finalFeeInCurrency = await aceExchangeService.convertUSDToCurrency(totalFeeUSD, baseFeeId);
    
    return {
      fee: finalFeeInCurrency.toString(),
      feeId: baseFeeId,
      feeUSD: totalFeeUSD,
      totalSize: totalSize,
      protoSize: protoObject.toBinary().length,
      signatureSize: keyTypes.reduce((sum, keyType) => sum + (SIGNATURE_SIZES[keyType] || SIGNATURE_SIZES[KEY_TYPE.ED25519]), 0),
      hashSize: HASH_SIZE,
      transactionType: detectedTransactionType,
      breakdown: {
        feeTypes: feeTypesToUse,
        fixedFeeUSD: fixedFeeUSD,
        perByteFeeUSD: perByteFeeUSD,
        totalFeeUSD: totalFeeUSD,
        feeInCurrency: finalFeeInCurrency.toString(),
        totalSize: totalSize,
        protoSize: protoObject.toBinary().length,
        signatureSize: keyTypes.reduce((sum, keyType) => sum + (SIGNATURE_SIZES[keyType] || SIGNATURE_SIZES[KEY_TYPE.ED25519]), 0),
        hashSize: HASH_SIZE,
        transactionType: detectedTransactionType,
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
   * Calculate CoinTXN fee with iterative catch-22 solution
   * @param {Object} params - Fee calculation parameters
   * @param {Array} params.inputs - Input objects
   * @param {Array} params.outputs - Output objects
   * @param {string} params.contractId - Contract ID
   * @param {string} [params.baseFeeId='$ZRA+0000'] - Base fee instrument ID
   * @param {string} [params.baseMemo=''] - Base memo
   * @param {string} [params.contractFeeId] - Contract fee instrument
   * @param {Decimal|string|number} [params.contractFee] - Contract fee amount
   * @param {number} [params.maxIterations=10] - Maximum iterations for convergence
   * @param {number} [params.tolerance=1] - Size tolerance for convergence
   * @returns {Promise<Object>} Fee calculation result
   */
  static async calculateCoinTXNFee(params) {
    const {
      inputs,
      outputs,
      contractId,
      baseFeeId = '$ZRA+0000',
      baseMemo = '',
      contractFeeId,
      contractFee,
      maxIterations = 10,
      tolerance = 1
    } = params;

    // Auto-detect transaction type (default to COIN_TYPE for CoinTXN)
    const detectedTransactionType = TRANSACTION_TYPE.COIN_TYPE;

    // Create initial mock protobuf object for size estimation
    let currentProtoSize = this.estimateCoinTXNSize(inputs, outputs, baseMemo);
    let currentFee = '0';
    let iterations = 0;

    while (iterations < maxIterations) {
      // Create mock protobuf object with current size and key structure for auto-detection
      const mockProtoObject = {
        toBinary: () => new Uint8Array(currentProtoSize),
        auth: {
          publicKey: inputs.map(input => ({
            single: new Uint8Array(input.keyType === KEY_TYPE.ED448 ? 57 : 32)
          }))
        }
      };

      // Calculate fee based on current size
      const feeResult = await this.calculateNetworkFee({
        protoObject: mockProtoObject,
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
          size: this.calculateTotalTransactionSize(mockProtoObject),
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
      toBinary: () => new Uint8Array(currentProtoSize),
      auth: {
        publicKey: inputs.map(input => ({
          single: new Uint8Array(input.keyType === KEY_TYPE.ED448 ? 57 : 32)
        }))
      }
    };

    const finalFeeResult = await this.calculateNetworkFee({
      protoObject: finalMockProtoObject,
      baseFeeId
    });

    return {
      ...finalFeeResult,
      size: this.calculateTotalTransactionSize(finalMockProtoObject),
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
   * Auto-calculate network fee with full auto-detection
   * @param {Object} params - Fee calculation parameters
   * @param {Object} params.protoObject - The protobuf transaction object (without signatures/hash)
   * @param {string} [params.baseFeeId='$ZRA+0000'] - Base fee instrument ID
   * @returns {Promise<Object>} Network fee calculation result with auto-detected transaction type and fee types
   */
  static async autoCalculateNetworkFee(params) {
    const { protoObject, baseFeeId = '$ZRA+0000' } = params;
    
    // Since calculateNetworkFee now does full auto-detection, just call it directly
    return await this.calculateNetworkFee({
      protoObject,
      baseFeeId
    });
  }

  /**
   * Unified fee calculation method
   * Calculates both network fees and contract fees (for CoinTXN transactions)
   * Adds fees to the protobuf object and returns the modified object
   * @param {Object} params - Fee calculation parameters
   * @param {Object} params.protoObject - The protobuf transaction object (without signatures/hash)
   * @param {string} [params.baseFeeId='$ZRA+0000'] - Base fee instrument ID
   * @param {string} [params.contractFeeId] - Contract fee instrument ID (for CoinTXN only)
   * @param {Decimal|string|number} [params.transactionAmount] - Transaction amount (for contract fee calculation)
   * @returns {Promise<Object>} Unified fee calculation result with modified proto object
   */
  static async calculateFee(params) {
    const {
      protoObject,
      baseFeeId = '$ZRA+0000',
      contractFeeId,
      transactionAmount
    } = params;

    // Create a copy of the proto object to avoid modifying the original
    const modifiedProtoObject = this.cloneProtoObject(protoObject);
    
    // Check if this is a CoinTXN transaction and contractFeeId is provided
    const transactionType = extractTransactionTypeFromProtoObject(modifiedProtoObject);
    let contractFee = null;

    // STEP 1: Calculate contract fee FIRST (if applicable)
    if (transactionType === TRANSACTION_TYPE.COIN_TYPE && contractFeeId) {
      try {
        // Extract contract ID from the transaction
        const contractId = this.extractContractIdFromTransaction(modifiedProtoObject);
        
        if (contractId) {
          // Calculate contract fee using the service
          contractFee = await contractFeeService.calculateContractFee({
            contractId,
            transactionAmount: transactionAmount || '0',
            feeContractId: contractFeeId,
            transactionContractId: contractId // Use the same contract ID for transaction instrument
          });

          // Add contract fee to the proto object
          this.addContractFeeToProtoObject(modifiedProtoObject, contractFee);
        }
      } catch (error) {
        throw new Error(`Contract fee calculation failed: ${error.message}`);
      }
    }

    // STEP 2: Calculate network fee based on the modified proto object (which now includes contract fees)
    const networkFee = await this.calculateNetworkFee({
      protoObject: modifiedProtoObject,
      baseFeeId
    });

    // Add network fee to the proto object
    this.addNetworkFeeToProtoObject(modifiedProtoObject, networkFee, baseFeeId);

    // Calculate total fees
    const networkFeeDecimal = this.toDecimal(networkFee.fee);
    const contractFeeDecimal = contractFee ? this.toDecimal(contractFee.fee) : new Decimal(0);
    const totalFeeDecimal = addAmounts(networkFeeDecimal, contractFeeDecimal);

    return {
      protoObject: modifiedProtoObject, // Return the modified proto object
      totalFee: totalFeeDecimal.toString(),
      totalFeeDecimal: totalFeeDecimal,
      networkFee: networkFee.fee,
      contractFee: contractFee ? contractFee.fee : '0',
      feeId: baseFeeId,
      contractFeeId: contractFeeId || null,
      breakdown: {
        network: networkFee,
        contract: contractFee,
        total: totalFeeDecimal.toString()
      }
    };
  }

  /**
   * Clone a protobuf object to avoid modifying the original
   * @param {Object} protoObject - Original protobuf object
   * @returns {Object} Cloned protobuf object
   */
  static cloneProtoObject(protoObject) {
    // For now, we'll do a shallow clone
    // In a real implementation, you might want to use protobuf's clone method if available
    return JSON.parse(JSON.stringify(protoObject));
  }

  /**
   * Add contract fee to the protobuf object
   * @param {Object} protoObject - Protobuf object to modify
   * @param {Object} contractFee - Contract fee calculation result
   */
  static addContractFeeToProtoObject(protoObject, contractFee) {
    // For CoinTXN, add contract fee to the base transaction
    if (protoObject.base) {
      protoObject.base.contractFeeAmount = contractFee.fee;
      protoObject.base.contractFeeId = contractFee.feeContractId;
    } else {
      // For other transaction types, add directly to the object
      protoObject.contractFeeAmount = contractFee.fee;
      protoObject.contractFeeId = contractFee.feeContractId;
    }
  }

  /**
   * Add network fee to the protobuf object
   * @param {Object} protoObject - Protobuf object to modify
   * @param {Object} networkFee - Network fee calculation result
   * @param {string} baseFeeId - Base fee instrument ID
   */
  static addNetworkFeeToProtoObject(protoObject, networkFee, baseFeeId) {
    // For CoinTXN, add network fee to the base transaction
    if (protoObject.base) {
      protoObject.base.baseFeeAmount = networkFee.fee;
      protoObject.base.baseFeeId = baseFeeId;
    } else {
      // For other transaction types, add directly to the object
      protoObject.baseFeeAmount = networkFee.fee;
      protoObject.baseFeeId = baseFeeId;
    }
  }

  /**
   * Extract contract ID from transaction protobuf object
   * @param {Object} protoObject - The protobuf transaction object
   * @returns {string|null} Contract ID or null if not found
   */
  static extractContractIdFromTransaction(protoObject) {
    try {
      // For CoinTXN, check the base transaction
      if (protoObject.base && protoObject.base.contractId) {
        return protoObject.base.contractId;
      }
      
      // For other transaction types, check if they have a contractId field
      if (protoObject.contractId) {
        return protoObject.contractId;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Legacy method for backward compatibility
   * @param {Object} params - Fee calculation parameters
   * @returns {Promise<Object>} Fee calculation result
   */
  static async calculateFeeLegacy(params) {
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
  CONTRACT_FEE_TYPE,
  contractFeeService
};