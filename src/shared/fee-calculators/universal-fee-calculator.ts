/**
 * Universal Fee Calculator for ZERA JS SDK
 * Handles both network fees (base fees) and contract-specific fees
 * Uses proper USD-based, size-dependent calculation
 */

import { KEY_TYPE, HASH_TYPE } from '../../wallet-creation/constants.js';
import { 
  TRANSACTION_TYPE, 
  CONTRACT_FEE_TYPE
} from '../protobuf/index.js';
import { toBinary } from '@bufbuild/protobuf';
import type {
  CoinTXN,
  MintTXN,
  ItemizedMintTXN,
  InstrumentContract,
  GovernanceVote,
  GovernanceProposal,
  SmartContractTXN,
  SmartContractExecuteTXN,
  SmartContractInstantiateTXN,
  SelfCurrencyEquiv,
  AuthorizedCurrencyEquiv,
  ExpenseRatioTXN,
  NFTTXN,
  ContractUpdateTXN,
  FoundationTXN,
  DelegatedTXN,
  QuashTXN,
  FastQuorumTXN,
  RevokeTXN,
  ComplianceTXN,
  BurnSBTTXN,
  AllowanceTXN,
  ValidatorRegistration,
  ValidatorHeartbeat,
  ProposalResult,
  RequiredVersion
} from '../../../proto/generated/txn_pb.js';
import {
  CoinTXNSchema,
  MintTXNSchema,
  ItemizedMintTXNSchema,
  InstrumentContractSchema,
  GovernanceVoteSchema,
  GovernanceProposalSchema,
  SmartContractTXNSchema,
  SmartContractExecuteTXNSchema,
  SmartContractInstantiateTXNSchema,
  SelfCurrencyEquivSchema,
  AuthorizedCurrencyEquivSchema,
  ExpenseRatioTXNSchema,
  NFTTXNSchema,
  ContractUpdateTXNSchema,
  FoundationTXNSchema,
  DelegatedTXNSchema,
  QuashTXNSchema,
  FastQuorumTXNSchema,
  RevokeTXNSchema,
  ComplianceTXNSchema,
  BurnSBTTXNSchema,
  AllowanceTXNSchema,
  ValidatorRegistrationSchema,
  ValidatorHeartbeatSchema,
  ProposalResultSchema,
  RequiredVersionSchema
} from '../../../proto/generated/txn_pb.js';
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
 * Union type of all possible transaction types
 */
export type TransactionMessage = 
  | CoinTXN
  | MintTXN
  | ItemizedMintTXN
  | InstrumentContract
  | GovernanceVote
  | GovernanceProposal
  | SmartContractTXN
  | SmartContractExecuteTXN
  | SmartContractInstantiateTXN
  | SelfCurrencyEquiv
  | AuthorizedCurrencyEquiv
  | ExpenseRatioTXN
  | NFTTXN
  | ContractUpdateTXN
  | FoundationTXN
  | DelegatedTXN
  | QuashTXN
  | FastQuorumTXN
  | RevokeTXN
  | ComplianceTXN
  | BurnSBTTXN
  | AllowanceTXN
  | ValidatorRegistration
  | ValidatorHeartbeat
  | ProposalResult
  | RequiredVersion;

/**
 * Type guard to check if an object is a CoinTXN
 */
function isCoinTXN(obj: any): obj is CoinTXN {
  return obj && (obj.$typeName === 'zera_txn.CoinTXN' || (obj.base && obj.contractId));
}

/**
 * Type guard to check if an object is a MintTXN
 */
function isMintTXN(obj: any): obj is MintTXN {
  return obj && (obj.$typeName === 'zera_txn.MintTXN' || (obj.base && obj.mintTxn));
}

/**
 * Type guard to check if an object is an InstrumentContract
 */
function isInstrumentContract(obj: any): obj is InstrumentContract {
  return obj && (obj.$typeName === 'zera_txn.InstrumentContract' || (obj.base && obj.instrumentContract));
}

/**
 * Type guard to check if an object has auth property (CoinTXN)
 */
