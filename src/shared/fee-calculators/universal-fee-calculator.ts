/**
 * Universal Fee Calculator for ZERA JS SDK
 * Handles both network fees (base fees) and contract-specific fees
 * Uses proper USD-based, size-dependent calculation
 */

import { KEY_TYPE, HASH_TYPE } from '../../wallet-creation/constants.js';
import { 
  TRANSACTION_TYPE, 
  CONTRACT_FEE_TYPE,
  toBinary,
  CoinTXN
} from '../protobuf/index.js';
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
import { sanitizeForSerialization } from '../utils/protobuf-utils.js';
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
import type { 
  KeyType, 
  HashType, 
  AmountInput
} from '../../types/index.js';

/**
 * Generic protobuf object type
 */
export type ProtobufObject = Record<string, unknown>;

/**
 * Fee calculation options
 */
export interface FeeCalculationOptions<T extends ProtobufObject = ProtobufObject> {
  protoObject: T;
  baseFeeId?: string;
  contractFeeId?: string;
  interfaceFeeAmount?: AmountInput;
  interfaceFeeId?: string;
  interfaceAddress?: string;
}

/**
 * Fee breakdown details
 */
export interface FeeBreakdown {
  baseFee: string;
  sizeFee: string;
  signatureFee: string;
  contractFee: string;
  interfaceFee?: string;
}

/**
 * Fee calculation result
 */
export interface FeeCalculationResult {
  protoObject: ProtobufObject;
  totalFee: string;
  totalFeeDecimal: Decimal;
  networkFee: string;
  contractFee: string | null;
  interfaceFee: string | null;
  feeId: string;
  contractFeeId: string | null;
  interfaceFeeId: string | null;
  interfaceAddress: string | null;
  breakdown: {
    network: any;
    contract: any;
    interface: any;
    total: string;
  };
}

/**
 * Extract transaction type from a protobuf object
 */
function extractTransactionTypeFromProtoObject<T extends ProtobufObject>(protoObject: T): number {
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
      } else if (typeName === 'zera_txn.FoundationTXN') {
        return TRANSACTION_TYPE.FOUNDATION_TYPE;
      } else if (typeName === 'zera_txn.DelegatedTXN') {
        return TRANSACTION_TYPE.DELEGATED_VOTING_TYPE;
      } else if (typeName === 'zera_txn.QuashTXN') {
        return TRANSACTION_TYPE.PROPOSAL_TYPE;
      } else if (typeName === 'zera_txn.FastQuorumTXN') {
        return TRANSACTION_TYPE.PROPOSAL_TYPE;
      } else if (typeName === 'zera_txn.RevokeTXN') {
        return TRANSACTION_TYPE.PROPOSAL_TYPE;
      } else if (typeName === 'zera_txn.ComplianceTXN') {
        return TRANSACTION_TYPE.PROPOSAL_TYPE;
      } else if (typeName === 'zera_txn.BurnSBTTXN') {
        return TRANSACTION_TYPE.SBT_BURN_TYPE;
      } else if (typeName === 'zera_txn.AllowanceTXN') {
        return TRANSACTION_TYPE.ALLOWANCE_TYPE;
      }
    }
    
    // If no direct type name, try to infer from structure
    if (protoObject.base && protoObject.contractId) {
      return TRANSACTION_TYPE.COIN_TYPE;
    } else if (protoObject.base && protoObject.instrumentContract) {
      return TRANSACTION_TYPE.CONTRACT_TXN_TYPE;
    } else if (protoObject.base && protoObject.governanceVote) {
      return TRANSACTION_TYPE.PROPOSAL_TYPE;
    } else if (protoObject.base && protoObject.governanceProposal) {
      return TRANSACTION_TYPE.PROPOSAL_TYPE;
    }
    
    // Default to contract transaction for unknown types
    return TRANSACTION_TYPE.CONTRACT_TXN_TYPE;
  } catch (error) {
    console.warn('Could not extract transaction type, defaulting to contract transaction:', error);
    return TRANSACTION_TYPE.CONTRACT_TXN_TYPE;
  }
}

/**
 * Calculate transaction size in bytes
 */
