/**
 * Transaction Size Calculator
 * Calculates the byte size of transactions without including fees
 * This solves the catch-22 problem of fee calculation
 */

import { create } from '@bufbuild/protobuf';
import {
  CoinTXNSchema as CoinTXN,
  InputTransfersSchema as InputTransfers,
  OutputTransfersSchema as OutputTransfers,
  BaseTXNSchema as BaseTXN,
  TransferAuthenticationSchema as TransferAuthentication,
  PublicKeySchema as PublicKey
} from '../../../proto/generated/txn_pb.js';
import { KEY_TYPE } from '../../wallet-creation/constants.js';
import { TRANSACTION_TYPE } from '../protobuf-enums.js';
import { toSmallestUnits } from './amount-utils.js';
import { getPublicKeyBytes } from '../crypto/address-utils.js';
import bs58 from 'bs58';

/**
 * Constants for transaction component sizes (in bytes)
 * These are based on protobuf encoding overhead and actual data sizes
 */
export const TRANSACTION_COMPONENT_SIZES = {
  // Base transaction components (without fee)
  BASE_TXN_MINIMAL: 32,           // timestamp + minimal overhead
  BASE_TXN_MEMO_PER_CHAR: 1,      // memo characters
  
  // Public key sizes
  PUBLIC_KEY_ED25519: 32,          // Ed25519 public key
  PUBLIC_KEY_ED448: 57,           // Ed448 public key
  
  // Signature sizes
  SIGNATURE_ED25519: 64,          // Ed25519 signature
  SIGNATURE_ED448: 114,           // Ed448 signature
  
  // Transfer components
  INPUT_TRANSFER_BASE: 16,        // index + amount + feePercent overhead
  OUTPUT_TRANSFER_BASE: 16,       // walletAddress + amount overhead
  OUTPUT_TRANSFER_MEMO_PER_CHAR: 1, // memo characters
  
  // Authentication components
  TRANSFER_AUTH_BASE: 8,          // authentication overhead
  NONCE_SIZE: 8,                  // nonce (uint64)
  
  // Contract and fee components
  CONTRACT_ID_SIZE: 12,           // typical contract ID like "$ZRA+0000"
  FEE_AMOUNT_SIZE: 8,             // fee amount (string, varies but estimate)
  FEE_ID_SIZE: 12,                // fee ID (string)
  
  // Protobuf overhead
  PROTOBUF_FIELD_OVERHEAD: 2,     // field tag + wire type
  PROTOBUF_LENGTH_PREFIX: 1,      // length prefix for variable-length fields
  PROTOBUF_REPEATED_OVERHEAD: 1,  // overhead per repeated field item
};

/**
 * Get public key size based on key type
 * @param {string} keyType - Key type (ED25519, ED448, etc.)
 * @returns {number} Public key size in bytes
 */
export function getPublicKeySize(keyType) {
  switch (keyType) {
    case KEY_TYPE.ED25519:
      return TRANSACTION_COMPONENT_SIZES.PUBLIC_KEY_ED25519;
    case KEY_TYPE.ED448:
      return TRANSACTION_COMPONENT_SIZES.PUBLIC_KEY_ED448;
    default:
      return TRANSACTION_COMPONENT_SIZES.PUBLIC_KEY_ED25519; // default
  }
}

/**
 * Get signature size based on key type
 * @param {string} keyType - Key type (ED25519, ED448, etc.)
 * @returns {number} Signature size in bytes
 */
export function getSignatureSize(keyType) {
  switch (keyType) {
    case KEY_TYPE.ED25519:
      return TRANSACTION_COMPONENT_SIZES.SIGNATURE_ED25519;
    case KEY_TYPE.ED448:
      return TRANSACTION_COMPONENT_SIZES.SIGNATURE_ED448;
    default:
      return TRANSACTION_COMPONENT_SIZES.SIGNATURE_ED25519; // default
  }
}

/**
 * Calculate the size of a string field in protobuf
 * @param {string} str - String to measure
 * @returns {number} Size in bytes including protobuf overhead
 */
function calculateStringFieldSize(str) {
  if (!str) return 0;
  const strBytes = new TextEncoder().encode(str).length;
  return strBytes + TRANSACTION_COMPONENT_SIZES.PROTOBUF_LENGTH_PREFIX;
}