function hasAuthProperty(obj: any): obj is { auth: any } {
  return obj && obj.auth;
}

/**
 * Type guard to check if an object has base property
 */
function hasBaseProperty(obj: any): obj is { base: any } {
  return obj && obj.base;
}

/**
 * Fee calculation options
 */
export interface FeeCalculationOptions<T extends TransactionMessage = TransactionMessage> {
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
export interface FeeCalculationResult<T extends TransactionMessage = TransactionMessage> {
  protoObject: T;
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
    network: NetworkFeeResult;
    contract: ContractFeeResult | null;
    interface: InterfaceFeeResult | null;
    total: string;
  };
}

/**
 * Network fee calculation result
 */
export interface NetworkFeeResult {
  fee: string;
  feeDecimal: Decimal;
  transactionSize: number;
  signatureSize: number;
  exchangeRate: Decimal;
}

/**
 * Contract fee calculation result
 */
export interface ContractFeeResult {
  fee: string;
  feeDecimal: Decimal;
  contractId: string;
  contractFeeType: number;
  contractFeeAmount: string;
  feeContractId: string;
}

/**
 * Interface fee calculation result
 */
export interface InterfaceFeeResult {
  fee: string;
  feeDecimal: Decimal;
  interfaceFeeId: string;
  interfaceAddress: string;
}

/**
 * Extract transaction type from a protobuf object
 */
