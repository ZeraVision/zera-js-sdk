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
import { aceExchangeService } from '../../api/zv-indexer/rate/service.js';
import { contractFeeService } from './contract-fee-service.js';
import { toBinary } from '@bufbuild/protobuf';
import { sanitizeForSerialization } from '../utils/protobuf-utils.js';
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
import type { KeyType, HashType, AmountInput } from '../../types/index.js';

/**
 * Fee calculation options
 */
export interface FeeCalculationOptions {
  protoObject: any;
  baseFeeId?: string;
  contractFeeId?: string;
  interfaceFeeAmount?: AmountInput;
  interfaceFeeId?: string;
  interfaceAddress?: string;
}

/**
 * Fee calculation result
 */
export interface FeeCalculationResult {
  networkFee: string;
  contractFee: string;
  interfaceFee?: string;
  totalFee: string;
  breakdown: {
    baseFee: string;
    sizeFee: string;
    signatureFee: string;
    contractFee: string;
    interfaceFee?: string;
  };
}

/**
 * Extract transaction type from a protobuf object
 */
function extractTransactionTypeFromProtoObject(protoObject: any): number {
  try {
    // First check if this is a direct transaction object (not wrapped)
    if (protoObject.$typeName) {
      const typeName = protoObject.$typeName;
      if (typeName === 'zera_txn.CoinTXN') {
        return TRANSACTION_TYPE.COIN_TXN;
      } else if (typeName === 'zera_txn.MintTXN') {
        return TRANSACTION_TYPE.CONTRACT_TXN;
      } else if (typeName === 'zera_txn.ItemizedMintTXN') {
        return TRANSACTION_TYPE.CONTRACT_TXN;
      } else if (typeName === 'zera_txn.InstrumentContract') {
        return TRANSACTION_TYPE.CONTRACT_TXN;
      } else if (typeName === 'zera_txn.GovernanceVote') {
        return TRANSACTION_TYPE.GOVERNANCE_TXN;
      } else if (typeName === 'zera_txn.GovernanceProposal') {
        return TRANSACTION_TYPE.GOVERNANCE_TXN;
      } else if (typeName === 'zera_txn.SmartContractTXN') {
        return TRANSACTION_TYPE.CONTRACT_TXN;
      } else if (typeName === 'zera_txn.SmartContractExecuteTXN') {
        return TRANSACTION_TYPE.CONTRACT_TXN;
      } else if (typeName === 'zera_txn.SelfCurrencyEquiv') {
        return TRANSACTION_TYPE.CONTRACT_TXN;
      } else if (typeName === 'zera_txn.AuthorizedCurrencyEquiv') {
        return TRANSACTION_TYPE.CONTRACT_TXN;
      } else if (typeName === 'zera_txn.ExpenseRatioTXN') {
        return TRANSACTION_TYPE.CONTRACT_TXN;
      } else if (typeName === 'zera_txn.NFTTXN') {
        return TRANSACTION_TYPE.NFT_TXN;
      } else if (typeName === 'zera_txn.ContractUpdateTXN') {
        return TRANSACTION_TYPE.CONTRACT_TXN;
      } else if (typeName === 'zera_txn.FoundationTXN') {
        return TRANSACTION_TYPE.GOVERNANCE_TXN;
      } else if (typeName === 'zera_txn.DelegatedTXN') {
        return TRANSACTION_TYPE.DELEGATION_TXN;
      } else if (typeName === 'zera_txn.QuashTXN') {
        return TRANSACTION_TYPE.GOVERNANCE_TXN;
      } else if (typeName === 'zera_txn.FastQuorumTXN') {
        return TRANSACTION_TYPE.GOVERNANCE_TXN;
      } else if (typeName === 'zera_txn.RevokeTXN') {
        return TRANSACTION_TYPE.GOVERNANCE_TXN;
      } else if (typeName === 'zera_txn.ComplianceTXN') {
        return TRANSACTION_TYPE.GOVERNANCE_TXN;
      } else if (typeName === 'zera_txn.BurnSBTTXN') {
        return TRANSACTION_TYPE.CONTRACT_TXN;
      } else if (typeName === 'zera_txn.AllowanceTXN') {
        return TRANSACTION_TYPE.CONTRACT_TXN;
      }
    }
    
    // If no direct type name, try to infer from structure
    if (protoObject.base && protoObject.contractId) {
      return TRANSACTION_TYPE.COIN_TXN;
    } else if (protoObject.base && protoObject.instrumentContract) {
      return TRANSACTION_TYPE.CONTRACT_TXN;
    } else if (protoObject.base && protoObject.governanceVote) {
      return TRANSACTION_TYPE.GOVERNANCE_TXN;
    } else if (protoObject.base && protoObject.governanceProposal) {
      return TRANSACTION_TYPE.GOVERNANCE_TXN;
    }
    
    // Default to contract transaction for unknown types
    return TRANSACTION_TYPE.CONTRACT_TXN;
  } catch (error) {
    console.warn('Could not extract transaction type, defaulting to contract transaction:', error);
    return TRANSACTION_TYPE.CONTRACT_TXN;
  }
}

/**
 * Calculate transaction size in bytes
 */
function calculateTransactionSize(protoObject: any): number {
  try {
    const serialized = toBinary(protoObject.constructor, protoObject);
    return serialized.length;
  } catch (error) {
    console.warn('Could not calculate transaction size, using default:', error);
    return 1000; // Default size estimate
  }
}

