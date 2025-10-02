/**
 * Universal Fee Calculator for ZERA JS SDK
 * Handles both network fees (base fees) and contract-specific fees
 * Uses proper USD-based, size-dependent calculation
 */

// import { toBinary } from '@bufbuild/protobuf'; // Using instance method instead

import {
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
// import { getExchangeRate } from '../../api/handler/fee-info/service.js'; // No longer needed - using ExchangeRateService
import { getTokenFeeInfo } from '../../api/validator/fee-info/index.js';
import type { 
  AmountInput
} from '../../types/index.js';
import { getHashTypesFromPublicKey, getKeyTypeFromPublicKey } from '../crypto/address-utils.js';
import { KEY_TYPE } from '../crypto/constants.js';
import { 
  TRANSACTION_TYPE
} from '../protobuf/index.js';
import { 
  toDecimal, 
  addAmounts, 
  Decimal 
} from '../utils/amount-utils.js';
import { toSmallestUnits } from '../utils/unified-amount-conversion.js';

import { 
  HASH_SIZE, 
  PROTOBUF_HASH_OVERHEAD,
  PROTOBUF_BASE_SIGNATURE_OVERHEAD,
  PROTOBUF_AUTH_SIGNATURE_OVERHEAD,
  getFeeConstants,
  updateFeeConstants,
  getSignatureSize,
  getPerByteFeeConstant,
  getKeyFee,
  getHashFee
} from './base-fee-constants.js';
import { contractFeeService } from './contract-fee-service.js';
import { getDenominationFallback, getDecimalPlacesFromDenomination } from './denomination-fallback.js';
import { ExchangeRateService } from './exchange-rate-service.js';

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
function isCoinTXN(obj: unknown): obj is CoinTXN {
  return !!(obj && typeof obj === 'object' && (
    (obj as Record<string, unknown>).$typeName === 'zera_txn.CoinTXN' || 
    ((obj as Record<string, unknown>).base && (obj as Record<string, unknown>).contractId)
  ));
}

/**
 * Type guard to check if an object is a MintTXN
 */
function isMintTXN(obj: unknown): obj is MintTXN {
  return !!(obj && typeof obj === 'object' && (
    (obj as Record<string, unknown>).$typeName === 'zera_txn.MintTXN' || 
    ((obj as Record<string, unknown>).base && (obj as Record<string, unknown>).mintTxn)
  ));
}

/**
 * Type guard to check if an object is an InstrumentContract
 */
function isInstrumentContract(obj: unknown): obj is InstrumentContract {
  return !!(obj && typeof obj === 'object' && (
    (obj as Record<string, unknown>).$typeName === 'zera_txn.InstrumentContract' || 
    ((obj as Record<string, unknown>).base && (obj as Record<string, unknown>).instrumentContract)
  ));
}

/**
 * Type guard to check if an object has auth property (CoinTXN)
 */
function hasAuthProperty(obj: unknown): obj is { auth: unknown } {
  return !!(obj && typeof obj === 'object' && 'auth' in (obj as Record<string, unknown>));
}

/**
 * Type guard to check if an object has base property
 */
function hasBaseProperty(obj: unknown): obj is { base: unknown } {
  return !!(obj && typeof obj === 'object' && 'base' in (obj as Record<string, unknown>));
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
  /** 
   * Overestimate percentage to add to final fee (defaults to 5.0%)
   * Supports decimal values (e.g., 0.1 for 0.1%, 5.0 for 5.0%)
   * This is the MAXIMUM overestimate - the network will only take the correct amount
   */
  overestimatePercent?: number;
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
    if ((protoObject as unknown as Record<string, unknown>).$typeName) {
      const typeName = (protoObject as unknown as Record<string, unknown>).$typeName;
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
 * Extract key types and restricted status from a transaction protobuf object
 */
function extractKeyTypesFromTransaction(protoObject: TransactionMessage): { keyTypes: string[], isRestricted: boolean } {
  const keyTypes: string[] = [];
  let isRestricted = false;
  
  try {
    // Check if this is a CoinTXN (has auth field with publicKey array)
    if (hasAuthProperty(protoObject) && 
        typeof protoObject.auth === 'object' && 
        protoObject.auth !== null &&
        'publicKey' in protoObject.auth && 
        Array.isArray((protoObject.auth as Record<string, unknown>).publicKey)) {
      // CoinTXN: extract key types from TransferAuthentication.publicKey array
      const authObj = protoObject.auth as Record<string, unknown>;
      for (const publicKey of authObj.publicKey as unknown[]) {
        if (typeof publicKey === 'object' && publicKey !== null && 'single' in publicKey) {
          const publicKeyObj = publicKey as Record<string, unknown>;
          // Single key - convert bytes back to string identifier for key type detection
          const publicKeyString = Buffer.from(publicKeyObj.single as Uint8Array).toString('utf8');
          
          // Check if this public key is restricted (starts with 'r_')
          if (publicKeyString.startsWith('r_')) {
            isRestricted = true;
          }
          
          const keyType = getKeyTypeFromPublicKey(publicKeyString);
          keyTypes.push(keyType);
        } else if (typeof publicKey === 'object' && publicKey !== null && 'multi' in publicKey) {
          const publicKeyObj = publicKey as Record<string, unknown>;
          if (publicKeyObj.multi && typeof publicKeyObj.multi === 'object' && publicKeyObj.multi !== null && 'publicKeys' in publicKeyObj.multi) {
            throw new Error('Multi-signature wallets are not yet supported in the SDK');
          }
        }
      }
    } else if (hasBaseProperty(protoObject) && 
               typeof protoObject.base === 'object' && 
               protoObject.base !== null &&
               'publicKey' in protoObject.base) {
      // Non-CoinTXN: extract key type from BaseTXN.public_key
      const baseObj = protoObject.base as unknown as Record<string, unknown>;
      const publicKey = baseObj.publicKey;
      if (typeof publicKey === 'object' && publicKey !== null && 'single' in publicKey) {
        const publicKeyObj = publicKey as Record<string, unknown>;
        const publicKeyString = Buffer.from(publicKeyObj.single as Uint8Array).toString('utf8');
        
        // Check if this public key is restricted (starts with 'r_')
        if (publicKeyString.startsWith('r_')) {
          isRestricted = true;
        }
        
        const keyType = getKeyTypeFromPublicKey(publicKeyString);
        keyTypes.push(keyType);
      } else if (typeof publicKey === 'object' && publicKey !== null && 'multi' in publicKey) {
        const publicKeyObj = publicKey as Record<string, unknown>;
        if (publicKeyObj.multi && typeof publicKeyObj.multi === 'object' && publicKeyObj.multi !== null && 'publicKeys' in publicKeyObj.multi) {
          throw new Error('multi signature wallet not yet supported in SDK'); // TODO
        }
      }
    }
  } catch (error) {
    throw new Error(`Failed to extract key types from transaction: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Throw error if no key types found
  if (keyTypes.length === 0) {
    if (hasAuthProperty(protoObject) && 
        typeof protoObject.auth === 'object' && 
        protoObject.auth !== null &&
        'publicKey' in protoObject.auth) {
      throw new Error('Failed to detect key types from CoinTXN transaction. Check that publicKey array contains valid key structures.');
    } else if (hasBaseProperty(protoObject) && 
               typeof protoObject.base === 'object' && 
               protoObject.base !== null &&
               'publicKey' in protoObject.base) {
      throw new Error('Failed to detect key type from BaseTXN transaction. Check that publicKey contains valid key structure.');
    } else {
      throw new Error('Failed to detect key types from transaction. Transaction must have either auth.publicKey (CoinTXN) or base.publicKey (other types).');
    }
  }
  
  return { keyTypes, isRestricted };
}

/**
 * Extract hash types from a transaction protobuf object
 */
function extractHashTypesFromTransaction(protoObject: TransactionMessage): string[] {
  const hashTypes: string[] = [];
  
  try {
    // Check if this is a CoinTXN (has auth field with publicKey array)
    if (hasAuthProperty(protoObject) && 
        typeof protoObject.auth === 'object' && 
        protoObject.auth !== null &&
        'publicKey' in protoObject.auth && 
        Array.isArray((protoObject.auth as Record<string, unknown>).publicKey)) {
      // CoinTXN: extract hash types from TransferAuthentication.publicKey array
      const authObj = protoObject.auth as Record<string, unknown>;
      for (const publicKey of authObj.publicKey as unknown[]) {
        if (typeof publicKey === 'object' && publicKey !== null && 'single' in publicKey) {
          const publicKeyObj = publicKey as Record<string, unknown>;
          // Single key - convert bytes back to string identifier for hash type detection
          let publicKeyString = Buffer.from(publicKeyObj.single as Uint8Array).toString('utf8');
          
          // Remove 'r_' prefix if present to get clean hash types
          if (publicKeyString.startsWith('r_')) {
            publicKeyString = publicKeyString.substring(2);
          }
          
          try {
            const keyHashTypes = getHashTypesFromPublicKey(publicKeyString);
            hashTypes.push(...keyHashTypes);
          } catch {
            // If we can't extract hash types from this key, skip it
            // console.warn(`Failed to extract hash types from key: ${error instanceof Error ? error.message : String(error)}`);
          }
        } else if (typeof publicKey === 'object' && publicKey !== null && 'multi' in publicKey) {
          const publicKeyObj = publicKey as Record<string, unknown>;
          if (publicKeyObj.multi && typeof publicKeyObj.multi === 'object' && publicKeyObj.multi !== null && 'publicKeys' in publicKeyObj.multi) {
            throw new Error('multi signature wallet not yet supported in SDK');
          }
        }
      }
    } else if (hasBaseProperty(protoObject) && 
               typeof protoObject.base === 'object' && 
               protoObject.base !== null &&
               'publicKey' in protoObject.base) {
      // Non-CoinTXN: extract hash types from BaseTXN.public_key
      const baseObj = protoObject.base as unknown as Record<string, unknown>;
      const publicKey = baseObj.publicKey;
      if (typeof publicKey === 'object' && publicKey !== null && 'single' in publicKey) {
        const publicKeyObj = publicKey as Record<string, unknown>;
        let publicKeyString = Buffer.from(publicKeyObj.single as Uint8Array).toString('utf8');
        
        // Remove 'r_' prefix if present to get clean hash types
        if (publicKeyString.startsWith('r_')) {
          publicKeyString = publicKeyString.substring(2);
        }
        
        try {
          const keyHashTypes = getHashTypesFromPublicKey(publicKeyString);
          hashTypes.push(...keyHashTypes);
        } catch {
          // If we can't extract hash types from this key, skip it
          // console.warn(`Failed to extract hash types from key: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else if (typeof publicKey === 'object' && publicKey !== null && 'multi' in publicKey) {
        const publicKeyObj = publicKey as Record<string, unknown>;
        if (publicKeyObj.multi && typeof publicKeyObj.multi === 'object' && publicKeyObj.multi !== null && 'publicKeys' in publicKeyObj.multi) {
          throw new Error('multi signature wallet not yet supported in SDK');
        }
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
function _detectKeyTypeFromIdentifier(keyIdentifier: string): string | null {
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
  } catch {
    // console.error(`Error detecting key type from identifier: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Detect key type from raw public key bytes
 */
function _detectKeyTypeFromBytes(keyBytes: Uint8Array): string | null {
  try {    
    // Convert bytes to string to find the first underscore
    const keyString = Buffer.from(keyBytes).toString('utf-8');
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
function _getSchemaForTransactionType(transactionType: number) {
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
  case TRANSACTION_TYPE.SELF_CURRENCY_EQUIV_TYPE:
    return SelfCurrencyEquiv;
  case TRANSACTION_TYPE.AUTHORIZED_CURRENCY_EQUIV_TYPE:
    return AuthorizedCurrencyEquiv;
  case TRANSACTION_TYPE.EXPENSE_RATIO_TYPE:
    return ExpenseRatioTXN;
  case TRANSACTION_TYPE.NFT_TYPE:
    return NFTTXN;
  case TRANSACTION_TYPE.UPDATE_CONTRACT_TYPE:
    return ContractUpdateTXN;
  case TRANSACTION_TYPE.FOUNDATION_TYPE:
    return FoundationTXN;
  case TRANSACTION_TYPE.DELEGATED_VOTING_TYPE:
    return DelegatedTXN;
  case TRANSACTION_TYPE.QUASH_TYPE:
    return QuashTXN;
  case TRANSACTION_TYPE.FAST_QUORUM_TYPE:
    return FastQuorumTXN;
  case TRANSACTION_TYPE.REVOKE_TYPE:
    return RevokeTXN;
  case TRANSACTION_TYPE.COMPLIANCE_TYPE:
    return ComplianceTXN;
  case TRANSACTION_TYPE.SBT_BURN_TYPE:
    return BurnSBTTXN;
  case TRANSACTION_TYPE.ALLOWANCE_TYPE:
    return AllowanceTXN;
  case TRANSACTION_TYPE.VALIDATOR_REGISTRATION_TYPE:
    return ValidatorRegistration;
  case TRANSACTION_TYPE.VALIDATOR_HEARTBEAT_TYPE:
    return ValidatorHeartbeat;
  case TRANSACTION_TYPE.PROPOSAL_RESULT_TYPE:
    return ProposalResult;
  case TRANSACTION_TYPE.REQUIRED_VERSION:
    return RequiredVersion;
  default:
    throw new Error(`Unknown transaction type: ${transactionType}`);
  }
}

/**
 * Calculate protobuf size using proper @bufbuild/protobuf toBinary function
 */
function calculateProtobufSize(protoObject: TransactionMessage, _transactionType: number): number {
  // Use the original proto object directly - sanitization breaks the protobuf structure
  const binary = protoObject.toBinary();
  
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
  const { keyTypes } = extractKeyTypesFromTransaction(protoObject);
  
  // Calculate signature sizes
  let signatureSize = 0;
  for (const keyType of keyTypes) {
    const rawSignatureSize = getSignatureSize(keyType);

    if (detectedTransactionType === TRANSACTION_TYPE.COIN_TYPE) {
      signatureSize += rawSignatureSize + PROTOBUF_AUTH_SIGNATURE_OVERHEAD;
    } else {
      signatureSize += rawSignatureSize + PROTOBUF_BASE_SIGNATURE_OVERHEAD;
    }
  }
  
  // Accomodate single ED448 key signature overhead (inferred cause of calculation issue based on integration testing)
  // ! May not be root cause, but it's a workaround for the issue with negligible real-world effect - Raise a PR to fix this issue if solution is found.
  // ! Problem seems when there is a single ED448 key the size calculation is short by 1 byte.
  // ! Issue should be non present if using suggested buffer overhead values to account for potential changing ACE values.
  if (keyTypes.length === 1 && keyTypes[0] === KEY_TYPE.ED448) {
    signatureSize += 1;
  }
    
  // Calculate hash size with protobuf overhead
  const totalHashSize = HASH_SIZE + PROTOBUF_HASH_OVERHEAD;
  
  return protoSize + signatureSize + totalHashSize;
}

// /**
//  * Calculate base network fee
//  */
// function calculateBaseNetworkFee(transactionSize: number, signatureSize: number): Decimal {
//   const constants = getFeeConstants();
  
//   // Base fee calculation: size * rate + signature fee
//   const sizeFee = toDecimal(transactionSize).mul(constants.BYTES_PER_USD_CENT);
//   const signatureFee = toDecimal(signatureSize).mul(constants.SIGNATURE_FEE_PER_BYTE);
  
//   return addAmounts(sizeFee, signatureFee);
// }

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
      const outputAmounts = outputTransfers.map((o: { amount: string | number }) => toSmallestUnits(o.amount, baseFeeId));
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
    interfaceFeeId: interfaceFeeId,
    interfaceAddress: interfaceAddress || ''
  };
}

/**
 * Calculate network fee based on proto object
 *! Note: This function may not be 100% accurate. Nominal testing indicates accuracy within >= 99.999999% (usually exact or 1 denomination unit greater). Minimal accuracy difference design choice for better code understandability rather than working strictly with scaled numbers.
 *! Note: Suggest 'maximum' overestimation to account for edge cases such as changes in ACE rates after transaction calculation.
 */
async function calculateNetworkFee(
  protoObject: TransactionMessage,
  transactionType: number,
  baseFeeId: string,
  exchangeRates: Map<string, Decimal>,
  overestimatePercent: number = 5.0
): Promise<NetworkFeeResult> {
  // Calculate initial transaction size (with placeholder fee amount)
  let transactionSize = calculateTotalTransactionSize(protoObject);
  
  // Get per-byte fee constant for this transaction type
  const perByteFeeConstant = getPerByteFeeConstant(transactionType);

  // Extract key types and restricted status from transaction
  const { keyTypes, isRestricted } = extractKeyTypesFromTransaction(protoObject);
  const hashTypes = extractHashTypesFromTransaction(protoObject);

  // Calculate initial base network fee: transaction size * per-byte fee
  const baseNetworkFeeEquiv = toDecimal(transactionSize).mul(toDecimal(perByteFeeConstant));
  
  // Calculate key fees
  let totalKeyFees = new Decimal(0);
  for (const keyType of keyTypes) {
    // Apply restricted multiplier if the public key starts with 'r_'
    const keyFee = getKeyFee(keyType, isRestricted);
    totalKeyFees = totalKeyFees.add(toDecimal(keyFee));
  }
  
  // Calculate hash fees
  let totalHashFees = new Decimal(0);
  for (const hashType of hashTypes) {
    // Apply restricted multiplier if the public key starts with 'r_'
    const hashFee = getHashFee(hashType, isRestricted);
    totalHashFees = totalHashFees.add(toDecimal(hashFee));
  }
  
  // Calculate initial total network fee: base fee + key fees + hash fees
  const totalNetworkFeeEquiv = baseNetworkFeeEquiv.add(totalKeyFees).add(totalHashFees);
  
  // Get exchange rate for base fee
  const exchangeRate = exchangeRates.get(baseFeeId) || new Decimal(1);

  // Use precise division with proper rounding for base fees
  const totalNetworkFee = totalNetworkFeeEquiv.div(exchangeRate);
  
  // Get token fee info to determine precision from denomination
  const tokenFeeInfo = await UniversalFeeCalculator.getTokenFeeInfo([baseFeeId]);
  const tokenInfo = tokenFeeInfo.find(t => t.contractId === baseFeeId);
  
  // Calculate decimal places from denomination
  let decimals: number;
  if (tokenInfo?.denomination) {
    // Use denomination from token fee info
    decimals = getDecimalPlacesFromDenomination(tokenInfo.denomination);
  } else {
    // Use fallback denomination
    const fallbackDenomination = getDenominationFallback(baseFeeId);
    decimals = getDecimalPlacesFromDenomination(fallbackDenomination);
  }
  
  // Round to the precision specified by the denomination
  const precisionMultiplier = new Decimal(10).pow(decimals);
  const roundedFee = totalNetworkFee.mul(precisionMultiplier).floor().div(precisionMultiplier);
  
  // Convert to smallest units with precise denomination-based precision
  let feeInSmallestUnits = toSmallestUnits(roundedFee.toString(), baseFeeId, { isBaseFee: true });
  
  // Calculate the difference in size between placeholder '1' and actual fee
  const placeholderFeeSize = 1; // Size of '1' in bytes
  const actualFeeSize = feeInSmallestUnits.length; // Size of actual fee string in bytes
  const feeSizeDifference = actualFeeSize - placeholderFeeSize;
  
  // If there's a size difference, recalculate the fee with the corrected transaction size
  if (feeSizeDifference > 0) {
    // Add the size difference to transaction size
    const correctedTransactionSize = transactionSize + feeSizeDifference;
    
    // Recalculate base network fee with corrected size
    const correctedBaseNetworkFeeEquiv = toDecimal(correctedTransactionSize).mul(toDecimal(perByteFeeConstant));
    
    // Recalculate total network fee
    const correctedTotalNetworkFeeEquiv = correctedBaseNetworkFeeEquiv.add(totalKeyFees).add(totalHashFees);
    // Use precise division with proper rounding for base fees
    const correctedTotalNetworkFee = correctedTotalNetworkFeeEquiv.div(exchangeRate);
    
    // Round to the precision specified by the denomination
    const precisionMultiplier = new Decimal(10).pow(decimals);
    const correctedRoundedFee = correctedTotalNetworkFee.mul(precisionMultiplier).floor().div(precisionMultiplier);
    
    // Update the fee in smallest units with precise denomination-based precision
    feeInSmallestUnits = toSmallestUnits(correctedRoundedFee.toString(), baseFeeId, { isBaseFee: true });
    
    // Update transaction size for return value
    transactionSize = correctedTransactionSize;
  }
  
  // Apply overestimate percentage to final fee
  // This is the MAXIMUM overestimate - the network will only take the correct amount
  // No more fees will actually be taken than needed. The overestimate is a safety buffer
  // for rate fluctuations and calculation edge cases.
  // Integrations should show the fee number less the overestimate as "projected" 
  // while the full number is the "maximum" fee.
  if (overestimatePercent > 0) {
    const overestimateMultiplier = new Decimal(100 + overestimatePercent).div(100);
    const overestimatedFeeDecimal = toDecimal(feeInSmallestUnits).mul(overestimateMultiplier);
    feeInSmallestUnits = overestimatedFeeDecimal.floor().toString();
  }
  
  return {
    fee: feeInSmallestUnits,
    feeDecimal: totalNetworkFee,
    transactionSize,
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
      interfaceAddress,
      overestimatePercent = 5.0
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
      const rate = await ExchangeRateService.getExchangeRate(contractId);
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
    const networkFee = await calculateNetworkFee(
      protoObject,
      transactionType,
      baseFeeId,
      exchangeRates,
      overestimatePercent
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
  static updateFeeConstants(newConstants: Record<string, unknown>) {
    updateFeeConstants(newConstants);
  }

  /**
   * Get exchange rate for a given contract ID
   */
  static async getExchangeRate(contractId: string): Promise<Decimal> {
    return ExchangeRateService.getExchangeRate(contractId);
  }

  /**
   * Get comprehensive fee information for contracts
   * 
   * @param contractIds - Array of contract IDs to get fee info for
   * @returns Promise with fee information including rates and contract details
   */
  static async getTokenFeeInfo(
    contractIds: string[]
  ): Promise<{
    contractId: string;
    rate: Decimal;
    authorized: boolean;
    denomination: string;
    contractFees?: {
      fee: string;
      feeAddress?: Uint8Array;
      burn: string;
      validator: string;
    } | undefined;
  }[]> {
    const response = await getTokenFeeInfo({
      contractIds,
      includeRates: true,
      includeContractFees: true
    });

    // Transform the response to match the expected return type
    return response.tokens.map((token) => ({
      contractId: token.contractId,
      rate: toDecimal(token.rate),
      authorized: token.authorized,
      denomination: token.denomination,
      contractFees: token.contractFees ? {
        fee: token.contractFees.fee,
        ...(token.contractFees.feeAddress && { feeAddress: token.contractFees.feeAddress }),
        burn: token.contractFees.burn,
        validator: token.contractFees.validator
      } : undefined
    }));
  }
}