/**
 * Calculate the size of a bytes field in protobuf
 * @param {Uint8Array} bytes - Bytes to measure
 * @returns {number} Size in bytes including protobuf overhead
 */
function calculateBytesFieldSize(bytes) {
  if (!bytes) return 0;
  return bytes.length + TRANSACTION_COMPONENT_SIZES.PROTOBUF_LENGTH_PREFIX;
}

/**
 * Calculate the size of a repeated field in protobuf
 * @param {Array} items - Array of items
 * @param {Function} itemSizeCalculator - Function to calculate size of each item
 * @returns {number} Total size in bytes
 */
function calculateRepeatedFieldSize(items, itemSizeCalculator) {
  if (!items || items.length === 0) return 0;
  
  let totalSize = 0;
  for (const item of items) {
    totalSize += itemSizeCalculator(item);
  }
  
  return totalSize + (items.length * TRANSACTION_COMPONENT_SIZES.PROTOBUF_REPEATED_OVERHEAD);
}

/**
 * Calculate the size of a BaseTXN without fee
 * @param {Object} params - Base transaction parameters
 * @param {string} [params.memo] - Optional memo
 * @returns {number} Size in bytes
 */
export function calculateBaseTXNSize(params = {}) {
  let size = TRANSACTION_COMPONENT_SIZES.BASE_TXN_MINIMAL;
  
  // Add timestamp size (8 bytes for seconds + 4 bytes for nanos)
  size += 12;
  
  // Add memo size if present
  if (params.memo) {
    size += calculateStringFieldSize(params.memo);
  }
  
  return size;
}

/**
 * Calculate the size of input transfers
 * @param {Array} inputs - Input objects
 * @param {string} baseFeeId - Base fee ID for amount conversion
 * @returns {number} Size in bytes
 */
export function calculateInputTransfersSize(inputs, baseFeeId) {
  if (!inputs || inputs.length === 0) return 0;
  
  const itemSizeCalculator = (input) => {
    let size = TRANSACTION_COMPONENT_SIZES.INPUT_TRANSFER_BASE;
    
    // Add amount size (converted to smallest units)
    const amountStr = toSmallestUnits(input.amount, baseFeeId).toString();
    size += calculateStringFieldSize(amountStr);
    
    // Add feePercent size (uint32 = 4 bytes)
    size += 4;
    
    return size;
  };
  
  return calculateRepeatedFieldSize(inputs, itemSizeCalculator);
}

/**
 * Calculate the size of output transfers
 * @param {Array} outputs - Output objects
 * @param {string} baseFeeId - Base fee ID for amount conversion
 * @returns {number} Size in bytes
 */
export function calculateOutputTransfersSize(outputs, baseFeeId) {
  if (!outputs || outputs.length === 0) return 0;
  
  const itemSizeCalculator = (output) => {
    let size = TRANSACTION_COMPONENT_SIZES.OUTPUT_TRANSFER_BASE;
    
    // Add wallet address size (bytes field)
    const addressBytes = bs58.decode(output.to);
    size += calculateBytesFieldSize(addressBytes);
    
    // Add amount size (converted to smallest units)
    const amountStr = toSmallestUnits(output.amount, baseFeeId).toString();
    size += calculateStringFieldSize(amountStr);
    
    // Add memo size if present
    if (output.memo) {
      size += calculateStringFieldSize(output.memo);
    }
    
    return size;
  };
  
  return calculateRepeatedFieldSize(outputs, itemSizeCalculator);
}

/**
 * Calculate the size of transfer authentication
 * @param {Array} inputs - Input objects
 * @returns {number} Size in bytes
 */
export function calculateTransferAuthSize(inputs) {
  if (!inputs || inputs.length === 0) return 0;
  
  let size = TRANSACTION_COMPONENT_SIZES.TRANSFER_AUTH_BASE;
  
  // Add public keys size
  const publicKeySizeCalculator = (input) => {
    const keyType = input.keyType || KEY_TYPE.ED25519;
    const publicKeyBytes = getPublicKeyBytes(input.publicKey);
    return calculateBytesFieldSize(publicKeyBytes);
  };
  
  size += calculateRepeatedFieldSize(inputs, publicKeySizeCalculator);
  
  // Add signatures size (empty for size calculation)
  const signatureSizeCalculator = () => {
    const keyType = KEY_TYPE.ED25519; // Default for size calculation
    return calculateBytesFieldSize(new Uint8Array(getSignatureSize(keyType)));
  };
  
  size += calculateRepeatedFieldSize(inputs, signatureSizeCalculator);
  
  // Add nonces size
  const nonceSizeCalculator = () => TRANSACTION_COMPONENT_SIZES.NONCE_SIZE;
  size += calculateRepeatedFieldSize(inputs, nonceSizeCalculator);
  
  return size;
}