/**
 * Calculate signature size based on key type and hash types
 */
function calculateSignatureSize(protoObject: any): number {
  try {
    // Try to extract key type from transaction
    if (protoObject.auth && protoObject.auth.publicKey) {
      const publicKeys = protoObject.auth.publicKey;
      if (Array.isArray(publicKeys) && publicKeys.length > 0) {
        const firstPublicKey = publicKeys[0];
        if (firstPublicKey.single) {
          const publicKeyBytes = firstPublicKey.single;
          const publicKeyString = bs58.encode(publicKeyBytes);
          
          try {
            const keyType = getKeyTypeFromPublicKey(publicKeyString);
            const hashTypes = getHashTypesFromPublicKey(publicKeyString);
            
            let signatureSize = 0;
            for (const hashType of hashTypes) {
              signatureSize += getSignatureSize(keyType, hashType);
            }
            return signatureSize;
          } catch (error) {
            console.warn('Could not determine signature size from public key:', error);
          }
        }
      }
    }
    
    // Default signature size (Ed25519 with SHA3-256)
    return 64;
  } catch (error) {
    console.warn('Could not calculate signature size, using default:', error);
    return 64;
  }
}

/**
 * Calculate base network fee
 */
function calculateBaseNetworkFee(transactionSize: number, signatureSize: number): Decimal {
  const constants = getFeeConstants();
  
  // Base fee calculation: size * rate + signature fee
  const sizeFee = toDecimal(transactionSize).mul(constants.BYTES_PER_USD_CENT);
  const signatureFee = toDecimal(signatureSize).mul(constants.SIGNATURE_FEE_PER_BYTE);
  
  return addAmounts(sizeFee, signatureFee);
}

/**
 * Calculate contract fee
 */
async function calculateContractFee(
  protoObject: any, 
  contractFeeId?: string
): Promise<Decimal> {
  if (!contractFeeId) {
    return new Decimal(0);
  }
  
  try {
    const contractFee = await contractFeeService.getContractFee(contractFeeId);
    return toDecimal(contractFee);
  } catch (error) {
    console.warn('Could not get contract fee, using default:', error);
    return new Decimal(0);
  }
}

/**
 * Calculate interface fee
 */
function calculateInterfaceFee(interfaceFeeAmount?: AmountInput): Decimal {
  if (!interfaceFeeAmount) {
    return new Decimal(0);
  }
  
  return toDecimal(interfaceFeeAmount);
}

/**
 * Universal Fee Calculator class
 */
export class UniversalFeeCalculator {
  /**
   * Calculate comprehensive fee for a transaction
   */
  static async calculateFee(options: FeeCalculationOptions): Promise<FeeCalculationResult> {
    const {
      protoObject,
      baseFeeId = '$ZRA+0000',
      contractFeeId,
      interfaceFeeAmount,
      interfaceFeeId,
      interfaceAddress
    } = options;
    
    // Extract transaction type
    const transactionType = extractTransactionTypeFromProtoObject(protoObject);
    
    // Calculate transaction size
    const transactionSize = calculateTransactionSize(protoObject);
    
    // Calculate signature size
    const signatureSize = calculateSignatureSize(protoObject);
    
    // Calculate base network fee
    const baseNetworkFee = calculateBaseNetworkFee(transactionSize, signatureSize);
    
    // Calculate contract fee
    const contractFee = await calculateContractFee(protoObject, contractFeeId);
    
    // Calculate interface fee
    const interfaceFee = calculateInterfaceFee(interfaceFeeAmount);
    
    // Calculate total fee
    const totalFee = addAmounts(baseNetworkFee, contractFee, interfaceFee);
    
    // Convert to smallest units for the base fee ID
    const networkFeeInSmallestUnits = toSmallestUnits(baseNetworkFee.toString(), baseFeeId);
    const contractFeeInSmallestUnits = contractFeeId ? 
      toSmallestUnits(contractFee.toString(), contractFeeId) : '0';
    const interfaceFeeInSmallestUnits = interfaceFeeAmount ? 
      toSmallestUnits(interfaceFee.toString(), interfaceFeeId || baseFeeId) : '0';
    
    const result: any = {
      networkFee: networkFeeInSmallestUnits,
      contractFee: contractFeeInSmallestUnits,
      totalFee: toSmallestUnits(totalFee.toString(), baseFeeId),
      breakdown: {
        baseFee: networkFeeInSmallestUnits,
        sizeFee: toSmallestUnits(toDecimal(transactionSize).mul(getFeeConstants().BYTES_PER_USD_CENT).toString(), baseFeeId),
        signatureFee: toSmallestUnits(toDecimal(signatureSize).mul(getFeeConstants().SIGNATURE_FEE_PER_BYTE).toString(), baseFeeId),
        contractFee: contractFeeInSmallestUnits
      }
    };
    
    if (interfaceFeeAmount) {
      result.interfaceFee = interfaceFeeInSmallestUnits;
      result.breakdown.interfaceFee = interfaceFeeInSmallestUnits;
    }
    
    return result;
  }
  
  /**
   * Get fee constants
   */
  static getFeeConstants() {
    return getFeeConstants();
  }
  
  /**
   * Update fee constants
   */
  static updateFeeConstants(newConstants: any) {
    updateFeeConstants(newConstants);
  }

  /**
   * Get exchange rate for a given contract ID
   */
  static async getExchangeRate(contractId: string): Promise<Decimal> {
    return await aceExchangeService.getExchangeRate(contractId);
  }
}