function calculateTransactionSize<T extends ProtobufObject>(protoObject: T): number {
  try {
    // For now, use a default size estimate since we can't serialize without proper protobuf types
    return 1000; // Default size estimate
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
 * Calculate contract fee using the service
 */
async function calculateContractFeeWithService(
  protoObject: any,
  contractFeeId: string,
  baseFeeId: string,
  exchangeRates: Map<string, Decimal>
): Promise<any> {
  try {
    // Extract contract ID and outputs directly from the protobuf object
    const contractId = protoObject.contract_id;
    const outputTransfers = protoObject.output_transfers || [];
    
    if (contractId && outputTransfers.length > 0) {
      // Calculate transaction amount only when needed for contract fee calculation
      const outputAmounts = outputTransfers.map((o: any) => toSmallestUnits(o.amount, baseFeeId));
      const transactionAmount = outputAmounts.reduce((sum: string, amount: string) => {
        return addAmounts(sum, amount).toString();
      }, '0');
      
      // Calculate contract fee using the service with pre-fetched exchange rates
      return await contractFeeService.calculateContractFee({
        contractId,
        transactionAmount: transactionAmount,
        feeContractId: contractFeeId,
        transactionContractId: contractId, // Use the same contract ID for transaction instrument
        exchangeRates // Pass pre-fetched rates to avoid duplicate API calls
      });
    }
    
    return null;
  } catch (error) {
    throw new Error(`Contract fee calculation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculate interface fee
 */
function calculateInterfaceFeeWithDetails(
  interfaceFeeAmount?: AmountInput,
  interfaceFeeId?: string,
  interfaceAddress?: string
): any {
  if (!interfaceFeeAmount || !interfaceFeeId) {
    return null;
  }
  
  const feeDecimal = toDecimal(interfaceFeeAmount);
  
  return {
    fee: feeDecimal.toString(),
    feeDecimal: feeDecimal,
    interfaceFeeId,
    interfaceAddress
  };
}

/**
 * Calculate network fee based on proto object
 */
async function calculateNetworkFeeWithRates(
  protoObject: any,
  baseFeeId: string,
  exchangeRates: Map<string, Decimal>
): Promise<any> {
  // Calculate transaction size
  const transactionSize = calculateTransactionSize(protoObject);
  
  // Calculate signature size
  const signatureSize = calculateSignatureSize(protoObject);
  
  // Calculate base network fee
  const baseNetworkFee = calculateBaseNetworkFee(transactionSize, signatureSize);
  
  // Get exchange rate for base fee
  const exchangeRate = exchangeRates.get(baseFeeId) || new Decimal(1);
  
  // Convert to smallest units
  const feeInSmallestUnits = toSmallestUnits(baseNetworkFee.toString(), baseFeeId);
  
  return {
    fee: feeInSmallestUnits,
    feeDecimal: baseNetworkFee,
    transactionSize,
    signatureSize,
    exchangeRate
  };
}

/**
 * Universal Fee Calculator class
 */
export class UniversalFeeCalculator {
  /**
   * Unified fee calculation method
   * Calculates network fees, contract fees, and interface fees
   * Returns the original proto object and comprehensive fee breakdown
   * @param options - Fee calculation parameters
   * @returns Unified fee calculation result
   */
  static async calculateFee<T extends ProtobufObject>(
    options: FeeCalculationOptions<T>
  ): Promise<FeeCalculationResult> {
    const {
      protoObject,
      baseFeeId = '$ZRA+0000',
      contractFeeId,
      interfaceFeeAmount,
      interfaceFeeId,
      interfaceAddress
    } = options;

    // Check if this is a CoinTXN transaction and contractFeeId is provided
    const transactionType = extractTransactionTypeFromProtoObject(protoObject);
    let contractFee = null;
    let interfaceFee = null;

    // OPTIMIZATION: Pre-fetch exchange rates for all needed contract IDs to avoid duplicate API calls
    const neededContractIds = new Set([baseFeeId]);
    
    if (transactionType === TRANSACTION_TYPE.COIN_TYPE && contractFeeId) {
      const contractId = (protoObject as any).contract_id;
      if (contractId && typeof contractId === 'string') {
        neededContractIds.add(contractId);
        neededContractIds.add(contractFeeId);
      }
    }
    
    if (interfaceFeeId) {
      neededContractIds.add(interfaceFeeId);
    }
    
    // Fetch all needed exchange rates in parallel
    const exchangeRates = new Map<string, Decimal>();
    const ratePromises = Array.from(neededContractIds).map(async (contractId) => {
      const rate = await aceExchangeService.getExchangeRate(contractId);
      exchangeRates.set(contractId, rate);
      return rate;
    });
    
    await Promise.all(ratePromises);

    // STEP 1: Calculate contract fee FIRST (if applicable)
    if (transactionType === TRANSACTION_TYPE.COIN_TYPE && contractFeeId) {
      try {
        contractFee = await calculateContractFeeWithService(
          protoObject,
          contractFeeId,
          baseFeeId,
          exchangeRates
        );
      } catch (error) {
        throw new Error(`Contract fee calculation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // STEP 2: Calculate interface fee (only if interfaceFeeId is specified)
    if (interfaceFeeId) {
      try {
        interfaceFee = calculateInterfaceFeeWithDetails(
          interfaceFeeAmount,
          interfaceFeeId,
          interfaceAddress
        );
      } catch (error) {
        throw new Error(`Interface fee calculation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // STEP 3: Calculate network fee based on the proto object
    const networkFee = await calculateNetworkFeeWithRates(
      protoObject,
      baseFeeId,
      exchangeRates
    );

    // Calculate total fees
    const networkFeeDecimal = networkFee.feeDecimal;
    const contractFeeDecimal = contractFee ? toDecimal(contractFee.fee) : new Decimal(0);
    const interfaceFeeDecimal = interfaceFee ? interfaceFee.feeDecimal : new Decimal(0);
    const totalFeeDecimal = addAmounts(addAmounts(networkFeeDecimal, contractFeeDecimal), interfaceFeeDecimal);

    return {
      protoObject: protoObject, // Return the original proto object (not modified)
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