function extractTransactionTypeFromProtoObject(protoObject: TransactionMessage): number {
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
    if (isCoinTXN(protoObject)) {
      return TRANSACTION_TYPE.COIN_TYPE;
    } else if (isMintTXN(protoObject)) {
      return TRANSACTION_TYPE.MINT_TYPE;
    } else if (isInstrumentContract(protoObject)) {
      return TRANSACTION_TYPE.CONTRACT_TXN_TYPE;
    } else if ('governanceVote' in protoObject) {
      return TRANSACTION_TYPE.VOTE_TYPE;
    } else if ('governanceProposal' in protoObject) {
      return TRANSACTION_TYPE.PROPOSAL_TYPE;
    } else if ('smartContractTxn' in protoObject) {
      return TRANSACTION_TYPE.SMART_CONTRACT_TYPE;
    } else if ('smartContractExecuteTxn' in protoObject) {
      return TRANSACTION_TYPE.SMART_CONTRACT_EXECUTE_TYPE;
    } else if ('selfCurEquiv' in protoObject) {
      return TRANSACTION_TYPE.SELF_CURRENCY_EQUIV_TYPE;
    } else if ('authorizedCurEquiv' in protoObject) {
      return TRANSACTION_TYPE.AUTHORIZED_CURRENCY_EQUIV_TYPE;
    } else if ('expenseRatioTxn' in protoObject) {
      return TRANSACTION_TYPE.EXPENSE_RATIO_TYPE;
    } else if ('nftTxn' in protoObject) {
      return TRANSACTION_TYPE.NFT_TYPE;
    } else if ('contractUpdateTxn' in protoObject) {
      return TRANSACTION_TYPE.UPDATE_CONTRACT_TYPE;
    } else if ('validatorRegistration' in protoObject) {
      return TRANSACTION_TYPE.VALIDATOR_REGISTRATION_TYPE;
    } else if ('validatorHeartbeat' in protoObject) {
      return TRANSACTION_TYPE.VALIDATOR_HEARTBEAT_TYPE;
    } else if ('proposalResult' in protoObject) {
      return TRANSACTION_TYPE.PROPOSAL_RESULT_TYPE;
    } else if ('delegatedTxn' in protoObject) {
      return TRANSACTION_TYPE.DELEGATED_VOTING_TYPE;
    } else if ('revokeTxn' in protoObject) {
      return TRANSACTION_TYPE.REVOKE_TYPE;
    } else if ('quashTxn' in protoObject) {
      return TRANSACTION_TYPE.QUASH_TYPE;
    } else if ('fastQuorumTxn' in protoObject) {
      return TRANSACTION_TYPE.FAST_QUORUM_TYPE;
    } else if ('complianceTxn' in protoObject) {
      return TRANSACTION_TYPE.COMPLIANCE_TYPE;
    } else if ('burnSbtTxn' in protoObject) {
      return TRANSACTION_TYPE.SBT_BURN_TYPE;
    } else if ('requiredVersion' in protoObject) {
      return TRANSACTION_TYPE.REQUIRED_VERSION;
    } else if ('smartContractInstantiateTxn' in protoObject) {
      return TRANSACTION_TYPE.SMART_CONTRACT_INSTANTIATE_TYPE;
    } else if ('allowanceTxn' in protoObject) {
      return TRANSACTION_TYPE.ALLOWANCE_TYPE;
    } else if ('foundationTxn' in protoObject) {
      return TRANSACTION_TYPE.FOUNDATION_TYPE;
    }
    
    // If we can't determine the type, throw an error
    throw new Error('Unable to determine transaction type from protoObject structure');
  } catch (error) {
    throw new Error(`Failed to extract transaction type from protoObject: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract key types from a transaction protobuf object
 */
function extractKeyTypesFromTransaction(protoObject: TransactionMessage): string[] {
  const keyTypes: string[] = [];
  
  try {
    // Check if this is a CoinTXN (has auth field with publicKey array)
    if (hasAuthProperty(protoObject) && protoObject.auth.publicKey && Array.isArray(protoObject.auth.publicKey)) {
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
    } else if (hasBaseProperty(protoObject) && protoObject.base.publicKey) {
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
    throw new Error(`Failed to extract key types from transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Throw error if no key types found
  if (keyTypes.length === 0) {
    if (hasAuthProperty(protoObject) && protoObject.auth.publicKey) {
      throw new Error('Failed to detect key types from CoinTXN transaction. Check that publicKey array contains valid key structures.');
    } else if (hasBaseProperty(protoObject) && protoObject.base.publicKey) {
      throw new Error('Failed to detect key type from BaseTXN transaction. Check that publicKey contains valid key structure.');
    } else {
      throw new Error('Failed to detect key types from transaction. Transaction must have either auth.publicKey (CoinTXN) or base.publicKey (other types).');
    }
  }
  
  return keyTypes;
}

/**
 * Extract hash types from a transaction protobuf object
 */
function extractHashTypesFromTransaction(protoObject: TransactionMessage): string[] {
  const hashTypes: string[] = [];
  
  try {
    // Check if this is a CoinTXN (has auth field with publicKey array)
    if (hasAuthProperty(protoObject) && protoObject.auth.publicKey && Array.isArray(protoObject.auth.publicKey)) {
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
            console.warn(`Failed to extract hash types from key: ${error instanceof Error ? error.message : String(error)}`);
          }
        } else if (publicKey.multi && publicKey.multi.publicKeys) {
          throw new Error('multi signature wallet not yet supported in SDK'); // TODO
        }
      }
    } else if (hasBaseProperty(protoObject) && protoObject.base.publicKey) {
      // Non-CoinTXN: extract hash types from BaseTXN.public_key
      const publicKey = protoObject.base.publicKey;
      if (publicKey.single) {
        const publicKeyString = Buffer.from(publicKey.single).toString('utf8');
        try {
          const keyHashTypes = getHashTypesFromPublicKey(publicKeyString);
          hashTypes.push(...keyHashTypes);
        } catch (error) {
          // If we can't extract hash types from this key, skip it
          console.warn(`Failed to extract hash types from key: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else if (publicKey.multi && publicKey.multi.publicKeys) {
        throw new Error('multi signature wallet not yet supported in SDK'); // TODO
      }
    }
  } catch (error) {
    throw new Error(`Failed to extract hash types from transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // If no hash types found, return empty array (transaction might not have hash types)
  return hashTypes;
}

/**
 * Detect key type from public key identifier string
 */
function detectKeyTypeFromIdentifier(keyIdentifier: string): string | null {
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
    console.error(`Error detecting key type from identifier: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Detect key type from raw public key bytes
 */
function detectKeyTypeFromBytes(keyBytes: Uint8Array): string | null {
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
    if (error instanceof Error && error.message.includes('Failed to detect key type from bytes')) {
      throw error; // Re-throw our custom error
    }
    throw new Error(`Failed to detect key type from bytes: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get the protobuf schema for a transaction type
 */
function getSchemaForTransactionType(transactionType: number) {
  switch (transactionType) {
    case TRANSACTION_TYPE.COIN_TYPE:
      return CoinTXNSchema;
    case TRANSACTION_TYPE.MINT_TYPE:
      return MintTXNSchema;
    case TRANSACTION_TYPE.ITEM_MINT_TYPE:
      return ItemizedMintTXNSchema;
    case TRANSACTION_TYPE.CONTRACT_TXN_TYPE:
      return InstrumentContractSchema;
    case TRANSACTION_TYPE.VOTE_TYPE:
      return GovernanceVoteSchema;
    case TRANSACTION_TYPE.PROPOSAL_TYPE:
      return GovernanceProposalSchema;
    case TRANSACTION_TYPE.SMART_CONTRACT_TYPE:
      return SmartContractTXNSchema;
    case TRANSACTION_TYPE.SMART_CONTRACT_EXECUTE_TYPE:
      return SmartContractExecuteTXNSchema;
    case TRANSACTION_TYPE.SMART_CONTRACT_INSTANTIATE_TYPE:
      return SmartContractInstantiateTXNSchema;
    case TRANSACTION_TYPE.SELF_CURRENCY_EQUIV_TYPE:
      return SelfCurrencyEquivSchema;
    case TRANSACTION_TYPE.AUTHORIZED_CURRENCY_EQUIV_TYPE:
      return AuthorizedCurrencyEquivSchema;
    case TRANSACTION_TYPE.EXPENSE_RATIO_TYPE:
      return ExpenseRatioTXNSchema;
    case TRANSACTION_TYPE.NFT_TYPE:
      return NFTTXNSchema;
    case TRANSACTION_TYPE.UPDATE_CONTRACT_TYPE:
      return ContractUpdateTXNSchema;
    case TRANSACTION_TYPE.FOUNDATION_TYPE:
      return FoundationTXNSchema;
    case TRANSACTION_TYPE.DELEGATED_VOTING_TYPE:
      return DelegatedTXNSchema;
    case TRANSACTION_TYPE.QUASH_TYPE:
      return QuashTXNSchema;
    case TRANSACTION_TYPE.FAST_QUORUM_TYPE:
      return FastQuorumTXNSchema;
    case TRANSACTION_TYPE.REVOKE_TYPE:
      return RevokeTXNSchema;
    case TRANSACTION_TYPE.COMPLIANCE_TYPE:
      return ComplianceTXNSchema;
    case TRANSACTION_TYPE.SBT_BURN_TYPE:
      return BurnSBTTXNSchema;
    case TRANSACTION_TYPE.ALLOWANCE_TYPE:
      return AllowanceTXNSchema;
    case TRANSACTION_TYPE.VALIDATOR_REGISTRATION_TYPE:
      return ValidatorRegistrationSchema;
    case TRANSACTION_TYPE.VALIDATOR_HEARTBEAT_TYPE:
      return ValidatorHeartbeatSchema;
    case TRANSACTION_TYPE.PROPOSAL_RESULT_TYPE:
      return ProposalResultSchema;
    case TRANSACTION_TYPE.REQUIRED_VERSION:
      return RequiredVersionSchema;
    default:
      throw new Error(`Unknown transaction type: ${transactionType}`);
  }
}

/**
 * Calculate protobuf size using proper @bufbuild/protobuf toBinary function
 */
function calculateProtobufSize(protoObject: TransactionMessage, transactionType: number): number {
  const schema = getSchemaForTransactionType(transactionType);
  
  // Sanitize the proto object to convert BigInt values to strings
  const sanitizedProtoObject = sanitizeForSerialization(protoObject);
  
  const binary = toBinary(schema, sanitizedProtoObject);
  
  // Check if binary is valid
  if (!binary) {
    throw new Error('toBinary returned null or undefined');
  }
  
  return binary.length;
}

/**
 * Calculate total transaction size from protobuf object + signatures + hashes
 */
function calculateTotalTransactionSize(protoObject: TransactionMessage): number {
  // Auto-detect transaction type from protobuf object
  const detectedTransactionType = extractTransactionTypeFromProtoObject(protoObject);
  
  // Check if transaction type is valid (0 is a valid transaction type, so check for null/undefined)
  if (detectedTransactionType === null || detectedTransactionType === undefined) {
    throw new Error('detectedTransactionType is null or undefined');
  }
  
  // Get the serialized size of the protobuf object using proper @bufbuild/protobuf
  const protoSize = calculateProtobufSize(protoObject, detectedTransactionType);
  
  // Auto-detect key types from transaction
  const keyTypes = extractKeyTypesFromTransaction(protoObject);
  
  // Calculate signature sizes
  let signatureSize = 0;
  for (const keyType of keyTypes) {
    signatureSize += SIGNATURE_SIZES[keyType.toUpperCase() as keyof typeof SIGNATURE_SIZES] || SIGNATURE_SIZES.ED25519;
  }
  
  // Auto-detect hash types and calculate total hash size
  const hashTypes = extractHashTypesFromTransaction(protoObject);
  let totalHashSize = 0;
  for (const hashType of hashTypes) {
    totalHashSize += HASH_SIZES[hashType as keyof typeof HASH_SIZES] || HASH_SIZE; // fallback to default hash size
  }
  
  // If no hash types detected, use default hash size
  if (totalHashSize === 0) {
    totalHashSize = HASH_SIZE;
  }
  
  return protoSize + signatureSize + totalHashSize;
}

/**
 * Calculate transaction size in bytes
 */
function calculateTransactionSize(protoObject: TransactionMessage): number {
  try {
    return calculateTotalTransactionSize(protoObject);
  } catch (error) {
    console.warn('Could not calculate transaction size, using default:', error);
    return 1000; // Default size estimate
  }
}

/**
 * Calculate signature size based on key type and hash types
 */
function calculateSignatureSize(protoObject: TransactionMessage): number {
  try {
    // Try to extract key type from transaction
    if (hasAuthProperty(protoObject) && protoObject.auth.publicKey) {
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
  protoObject: TransactionMessage,
  contractFeeId: string,
  baseFeeId: string,
  exchangeRates: Map<string, Decimal>
): Promise<ContractFeeResult | null> {
  try {
    // Extract contract ID and outputs directly from the protobuf object
    const contractId = isCoinTXN(protoObject) ? protoObject.contractId : null;
    const outputTransfers = isCoinTXN(protoObject) ? (protoObject.outputTransfers || []) : [];
    
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
): InterfaceFeeResult | null {
  if (!interfaceFeeAmount || !interfaceFeeId) {
    return null;
  }
  
  const feeDecimal = toDecimal(interfaceFeeAmount);
  
  return {
    fee: feeDecimal.toString(),
    feeDecimal: feeDecimal,
    interfaceFeeId: interfaceFeeId!,
    interfaceAddress: interfaceAddress!
  };
}

/**
 * Calculate network fee based on proto object
 */
async function calculateNetworkFeeWithRates(
  protoObject: TransactionMessage,
  baseFeeId: string,
  exchangeRates: Map<string, Decimal>
): Promise<NetworkFeeResult> {
  // Calculate transaction size
  const transactionSize = calculateTransactionSize(protoObject);
  
  // Calculate signature size
  const signatureSize = calculateSignatureSize(protoObject);
  
  // Calculate base network fee
  const baseNetworkFeeEquiv = calculateBaseNetworkFee(transactionSize, signatureSize);
  
  // Get exchange rate for base fee
  const exchangeRate = exchangeRates.get(baseFeeId) || new Decimal(1);

  const baseNetworkFee = baseNetworkFeeEquiv.div(exchangeRate);
  
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
  static async calculateFee<T extends TransactionMessage>(
    options: FeeCalculationOptions<T>
  ): Promise<FeeCalculationResult<T>> {
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
      const contractId = isCoinTXN(protoObject) ? protoObject.contractId : null;
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
