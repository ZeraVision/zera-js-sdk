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
  toSmallestUnits,
  addAmounts, 
  multiplyAmounts, 
  divideAmounts, 
  calculatePercentage,
  Decimal 
} from '../utils/amount-utils.js';
import { aceExchangeService } from '../../api/zv-indexer/rate/ace.js';
import { contractFeeService } from './contract-fee-service.js';
import { toBinary } from '@bufbuild/protobuf';
import {
  CoinTXNSchema as CoinTXN,
  MintTXNSchema as MintTXN,
  ItemizedMintTXNSchema as ItemizedMintTXN,
  InstrumentContractSchema as InstrumentContract,
  GovernanceVoteSchema as GovernanceVote,
  GovernanceProposalSchema as GovernanceProposal,
  SmartContractTXNSchema as SmartContractTXN,
  SmartContractExecuteTXNSchema as SmartContractExecuteTXN,
  SmartContractInstantiateTXNSchema as SmartContractInstantiateTXN,
  SelfCurrencyEquivSchema as SelfCurrencyEquiv,
  AuthorizedCurrencyEquivSchema as AuthorizedCurrencyEquiv,
  ExpenseRatioTXNSchema as ExpenseRatioTXN,
  NFTTXNSchema as NFTTXN,
  ContractUpdateTXNSchema as ContractUpdateTXN,
  FoundationTXNSchema as FoundationTXN,
  DelegatedTXNSchema as DelegatedTXN,
  QuashTXNSchema as QuashTXN,
  FastQuorumTXNSchema as FastQuorumTXN,
  RevokeTXNSchema as RevokeTXN,
  ComplianceTXNSchema as ComplianceTXN,
  BurnSBTTXNSchema as BurnSBTTXN,
  AllowanceTXNSchema as AllowanceTXN
} from '../../../proto/generated/txn_pb.js';
import { getKeyTypeFromPublicKey, getHashTypesFromPublicKey } from '../crypto/address-utils.js';
import { 
  SIGNATURE_SIZES, 
  HASH_SIZES,
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
    // First check if this is a direct transaction object (not wrapped)
    if (protoObject.$typeName) {
      const typeName = protoObject.$typeName;
      if (typeName === 'zera_txn.CoinTXN') {
        return TRANSACTION_TYPE.COIN_TYPE;
      } else if (typeName === 'zera_txn.MintTXN') {
        return TRANSACTION_TYPE.MINT_TYPE;
      } else if (typeName === 'zera_txn.ItemizedMintTXN') {
        return TRANSACTION_TYPE.ITEM_MINT_TYPE;
      } else if (typeName === 'zera_txn.InstrumentContract') {
        return TRANSACTION_TYPE.CONTRACT_TXN_TYPE;
      } else if (typeName === 'zera_txn.GovernanceVote') {
        return TRANSACTION_TYPE.VOTE_TYPE;
      } else if (typeName === 'zera_txn.GovernanceProposal') {
        return TRANSACTION_TYPE.PROPOSAL_TYPE;
      } else if (typeName === 'zera_txn.SmartContractTXN') {
        return TRANSACTION_TYPE.SMART_CONTRACT_TYPE;
      } else if (typeName === 'zera_txn.SmartContractExecuteTXN') {
        return TRANSACTION_TYPE.SMART_CONTRACT_EXECUTE_TYPE;
      } else if (typeName === 'zera_txn.SelfCurrencyEquiv') {
        return TRANSACTION_TYPE.SELF_CURRENCY_EQUIV_TYPE;
      } else if (typeName === 'zera_txn.AuthorizedCurrencyEquiv') {
        return TRANSACTION_TYPE.AUTHORIZED_CURRENCY_EQUIV_TYPE;
      } else if (typeName === 'zera_txn.ExpenseRatioTXN') {
        return TRANSACTION_TYPE.EXPENSE_RATIO_TYPE;
      } else if (typeName === 'zera_txn.NFTTXN') {
        return TRANSACTION_TYPE.NFT_TYPE;
      } else if (typeName === 'zera_txn.ContractUpdateTXN') {
        return TRANSACTION_TYPE.UPDATE_CONTRACT_TYPE;
      } else if (typeName === 'zera_txn.ValidatorRegistration') {
        return TRANSACTION_TYPE.VALIDATOR_REGISTRATION_TYPE;
      } else if (typeName === 'zera_txn.ValidatorHeartbeat') {
        return TRANSACTION_TYPE.VALIDATOR_HEARTBEAT_TYPE;
      } else if (typeName === 'zera_txn.ProposalResult') {
        return TRANSACTION_TYPE.PROPOSAL_RESULT_TYPE;
      } else if (typeName === 'zera_txn.DelegatedTXN') {
        return TRANSACTION_TYPE.DELEGATED_VOTING_TYPE;
      } else if (typeName === 'zera_txn.RevokeTXN') {
        return TRANSACTION_TYPE.REVOKE_TYPE;
      } else if (typeName === 'zera_txn.QuashTXN') {
        return TRANSACTION_TYPE.QUASH_TYPE;
      } else if (typeName === 'zera_txn.FastQuorumTXN') {
        return TRANSACTION_TYPE.FAST_QUORUM_TYPE;
      } else if (typeName === 'zera_txn.ComplianceTXN') {
        return TRANSACTION_TYPE.COMPLIANCE_TYPE;
      } else if (typeName === 'zera_txn.BurnSBTTXN') {
        return TRANSACTION_TYPE.SBT_BURN_TYPE;
      } else if (typeName === 'zera_txn.RequiredVersion') {
        return TRANSACTION_TYPE.REQUIRED_VERSION;
      } else if (typeName === 'zera_txn.SmartContractInstantiateTXN') {
        return TRANSACTION_TYPE.SMART_CONTRACT_INSTANTIATE_TYPE;
      } else if (typeName === 'zera_txn.AllowanceTXN') {
        return TRANSACTION_TYPE.ALLOWANCE_TYPE;
      } else if (typeName === 'zera_txn.FoundationTXN') {
        return TRANSACTION_TYPE.FOUNDATION_TYPE;
      }
    }
    
    // Fallback: Check for specific transaction type fields in wrapped protoObject
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
    // Check if this is a CoinTXN (has auth field with publicKey array)
    if (protoObject.auth && protoObject.auth.publicKey && Array.isArray(protoObject.auth.publicKey)) {
      // CoinTXN: extract key types from TransferAuthentication.publicKey array
      for (const publicKey of protoObject.auth.publicKey) {
        if (publicKey.single) {
          // Single key - convert bytes back to string identifier for key type detection
          const publicKeyString = Buffer.from(publicKey.single).toString('utf8');
          const keyType = detectKeyTypeFromIdentifier(publicKeyString);
          if (keyType) {
            keyTypes.push(keyType);
          }
        } else if (publicKey.multi && publicKey.multi.publicKeys) {
          throw new Error('multi signature wallet not yet supported in SDK'); // TODO
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
        throw new Error('multi signature wallet not yet supported in SDK'); // TODO
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
 * Extract hash types from a transaction protobuf object
 * @param {Object} protoObject - The protobuf transaction object
 * @returns {Array} Array of hash types
 */
function extractHashTypesFromTransaction(protoObject) {
  const hashTypes = [];
  
  try {
    // Check if this is a CoinTXN (has auth field with publicKey array)
    if (protoObject.auth && protoObject.auth.publicKey && Array.isArray(protoObject.auth.publicKey)) {
      // CoinTXN: extract hash types from TransferAuthentication.publicKey array
      for (const publicKey of protoObject.auth.publicKey) {
        if (publicKey.single) {
          // Single key - convert bytes back to string identifier for hash type detection
          const publicKeyString = Buffer.from(publicKey.single).toString('utf8');
          try {
            const keyHashTypes = getHashTypesFromPublicKey(publicKeyString);
            hashTypes.push(...keyHashTypes);
          } catch (error) {
            // If we can't extract hash types from this key, skip it
            console.warn(`Failed to extract hash types from key: ${error.message}`);
          }
        } else if (publicKey.multi && publicKey.multi.publicKeys) {
          throw new Error('multi signature wallet not yet supported in SDK'); // TODO
        }
      }
    } else if (protoObject.base && protoObject.base.publicKey) {
      // Non-CoinTXN: extract hash types from BaseTXN.public_key
      const publicKey = protoObject.base.publicKey;
      if (publicKey.single) {
        const publicKeyString = Buffer.from(publicKey.single).toString('utf8');
        try {
          const keyHashTypes = getHashTypesFromPublicKey(publicKeyString);
          hashTypes.push(...keyHashTypes);
        } catch (error) {
          // If we can't extract hash types from this key, skip it
          console.warn(`Failed to extract hash types from key: ${error.message}`);
        }
      } else if (publicKey.multi && publicKey.multi.publicKeys) {
        throw new Error('multi signature wallet not yet supported in SDK'); // TODO
      }
    }
  } catch (error) {
    throw new Error(`Failed to extract hash types from transaction: ${error.message}`);
  }
  
  // If no hash types found, return empty array (transaction might not have hash types)
  return hashTypes;
}

/**
 * Detect key type from public key identifier string
 * @param {string} keyIdentifier - Public key identifier (e.g., "A_c_pubkeybytes")
 * @returns {number} Key type from KEY_TYPE enum
 */
function detectKeyTypeFromIdentifier(keyIdentifier) {
  try {
    const firstUnderscoreIndex = keyIdentifier.indexOf('_');
    
    if (firstUnderscoreIndex > 0) {
      // Extract the key type prefix (everything up to the first underscore)
      const keyTypePrefix = keyIdentifier.substring(0, firstUnderscoreIndex);
      
      if (keyTypePrefix === 'A') {
        return KEY_TYPE.ED25519;
      } else if (keyTypePrefix === 'B') {
        return KEY_TYPE.ED448;
      }
    }
  
    throw new Error(`Failed to detect key type from identifier: ${keyIdentifier}`);
  } catch (error) {
    console.error(`Error detecting key type from identifier: ${error.message}`);
    return null;
  }
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
 * Get the protobuf schema for a transaction type
 * @param {string} transactionType - Transaction type constant
 * @returns {Object} Protobuf schema
 */
function getSchemaForTransactionType(transactionType) {
  switch (transactionType) {
    case TRANSACTION_TYPE.COIN_TYPE:
      return CoinTXN;
    case TRANSACTION_TYPE.MINT_TYPE:
      return MintTXN;
    case TRANSACTION_TYPE.ITEM_MINT_TYPE:
      return ItemizedMintTXN;
    case TRANSACTION_TYPE.CONTRACT_TXN_TYPE:
      return InstrumentContract;
    case TRANSACTION_TYPE.VOTE_TYPE:
      return GovernanceVote;
    case TRANSACTION_TYPE.PROPOSAL_TYPE:
      return GovernanceProposal;
    case TRANSACTION_TYPE.SMART_CONTRACT_TYPE:
      return SmartContractTXN;
    case TRANSACTION_TYPE.SMART_CONTRACT_EXECUTE_TYPE:
      return SmartContractExecuteTXN;
    case TRANSACTION_TYPE.SMART_CONTRACT_INSTANTIATE_TYPE:
      return SmartContractInstantiateTXN;
    case TRANSACTION_TYPE.CURRENCY_EQUIV_TYPE:
      return SelfCurrencyEquiv;
    case TRANSACTION_TYPE.AUTH_CURRENCY_EQUIV_TYPE:
      return AuthorizedCurrencyEquiv;
    case TRANSACTION_TYPE.EXPENSE_RATIO_TYPE:
      return ExpenseRatioTXN;
    case TRANSACTION_TYPE.NFT_TYPE:
      return NFTTXN;
    case TRANSACTION_TYPE.CONTRACT_UPDATE_TYPE:
      return ContractUpdateTXN;
    case TRANSACTION_TYPE.FOUNDATION_TYPE:
      return FoundationTXN;
    case TRANSACTION_TYPE.DELEGATED_TYPE:
      return DelegatedTXN;
    case TRANSACTION_TYPE.QUASH_TYPE:
      return QuashTXN;
    case TRANSACTION_TYPE.FAST_QUORUM_TYPE:
      return FastQuorumTXN;
    case TRANSACTION_TYPE.REVOKE_TYPE:
      return RevokeTXN;
    case TRANSACTION_TYPE.COMPLIANCE_TYPE:
      return ComplianceTXN;
    case TRANSACTION_TYPE.BURN_SBT_TYPE:
      return BurnSBTTXN;
    case TRANSACTION_TYPE.ALLOWANCE_TYPE:
      return AllowanceTXN;
    default:
      throw new Error(`Unknown transaction type: ${transactionType}`);
  }
}

/**
 * Sanitize protobuf object by converting BigInt values to strings for serialization
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeForSerialization(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  // Preserve Uint8Array objects (they're needed for key extraction)
  if (obj instanceof Uint8Array) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForSerialization(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeForSerialization(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Calculate protobuf size using proper @bufbuild/protobuf toBinary function
 * @param {Object} protoObject - The protobuf transaction object
 * @param {string} transactionType - Transaction type constant
 * @returns {number} Protobuf size in bytes
 */
function calculateProtobufSize(protoObject, transactionType) {
  const schema = getSchemaForTransactionType(transactionType);
  // Sanitize the proto object to convert BigInt values to strings
  const sanitizedProtoObject = sanitizeForSerialization(protoObject);
  const binary = toBinary(schema, sanitizedProtoObject);
  return binary.length;
}
export class UniversalFeeCalculator {
  // Cache for exchange rates with timestamps to avoid duplicate API calls
  static exchangeRateCache = new Map(); // contractId -> { rate: Decimal, timestamp: number }
  // Pending requests to prevent duplicate API calls for the same contract ID
  static pendingRequests = new Map(); // contractId -> Promise<Decimal>
  
  /**
   * Get cached exchange rate or fetch and cache it with 2-second expiration
   * Prevents duplicate API calls even when called in parallel
   * @param {string} contractId - Contract ID to get exchange rate for
   * @returns {Promise<Decimal>} Exchange rate
   */
  static async getExchangeRate(contractId) {
    const now = Date.now();
    const cacheEntry = this.exchangeRateCache.get(contractId);
    
    // Check if we have a valid cache entry (less than 2 seconds old)
    if (cacheEntry && (now - cacheEntry.timestamp) < 2000) {
      return cacheEntry.rate;
    }
    
    // Check if there's already a pending request for this contract ID
    if (this.pendingRequests.has(contractId)) {
      return await this.pendingRequests.get(contractId);
    }
    
    // Create a new request and store it to prevent duplicates
    const requestPromise = this.fetchAndCacheRate(contractId, now);
    this.pendingRequests.set(contractId, requestPromise);
    
    try {
      const rate = await requestPromise;
      return rate;
    } finally {
      // Clean up the pending request
      this.pendingRequests.delete(contractId);
    }
  }
  
  /**
   * Fetch exchange rate from API and cache it
   * @param {string} contractId - Contract ID to fetch rate for
   * @param {number} timestamp - Current timestamp
   * @returns {Promise<Decimal>} Exchange rate
   */
  static async fetchAndCacheRate(contractId, timestamp) {
    // Fetch and cache the rate with timestamp
    const rate = await aceExchangeService.getExchangeRate(contractId);
    this.exchangeRateCache.set(contractId, {
      rate: rate,
      timestamp: timestamp
    });
    
    // Clean up expired entries (older than 2 seconds)
    this.cleanupExpiredCacheEntries(timestamp);
    
    return rate;
  }
  
  /**
   * Clean up expired cache entries (older than 2 seconds)
   * @param {number} currentTime - Current timestamp
   */
  static cleanupExpiredCacheEntries(currentTime) {
    for (const [contractId, entry] of this.exchangeRateCache.entries()) {
      if (currentTime - entry.timestamp >= 2000) {
        this.exchangeRateCache.delete(contractId);
      }
    }
  }
  
  /**
   * Clear the exchange rate cache
   */
  static clearExchangeRateCache() {
    this.exchangeRateCache.clear();
  }
  
  /**
   * Get cache statistics for debugging
   * @returns {Object} Cache statistics
   */
  static getCacheStats() {
    const now = Date.now();
    const stats = {
      totalEntries: this.exchangeRateCache.size,
      validEntries: 0,
      expiredEntries: 0,
      entries: []
    };
    
    for (const [contractId, entry] of this.exchangeRateCache.entries()) {
      const age = now - entry.timestamp;
      const isValid = age < 2000;
      
      if (isValid) {
        stats.validEntries++;
      } else {
        stats.expiredEntries++;
      }
      
      stats.entries.push({
        contractId,
        age: age,
        isValid: isValid,
        rate: entry.rate.toString()
      });
    }
    
    return stats;
  }

  /**
   * Calculate total transaction size from protobuf object + signatures + hashes
   * @param {Object} protoObject - The protobuf transaction object (without signatures/hash)
   * @returns {number} Total transaction size in bytes
   */
  static calculateTotalTransactionSize(protoObject) {
    // Auto-detect transaction type from protobuf object
    const detectedTransactionType = extractTransactionTypeFromProtoObject(protoObject);
    
    // Get the serialized size of the protobuf object using proper @bufbuild/protobuf
    const protoSize = calculateProtobufSize(protoObject, detectedTransactionType);
    
    // Auto-detect key types from transaction
    const keyTypes = extractKeyTypesFromTransaction(protoObject);
    
    // Calculate signature sizes
    let signatureSize = 0;
    for (const keyType of keyTypes) {
      signatureSize += SIGNATURE_SIZES[keyType.toUpperCase()] || SIGNATURE_SIZES.ED25519;
    }
    
    // Auto-detect hash types and calculate total hash size
    const hashTypes = extractHashTypesFromTransaction(protoObject);
    let totalHashSize = 0;
    for (const hashType of hashTypes) {
      totalHashSize += HASH_SIZES[hashType] || HASH_SIZE; // fallback to default hash size
    }
    
    // If no hash types detected, use default hash size
    if (totalHashSize === 0) {
      totalHashSize = HASH_SIZE;
    }
    
    return protoSize + signatureSize + totalHashSize;
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
      baseFeeId = '$ZRA+0000',
      exchangeRates = null // Optional pre-fetched exchange rates
    } = params;
    
    // Auto-detect transaction type from protobuf object
    const detectedTransactionType = extractTransactionTypeFromProtoObject(protoObject);
    
    // Auto-detect key types from transaction
    const keyTypes = extractKeyTypesFromTransaction(protoObject);
    
    // Auto-detect hash types from transaction
    const hashTypes = extractHashTypesFromTransaction(protoObject);
    
    // Calculate total transaction size
    const totalSize = this.calculateTotalTransactionSize(protoObject);
    
    // Auto-determine fee types based on transaction type, key types, and hash types
    const feeTypesToUse = this.determineFeeTypes(detectedTransactionType, keyTypes, hashTypes);
    
    // Get fee values
    const feeValues = this.getFeeValues(feeTypesToUse);
    
    // Calculate total fee in USD
    const fixedFeeUSD = feeValues.fixed;
    const perByteFeeUSD = feeValues.perByte * totalSize;
    const totalFeeUSD = fixedFeeUSD + perByteFeeUSD;
    
    // Convert USD to target currency using cached exchange rate
    let exchangeRate;
    if (exchangeRates && exchangeRates.has(baseFeeId)) {
      exchangeRate = exchangeRates.get(baseFeeId);
    } else {
      console.warn(`Exchange rate for ${baseFeeId} not found in pre-fetched rates, fetching separately`);
      exchangeRate = await this.getExchangeRate(baseFeeId);
    }
    const finalFeeInCurrency = new Decimal(totalFeeUSD).div(exchangeRate);
    
    // Calculate actual hash size based on detected hash types
    let actualHashSize = 0;
    for (const hashType of hashTypes) {
      actualHashSize += HASH_SIZES[hashType] || HASH_SIZE; // fallback to default hash size
    }
    // If no hash types detected, use default hash size
    if (actualHashSize === 0) {
      actualHashSize = HASH_SIZE;
    }
    
    return {
      fee: finalFeeInCurrency.toString(),
      feeId: baseFeeId,
      feeUSD: totalFeeUSD,
      totalSize: totalSize,
      protoSize: calculateProtobufSize(protoObject, detectedTransactionType),
      signatureSize: keyTypes.reduce((sum, keyType) => sum + (SIGNATURE_SIZES[keyType.toUpperCase()] || SIGNATURE_SIZES.ED25519), 0),
      hashSize: actualHashSize,
      transactionType: detectedTransactionType,
      breakdown: {
        feeTypes: feeTypesToUse,
        fixedFeeUSD: fixedFeeUSD,
        perByteFeeUSD: perByteFeeUSD,
        totalFeeUSD: totalFeeUSD,
        feeInCurrency: finalFeeInCurrency.toString(),
        totalSize: totalSize,
        protoSize: calculateProtobufSize(protoObject, detectedTransactionType),
        signatureSize: keyTypes.reduce((sum, keyType) => sum + (SIGNATURE_SIZES[keyType.toUpperCase()] || SIGNATURE_SIZES.ED25519), 0),
        hashSize: actualHashSize,
        transactionType: detectedTransactionType,
        keyCount: keyTypes.length,
        hashTypes: hashTypes,
        hashCount: hashTypes.length,
        exchangeRate: exchangeRate.toString()
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
   * Calculate interface-specific fee using Decimal for exact arithmetic
   * Interface fees can be applied to any transaction type and are typically used for
   * third-party services, APIs, or interface providers
   * @param {Object} params - Interface fee parameters
   * @param {Decimal|string|number} params.interfaceFeeAmount - Interface fee amount (in human-readable units)
   * @param {string} params.interfaceFeeId - Contract ID to pay the interface fee in
   * @param {string} params.interfaceAddress - Interface provider address (required when interfaceFeeId is specified)
   * @returns {Object} Interface fee calculation result
   */
  static calculateInterfaceFee(params) {
    const {
      interfaceFeeAmount,
      interfaceFeeId,
      interfaceAddress
    } = params;

    // Validate required parameters
    if (!interfaceFeeId) {
      throw new Error('interfaceFeeId is required for interface fee calculation');
    }

    if (!interfaceFeeAmount || parseFloat(interfaceFeeAmount) <= 0) {
      throw new Error('interfaceFeeAmount must be specified and greater than 0 when interfaceFeeId is provided');
    }

    if (!interfaceAddress) {
      throw new Error('interfaceAddress is required when interfaceFeeId is specified');
    }

    // Convert amount to smallest units (like other fee calculations)
    const feeAmountInSmallestUnits = toSmallestUnits(interfaceFeeAmount, interfaceFeeId);
    const feeAmountDecimal = this.toDecimal(feeAmountInSmallestUnits);

    // If the calculated fee is 0, return null values
    if (feeAmountDecimal.isZero()) {
      return {
        fee: null, // Set to null when amount is 0
        feeDecimal: new Decimal(0),
        interfaceFeeId: null, // Set to null when amount is 0
        interfaceAddress: null, // Set to null when amount is 0
        breakdown: {
          interfaceFeeAmount: interfaceFeeAmount,
          interfaceFeeAmountInSmallestUnits: '0',
          interfaceFeeId: null,
          interfaceAddress: null,
          calculatedFee: '0'
        }
      };
    }

    return {
      fee: feeAmountDecimal.toString(), // Return as string for protobuf compatibility
      feeDecimal: feeAmountDecimal, // Also provide Decimal version
      interfaceFeeId: interfaceFeeId,
      interfaceAddress: interfaceAddress,
      breakdown: {
        interfaceFeeAmount: interfaceFeeAmount, // Original human-readable amount
        interfaceFeeAmountInSmallestUnits: feeAmountDecimal.toString(), // Converted to smallest units
        interfaceFeeId: interfaceFeeId,
        interfaceAddress: interfaceAddress,
        calculatedFee: feeAmountDecimal.toString()
      }
    };
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

    // If the calculated fee is 0, return null values
    if (calculatedFeeDecimal.isZero()) {
      return {
        fee: null, // Set to null when amount is 0
        feeDecimal: new Decimal(0),
        contractId: null, // Set to null when amount is 0
        contractFeeType: contractFeeType,
        contractFeeAmount: null, // Set to null when amount is 0
        feeContractId: null, // Set to null when amount is 0
        breakdown: {
          contractId: null,
          contractFeeType: contractFeeType,
          contractFeeAmount: feeAmountDecimal.toString(),
          transactionAmount: transactionAmountDecimal.toString(),
          calculatedFee: '0',
          feeContractId: null
        }
      };
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
   * Calculate total fees (network + contract + interface) using Decimal for exact arithmetic
   * @param {Object} params - Fee calculation parameters
   * @param {Object} params.protoObject - The protobuf transaction object (without signatures/hash)
   * @param {string} params.contractId - Contract ID
   * @param {number} params.contractFeeType - Contract fee type (from protobuf CONTRACT_FEE_TYPE enum)
   * @param {Decimal|string|number} params.contractFeeAmount - Contract fee amount
   * @param {Decimal|string|number} params.transactionAmount - Transaction amount
   * @param {string} params.feeContractId - Contract ID to pay fees in
   * @param {string} [params.baseFeeId='$ZRA+0000'] - Base fee instrument ID
   * @param {Decimal|string|number} [params.interfaceFeeAmount] - Interface fee amount (required if interfaceFeeId is specified)
   * @param {string} [params.interfaceFeeId] - Interface fee contract ID (triggers interface fee calculation)
   * @param {string} [params.interfaceAddress] - Interface provider address (required if interfaceFeeId is specified)
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

    // Calculate interface fee (only if interfaceFeeId is specified)
    const interfaceFee = params.interfaceFeeId ? this.calculateInterfaceFee({
      interfaceFeeAmount: params.interfaceFeeAmount,
      interfaceFeeId: params.interfaceFeeId,
      interfaceAddress: params.interfaceAddress
    }) : null;

    // Convert fees to Decimal for exact calculation
    const networkFeeDecimal = this.toDecimal(networkFee.fee);
    const contractFeeDecimal = contractFee.feeDecimal;
    const interfaceFeeDecimal = interfaceFee ? interfaceFee.feeDecimal : new Decimal(0);
    const transactionAmountDecimal = this.toDecimal(params.transactionAmount);

    const totalFeeDecimal = addAmounts(addAmounts(networkFeeDecimal, contractFeeDecimal), interfaceFeeDecimal);
    const totalAmountDecimal = addAmounts(transactionAmountDecimal, totalFeeDecimal);

    return {
      totalFee: totalFeeDecimal.toString(), // String for protobuf compatibility
      totalFeeDecimal: totalFeeDecimal, // Decimal version
      networkFee: networkFee.fee,
      contractFee: contractFee.fee,
      interfaceFee: interfaceFee ? interfaceFee.fee : '0',
      totalAmount: totalAmountDecimal.toString(), // String for protobuf compatibility
      totalAmountDecimal: totalAmountDecimal, // Decimal version
      breakdown: {
        network: networkFee,
        contract: contractFee,
        interface: interfaceFee,
        total: totalFeeDecimal.toString()
      }
    };
  }

  /**
   * Determine fee types based on transaction type, key types, and hash types
   * @param {number} transactionType - Transaction type
   * @param {Array} keyTypes - Array of key types
   * @param {Array} hashTypes - Array of hash types
   * @returns {string} Comma-separated fee types
   */
  static determineFeeTypes(transactionType, keyTypes, hashTypes = []) {
    const feeTypes = [];
    
    // Add key fees based on key types
    for (const keyType of keyTypes) {
      if (keyType === KEY_TYPE.ED25519) {
        feeTypes.push('A_KEY_FEE');
      } else if (keyType === KEY_TYPE.ED448) {
        feeTypes.push('B_KEY_FEE');
      }
    }
    
    // Add hash fees based on detected hash types
    for (const hashType of hashTypes) {
      if (hashType === HASH_TYPE.SHA3_256) {
        feeTypes.push('a_HASH_FEE');
      } else if (hashType === HASH_TYPE.SHA3_512) {
        feeTypes.push('b_HASH_FEE');
      } else if (hashType === HASH_TYPE.BLAKE3) {
        feeTypes.push('c_HASH_FEE');
      }
    }
    
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

    const signatureSize = SIGNATURE_SIZES[keyType.toUpperCase()] || SIGNATURE_SIZES.ED25519;

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
   * Calculates network fees, contract fees, and interface fees
   * Adds fees to the protobuf object and returns the modified object
   * @param {Object} params - Fee calculation parameters
   * @param {Object} params.protoObject - The protobuf transaction object (without signatures/hash)
   * @param {string} [params.baseFeeId='$ZRA+0000'] - Base fee instrument ID
   * @param {string} [params.contractFeeId] - Contract fee instrument ID (for CoinTXN only)
   * @param {Decimal|string|number} [params.interfaceFeeAmount] - Interface fee amount (required if interfaceFeeId is specified)
   * @param {string} [params.interfaceFeeId] - Interface fee contract ID (triggers interface fee calculation)
   * @param {string} [params.interfaceAddress] - Interface provider address (required if interfaceFeeId is specified)
   * @returns {Promise<Object>} Unified fee calculation result with modified proto object
   */
  static async calculateFee(params) {
    const {
      protoObject,
      baseFeeId = '$ZRA+0000',
      contractFeeId,
      interfaceFeeAmount,
      interfaceFeeId,
      interfaceAddress
    } = params;

    // Create a copy of the proto object to avoid modifying the original
    const modifiedProtoObject = this.cloneProtoObject(protoObject);
    
    // Check if this is a CoinTXN transaction and contractFeeId is provided
    const transactionType = extractTransactionTypeFromProtoObject(modifiedProtoObject);
    let contractFee = null;
    let interfaceFee = null;

    // OPTIMIZATION: Pre-fetch exchange rates for all needed contract IDs to avoid duplicate API calls
    const neededContractIds = new Set([baseFeeId]);
    
    if (transactionType === TRANSACTION_TYPE.COIN_TYPE && contractFeeId) {
      const contractId = this.extractContractIdFromTransaction(modifiedProtoObject);
      if (contractId) {
        neededContractIds.add(contractId);
        neededContractIds.add(contractFeeId);
      }
    }
    
    if (interfaceFeeId) {
      neededContractIds.add(interfaceFeeId);
    }
    
    // Fetch all needed exchange rates in parallel
    const exchangeRates = new Map();
    const ratePromises = Array.from(neededContractIds).map(async (contractId) => {
      const rate = await this.getExchangeRate(contractId);
      exchangeRates.set(contractId, rate);
      return rate;
    });
    
    await Promise.all(ratePromises);

    // STEP 1: Calculate contract fee FIRST (if applicable)
    if (transactionType === TRANSACTION_TYPE.COIN_TYPE && contractFeeId) {
      try {
        // Extract contract ID and outputs directly from the protobuf object
        const contractId = modifiedProtoObject.contract_id;
        const outputTransfers = modifiedProtoObject.output_transfers || [];
        
        if (contractId && outputTransfers.length > 0) {
          // Calculate transaction amount only when needed for contract fee calculation
          const { toSmallestUnits } = await import('../../utils/amount-utils.js');
          const outputAmounts = outputTransfers.map(o => toSmallestUnits(o.amount, baseFeeId));
          const transactionAmount = outputAmounts.reduce((sum, amount) => {
            return new Decimal(sum).add(amount).toString();
          }, '0');
          
          // Calculate contract fee using the service with pre-fetched exchange rates
          contractFee = await contractFeeService.calculateContractFee({
            contractId,
            transactionAmount: transactionAmount,
            feeContractId: contractFeeId,
            transactionContractId: contractId, // Use the same contract ID for transaction instrument
            exchangeRates // Pass pre-fetched rates to avoid duplicate API calls
          });

          // Add contract fee to the proto object
          this.addContractFeeToProtoObject(modifiedProtoObject, contractFee);
        }
      } catch (error) {
        throw new Error(`Contract fee calculation failed: ${error.message}`);
      }
    }

    // STEP 2: Calculate interface fee (only if interfaceFeeId is specified)
    if (interfaceFeeId) {
      try {
        interfaceFee = this.calculateInterfaceFee({
          interfaceFeeAmount,
          interfaceFeeId,
          interfaceAddress
        });

        // Add interface fee to the proto object
        this.addInterfaceFeeToProtoObject(modifiedProtoObject, interfaceFee);
      } catch (error) {
        throw new Error(`Interface fee calculation failed: ${error.message}`);
      }
    }

    // STEP 3: Calculate network fee based on the modified proto object (which now includes contract and interface fees)
    const networkFee = await this.calculateNetworkFee({
      protoObject: modifiedProtoObject,
      baseFeeId,
      exchangeRates // Pass pre-fetched rates to avoid duplicate API calls
    });

    // Add network fee to the proto object
    this.addNetworkFeeToProtoObject(modifiedProtoObject, networkFee, baseFeeId);

    // Calculate total fees
    const networkFeeDecimal = this.toDecimal(networkFee.fee);
    const contractFeeDecimal = contractFee ? this.toDecimal(contractFee.fee) : new Decimal(0);
    const interfaceFeeDecimal = interfaceFee ? interfaceFee.feeDecimal : new Decimal(0);
    const totalFeeDecimal = addAmounts(addAmounts(networkFeeDecimal, contractFeeDecimal), interfaceFeeDecimal);

    return {
      protoObject: modifiedProtoObject, // Return the modified proto object
      totalFee: totalFeeDecimal.toString(),
      totalFeeDecimal: totalFeeDecimal,
      networkFee: networkFee.fee,
      contractFee: contractFee ? contractFee.fee : null,
      interfaceFee: interfaceFee ? interfaceFee.fee : null,
      feeId: baseFeeId,
      contractFeeId: contractFeeId || null,
      interfaceFeeId: interfaceFeeId || null,
      interfaceAddress: interfaceAddress || null,
      breakdown: {
        network: networkFee,
        contract: contractFee,
        interface: interfaceFee,
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
    // Use sanitization to handle BigInt values properly
    return sanitizeForSerialization(protoObject);
  }

  /**
   * Add contract fee to the protobuf object
   * @param {Object} protoObject - Protobuf object to modify
   * @param {Object} contractFee - Contract fee calculation result
   */
  static addContractFeeToProtoObject(protoObject, contractFee) {
    // Only add contract fee if it's not null (i.e., not zero)
    if (contractFee.fee === null) {
      return; // Skip adding null/zero fees
    }
    
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
   * Add interface fee to the protobuf object
   * @param {Object} protoObject - Protobuf object to modify
   * @param {Object} interfaceFee - Interface fee calculation result
   */
  static addInterfaceFeeToProtoObject(protoObject, interfaceFee) {
    // Only add interface fee if it's not null (i.e., not zero)
    if (interfaceFee.fee === null) {
      return; // Skip adding null/zero fees
    }
    
    // Interface fees are added to the base transaction for all transaction types
    if (protoObject.base) {
      protoObject.base.interfaceFee = interfaceFee.fee;
      protoObject.base.interfaceFeeId = interfaceFee.interfaceFeeId;
      if (interfaceFee.interfaceAddress) {
        // Decode base58 address to bytes for protobuf
        protoObject.base.interfaceAddress = bs58.decode(interfaceFee.interfaceAddress);
      }
    } else {
      // For transactions without base field, add directly to the object
      protoObject.interfaceFee = interfaceFee.fee;
      protoObject.interfaceFeeId = interfaceFee.interfaceFeeId;
      if (interfaceFee.interfaceAddress) {
        // Decode base58 address to bytes for protobuf
        protoObject.interfaceAddress = bs58.decode(interfaceFee.interfaceAddress);
      }
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