/**
 * Calculate the total size of a CoinTXN without fees
 * @param {Object} params - Transaction parameters
 * @param {Array} params.inputs - Input objects
 * @param {Array} params.outputs - Output objects
 * @param {string} params.contractId - Contract ID
 * @param {string} params.baseFeeId - Base fee ID
 * @param {string} [params.baseMemo] - Optional base memo
 * @param {string} [params.contractFeeId] - Optional contract fee ID
 * @param {string} [params.contractFee] - Optional contract fee amount
 * @returns {number} Total size in bytes
 */
export function calculateCoinTXNSize(params) {
  const {
    inputs,
    outputs,
    contractId,
    baseFeeId,
    baseMemo = '',
    contractFeeId,
    contractFee
  } = params;
  
  let totalSize = 0;
  
  // Base transaction size (without fee)
  totalSize += calculateBaseTXNSize({ memo: baseMemo });
  
  // Contract ID size
  totalSize += calculateStringFieldSize(contractId);
  
  // Transfer authentication size
  totalSize += calculateTransferAuthSize(inputs);
  
  // Input transfers size
  totalSize += calculateInputTransfersSize(inputs, baseFeeId);
  
  // Output transfers size
  totalSize += calculateOutputTransfersSize(outputs, baseFeeId);
  
  // Contract fee fields if present
  if (contractFeeId) {
    totalSize += calculateStringFieldSize(contractFeeId);
  }
  
  if (contractFee) {
    const contractFeeStr = toSmallestUnits(contractFee, contractFeeId || baseFeeId).toString();
    totalSize += calculateStringFieldSize(contractFeeStr);
  }
  
  // Add protobuf message overhead
  totalSize += 10; // Message overhead
  
  return totalSize;
}

/**
 * Calculate the size of fee fields that will be added
 * @param {string} baseFeeId - Base fee ID
 * @param {string} baseFeeAmount - Base fee amount (as string)
 * @returns {number} Size in bytes
 */
export function calculateFeeFieldsSize(baseFeeId, baseFeeAmount) {
  let size = 0;
  
  // Fee amount field
  size += calculateStringFieldSize(baseFeeAmount);
  
  // Fee ID field
  size += calculateStringFieldSize(baseFeeId);
  
  return size;
}

/**
 * Estimate transaction size with iterative fee calculation
 * This solves the catch-22 by iteratively calculating size and fee until convergence
 * @param {Object} params - Transaction parameters
 * @param {Function} feeCalculator - Function that calculates fee based on size
 * @param {number} [maxIterations=10] - Maximum iterations to prevent infinite loops
 * @param {number} [tolerance=1] - Tolerance in bytes for convergence
 * @returns {Object} Result with final size and fee
 */
export function estimateTransactionSizeWithFee(params, feeCalculator, maxIterations = 10, tolerance = 1) {
  let currentSize = calculateCoinTXNSize(params);
  let currentFee = '0';
  let iterations = 0;
  
  while (iterations < maxIterations) {
    // Calculate fee based on current size
    const newFee = feeCalculator(currentSize);
    
    // Calculate size with the new fee
    const feeSize = calculateFeeFieldsSize(params.baseFeeId, newFee);
    const newSize = currentSize + feeSize;
    
    // Check for convergence
    const sizeDiff = Math.abs(newSize - currentSize);
    const feeDiff = Math.abs(parseFloat(newFee) - parseFloat(currentFee));
    
    if (sizeDiff <= tolerance && feeDiff <= 0.000001) {
      return {
        size: newSize,
        fee: newFee,
        iterations: iterations + 1,
        converged: true
      };
    }
    
    currentSize = newSize;
    currentFee = newFee;
    iterations++;
  }
  
  return {
    size: currentSize,
    fee: currentFee,
    iterations,
    converged: false
  };
}
