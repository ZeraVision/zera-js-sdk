/**
 * Transaction Module - CoinTXN
 * 
 * This module provides comprehensive functionality for creating and managing
 * CoinTXN transactions on the ZERA Network. It handles transaction creation,
 * signing, validation, and submission with full type safety and error handling.
 * 
 * @module CoinTXN
 * @version 1.0.0
 * @author ZERA Vision
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * import { createCoinTXN, sendCoinTXN } from '@zera/sdk';
 * 
 * // Create a transaction
 * const transaction = await createCoinTXN(
 *   inputs,
 *   outputs,
 *   '$ZRA+0000',
 *   feeConfig
 * );
 * 
 * // Send the transaction
 * const txHash = await sendCoinTXN(transaction);
 * ```
 */

import {
  CoinTXNSchema,
  InputTransfersSchema,
  OutputTransfersSchema,
  BaseTXNSchema,
  TransferAuthenticationSchema,
  PublicKeySchema
} from '../../proto/generated/txn_pb.js';
import type { 
  CoinTXN,
  InputTransfers,
  OutputTransfers,
  BaseTXN,
  TransferAuthentication,
  PublicKey
} from '../../proto/generated/txn_pb.js';
import { create } from '@bufbuild/protobuf';
import { toBinary } from '@bufbuild/protobuf';
import { protoInt64 } from '@bufbuild/protobuf';
import { timestampFromDate, type Timestamp } from '@bufbuild/protobuf/wkt';
import { getPublicKeyBytes, generateAddressFromPublicKey } from '../shared/crypto/address-utils.js';
import { signTransactionData, createTransactionHash } from '../shared/crypto/signature-utils.js';
import { getNonces } from '../api/validator/nonce/service.js';
import { UniversalFeeCalculator, type FeeCalculationOptions } from '../shared/fee-calculators/universal-fee-calculator.js';
import { createTransactionClient } from '../grpc/transaction/transaction-client.js';
import bs58 from 'bs58';
import { toSmallestUnits, validateAmountBalance, Decimal, toDecimal } from '../shared/utils/amount-utils.js';
import { TESTING_GRPC_CONFIG } from '../shared/utils/testing-defaults/grpc-config.js';
import type { 
  CoinTXNInput, 
  CoinTXNOutput, 
  FeeConfig, 
  GRPCConfig, 
  ContractId, 
  AmountInput 
} from '../types/index.js';

/**
 * Validates contract ID format according to ZERA Network standards.
 * 
 * Contract IDs must follow the format: $[letters]+[4 digits]
 * This ensures consistency across the network and prevents invalid contract references.
 * 
 * @param contractId - The contract ID to validate
 * @returns `true` if the contract ID format is valid, `false` otherwise
 * 
 * @example
 * ```typescript
 * validateContractId('$ZRA+0000'); // true
 * validateContractId('$BTC+1234'); // true
 * validateContractId('invalid');   // false
 * validateContractId('$ZRA+00');   // false (missing digits)
 * ```
 * 
 * @throws {ValidationError} When contract ID format is invalid
 * @since 1.0.0
 */
export function validateContractId(contractId: ContractId): boolean {
  // Regex: $ followed by one or more letters, then + followed by exactly 4 digits
  const contractIdRegex = /^\$[A-Za-z]+\+\d{4}$/;
  return contractIdRegex.test(contractId);
}

/**
 * Process inputs and create authentication data
 */
async function processInputs(
  inputs: CoinTXNInput[], 
  contractID: ContractId, 
  grpcConfig: GRPCConfig = {}
): Promise<{
  publicKeys: PublicKey[];
  inputTransfers: InputTransfers[];
  nonces: bigint[];
  allowanceAddresses: Uint8Array[] | null;
  allowanceNonces: bigint[] | null;
}> {
  const publicKeys: PublicKey[] = [];
  const inputTransfers: InputTransfers[] = [];
  const addresses: string[] = [];

  let isAllowance = false;
  
  try {
    // Extract addresses for nonce requests
    for (const input of inputs) {

      if (!input.publicKey && !input.allowanceAddress) {
        throw new Error(`Input ${inputs.indexOf(input)} is missing publicKey`);
      } else if (input.allowanceAddress) {
        isAllowance = true;
      }

      let address = "";

      if (input.publicKey) {
        address = generateAddressFromPublicKey(input.publicKey);
      } else if (input.allowanceAddress) {
        address = input.allowanceAddress;
      } else {
        throw new Error(`Input ${inputs.indexOf(input)} is missing or using unsupported publicKey type`);
      }

      addresses.push(address);
    }
    
    // Get nonces for all inputs
    const nonceDecimals = await getNonces(addresses, grpcConfig);

    // For allowance transactions, split the results more efficiently
    let allowanceNonceDecimals: Decimal[] = [];
    let allowanceAddresses: string[] = [];
    let finalNonceDecimals = nonceDecimals;
    let finalAddresses = addresses;

    if (isAllowance) {
      // Extract allowance data: everything from index 1 onwards (maintaining order)
      allowanceNonceDecimals = nonceDecimals.slice(1);
      allowanceAddresses = addresses.slice(1);
      
      // Keep only index 0 for the main transaction (non-allowance)
      finalNonceDecimals = nonceDecimals.slice(0, 1);
      finalAddresses = addresses.slice(0, 1);
    }
    
    // Process each input
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      
      if (!input) {
        throw new Error(`Input at index ${i} is undefined`);
      }

      // Add public key for auth
      if (input.publicKey) {
        const publicKeyObj = create(PublicKeySchema, { single: getPublicKeyBytes(input.publicKey) }) as PublicKey;
        publicKeys.push(publicKeyObj);
      } else if (!input.publicKey && !isAllowance) {
        throw new Error(`Input ${i} is missing publicKey`);
      } 

      // Allowance authorizor does not have an input
      if (isAllowance && input.publicKey) {
        continue;
      }
      
      // Create input transfer
      const finalAmount = toSmallestUnits(input.amount, contractID);
      const feePercent = input.feePercent !== undefined ? input.feePercent : '100';
      const scaledFeePercent = new Decimal(feePercent).mul(1000000).toFixed(0);
      
      const inputTransferData = {
        index: i,
        amount: finalAmount,
        feePercent: scaledFeePercent
      };
      
      inputTransfers.push(create(InputTransfersSchema, inputTransferData) as InputTransfers);
    }
    
    // Convert Decimal nonces to uint64 using protobuf utilities
    const nonces = finalNonceDecimals.map(nonce => protoInt64.uParse(nonce.toString()));
    
    // Parse allowance nonces to uint64 and handle empty arrays
    const allowanceNonces = allowanceNonceDecimals.length > 0 
      ? allowanceNonceDecimals.map(nonce => protoInt64.uParse(nonce.toString()))
      : null;
    
    const finalAllowanceAddresses = allowanceAddresses.length > 0 
      ? allowanceAddresses.map(addr => bs58.decode(addr)) 
      : null;
    
    return { publicKeys, inputTransfers, nonces, allowanceAddresses: finalAllowanceAddresses, allowanceNonces };
  } catch (error) {
    console.error('Error in processInputs:', error);
    throw error;
  }
}

/**
 * Process outputs
 */
function processOutputs(outputs: CoinTXNOutput[], contractId: ContractId): OutputTransfers[] {
  return outputs.map(output => {
    const finalAmount = toSmallestUnits(output.amount, contractId);
    const data: Partial<OutputTransfers> = {
      walletAddress: bs58.decode(output.to)
    };
    
    // Only include amount if it's not '0' or empty
    if (finalAmount && finalAmount !== '0') {
      data.amount = finalAmount;
    }
    
    if (output.memo && output.memo.trim() !== '') {
      data.memo = output.memo;
    }
    return create(OutputTransfersSchema, data) as OutputTransfers;
  });
}

/**
 * Create transfer authentication
 */
function createTransferAuth(
  publicKeys: PublicKey[],
  signatures: Uint8Array[],
  nonces: bigint[],
  allowanceAddresses: Uint8Array[] | null = null,
  allowanceNonces: bigint[] | null = null
): TransferAuthentication {
  const authData: Partial<TransferAuthentication> = {};
  if (publicKeys && publicKeys.length > 0) authData.publicKey = publicKeys;
  if (nonces && nonces.length > 0) authData.nonce = nonces;
  if (signatures && signatures.length > 0) authData.signature = signatures;
  if (allowanceAddresses && allowanceAddresses.length > 0) authData.allowanceAddress = allowanceAddresses;
  if (allowanceNonces && allowanceNonces.length > 0) authData.allowanceNonce = allowanceNonces;
  return create(TransferAuthenticationSchema, authData) as TransferAuthentication;
}

/**
 * Create base transaction for CoinTXN
 * Note: CoinTXN base only has timestamp, feeAmount, and feeId (no public key or nonce)
 */
function createBaseTransaction(baseFeeId: string, baseFee: AmountInput, baseMemo: string): BaseTXN {
  // Validate base fee is not 0
  if (!baseFee || baseFee === '0') {
    throw new Error('Base fee must be provided and cannot be 0');
  }

  const baseData: Partial<BaseTXN> = {
    timestamp: timestampFromDate(new Date()),
    feeAmount: String(baseFee),
    feeId: baseFeeId
  };
  
  if (baseMemo && baseMemo.trim() !== '') {
    baseData.memo = baseMemo;
  }
  
  return create(BaseTXNSchema, baseData) as BaseTXN;
}

/**
 * Creates a CoinTXN transaction with inputs and outputs using exact decimal arithmetic.
 * 
 * This function handles the complete transaction creation process including:
 * - Input validation and processing
 * - Output validation and processing
 * - Nonce retrieval from the network
 * - Automatic fee calculation (if not provided)
 * - Transaction signing
 * - Hash generation
 * 
 * @param inputs - Array of transaction inputs containing private keys, amounts, and fee percentages
 * @param outputs - Array of transaction outputs containing recipient addresses and amounts
 * @param contractId - The contract ID for the transaction (e.g., '$ZRA+0000')
 * @param feeConfig - Optional fee configuration. If not provided, fees will be calculated automatically
 * @param baseMemo - Optional memo for the transaction
 * @param grpcConfig - Optional gRPC configuration for network communication
 * @returns Promise that resolves to a complete CoinTXN ready for submission
 * 
 * @example
 * ```typescript
 * const inputs: CoinTXNInput[] = [{
 *   privateKey: 'your-private-key',
 *   publicKey: 'your-public-key',
 *   amount: '10.5',
 *   feePercent: '100'
 * }];
 * 
 * const outputs: CoinTXNOutput[] = [{
 *   to: 'recipient-address',
 *   amount: '10.0',
 *   memo: 'Payment for services'
 * }];
 * 
 * const transaction = await createCoinTXN(
 *   inputs,
 *   outputs,
 *   '$ZRA+0000',
 *   { baseFeeId: '$ZRA+0000' },
 *   'Transaction memo'
 * );
 * ```
 * 
 * @throws {ValidationError} When inputs, outputs, or contract ID are invalid
 * @throws {NetworkError} When network communication fails
 * @throws {CryptoError} When cryptographic operations fail
 * @throws {TransactionError} When transaction creation fails
 * 
 * @since 1.0.0
 */
export async function createCoinTXN(
  inputs: CoinTXNInput[], 
  outputs: CoinTXNOutput[], 
  contractId: ContractId, 
  feeConfig: FeeConfig = {}, 
  baseMemo: string = '', 
  grpcConfig: GRPCConfig = TESTING_GRPC_CONFIG
): Promise<CoinTXN> {
  // Validate inputs
  if (!Array.isArray(inputs) || !Array.isArray(outputs)) {
    throw new Error('Inputs and outputs must be arrays');
  }
  if (inputs.length === 0 || outputs.length === 0) {
    throw new Error('Must have at least one input and one output');
  }
  if (!contractId || !validateContractId(contractId)) {
    throw new Error('ContractId must be provided and follow the format $[letters]+[4 digits] (e.g., $ZRA+0000)');
  }

  const {
    baseFeeId = '$ZRA+0000',
    baseFee,
    contractFeeId,
    contractFee,
    interfaceFeeId,
    interfaceFeeAmount,
    interfaceAddress,
    overestimatePercent = 5.0
  } = feeConfig;

  // Step 1: Process inputs (includes nonce generation)
  const { publicKeys, inputTransfers, nonces, allowanceAddresses, allowanceNonces } = await processInputs(inputs, contractId, grpcConfig);

  // Used for signatures at bottom, accounts for allowance inputs (filtered to exclude allowance-based inputs)
  const signersArray = JSON.parse(JSON.stringify(inputs)).filter((input: CoinTXNInput) => !input.allowanceAddress);

  // If allowance, remove them from input
  if (allowanceAddresses && allowanceAddresses.length > 0) {    
    // Remove index 0 from inputs (allowance authorizer)
    inputs.splice(0, 1);
  }

  // Step 2: Process outputs
  const outputTransfers = processOutputs(outputs, contractId);

  // Step 3: Validate balance
  const inputAmounts = inputs.map(i => toSmallestUnits(i.amount, contractId));
  const outputAmounts = outputs.map(o => toSmallestUnits(o.amount, contractId));
  validateAmountBalance(inputAmounts, outputAmounts);

  // Step 4: Validate fee percentages
  const totalFeePercent = inputTransfers.reduce((sum, t) => new Decimal(sum).add(t.feePercent), new Decimal(0));
  if (!totalFeePercent.equals(100000000)) {
    throw new Error(`Fee percentages must sum to exactly 100% (100,000,000). Current sum: ${totalFeePercent.toString()}`);
  }

  // Step 5: Determine fee calculation strategy
  const shouldUseAutoBaseFee = baseFee === undefined;
  const shouldUseAutoContractFee = contractFee === undefined;
  const shouldUseInterfaceFee = interfaceFeeId !== undefined;
  
  // Step 6: Create initial transaction without fees (for fee calculation)
  let finalBaseFee = baseFee;
  let finalContractFee = contractFee;
  
  if (shouldUseAutoBaseFee || shouldUseAutoContractFee || shouldUseInterfaceFee) {

    // Create a temporary transaction without fees for size calculation
    const tempTxnBase = createBaseTransaction(baseFeeId, '1', baseMemo); // Use 1 fee temporarily
    const tempCoinTxnData = {
      base: tempTxnBase,
      contractId,
      auth: createTransferAuth(publicKeys, [], nonces, allowanceAddresses, allowanceNonces), // No signatures initially
      inputTransfers,
      outputTransfers,
      contractFeeId: undefined as string | undefined,
      contractFeeAmount: undefined as string | undefined
    };

    // Only include contract fee fields if there's actually a contract fee
    if (finalContractFee !== undefined && finalContractFee !== null) {
      tempCoinTxnData.contractFeeId = contractFeeId;
      tempCoinTxnData.contractFeeAmount = toSmallestUnits(finalContractFee, contractFeeId, true);
    } else {
      // Explicitly set to undefined instead of letting protobuf assign empty strings
      tempCoinTxnData.contractFeeId = undefined;
      tempCoinTxnData.contractFeeAmount = undefined;
    }

    const tempCoinTxn = create(CoinTXNSchema, tempCoinTxnData) as CoinTXN;

    // Use UniversalFeeCalculator unified fee calculation
    try {
      const feeOptions: FeeCalculationOptions<CoinTXN> = {
        protoObject: tempCoinTxn,
        baseFeeId
      };
      
      if (shouldUseAutoContractFee && contractFeeId) {
        feeOptions.contractFeeId = contractFeeId;
      }
      
      if (shouldUseInterfaceFee) {
        if (interfaceFeeAmount) feeOptions.interfaceFeeAmount = interfaceFeeAmount;
        if (interfaceFeeId) feeOptions.interfaceFeeId = interfaceFeeId;
        if (interfaceAddress) feeOptions.interfaceAddress = interfaceAddress;
      }
      
      if (overestimatePercent !== undefined) {
        feeOptions.overestimatePercent = overestimatePercent;
      }
      
      const feeResult = await UniversalFeeCalculator.calculateFee(feeOptions);
      
      if (shouldUseAutoBaseFee) {
        finalBaseFee = feeResult.networkFee;
        } else { // check if their fee is valid...
          if (baseFee && toDecimal(baseFee).lessThan(toDecimal(feeResult.networkFee))) {
            console.warn(`WARNING: Base fee ${baseFee} is less than the calculated base fee ${feeResult.networkFee}. Transaction expected to be rejected by network.`);
          }
        }

      if (shouldUseAutoContractFee) {
        finalContractFee = feeResult.contractFee !== null ? feeResult.contractFee : undefined;
      }
    } catch (error) {
      throw new Error(`Failed to calculate automatic fee: ${(error as Error).message}`);
    }
  }
  
  // Validate base fee is not 0
  if (!finalBaseFee || finalBaseFee === '0' || finalBaseFee === 0) {
    throw new Error('Base fee must be provided and cannot be 0');
  }

  // Step 7: Create final base transaction with correct fees
  const txnBase = createBaseTransaction(baseFeeId, finalBaseFee, baseMemo);

  // Add interface fees to base transaction if specified
  if (shouldUseInterfaceFee && interfaceFeeAmount && interfaceFeeId) {
    txnBase.interfaceFee = toSmallestUnits(interfaceFeeAmount, interfaceFeeId, true);
    txnBase.interfaceFeeId = interfaceFeeId;
    if (interfaceAddress) {
      txnBase.interfaceAddress = bs58.decode(interfaceAddress);
    }
  }

  // Step 8: Create initial transaction (without signatures and without hash) - Match Go SDK
  const coinTxnData: Partial<CoinTXN> = {
    base: txnBase, // This base doesn't have hash yet
    contractId,
    auth: createTransferAuth(publicKeys, [], nonces, allowanceAddresses, allowanceNonces), // Only add fields that have values
    inputTransfers,
    outputTransfers
  };

  // Only include contract fee fields if there's actually a contract fee
  if (finalContractFee !== undefined && finalContractFee !== null && contractFeeId) {
    coinTxnData.contractFeeId = contractFeeId;
    coinTxnData.contractFeeAmount = toSmallestUnits(finalContractFee, contractFeeId, true);
  }

  let coinTxn = create(CoinTXNSchema, coinTxnData) as CoinTXN;

  // Step 9: Sign transaction (without hash) - Match Go SDK process exactly
  const serializedTxnWithoutHash = toBinary(CoinTXNSchema, coinTxn);
  
  // Sign and add signatures directly to the existing transaction (like Go SDK)
  // Initialize signature array if it doesn't exist (field was not present initially)
  const authData = coinTxn.auth || {} as Partial<TransferAuthentication>;
  if (!authData.signature) {
    authData.signature = [];
  }

  // Sanitize the protobuf object here to eliminate any empty strings
  //coinTxn = sanitizeProtobufObject(coinTxn, { removeEmptyFields: true });
  
  for (let i = 0; i < signersArray.length; i++) {
    try {
      const signature = signTransactionData(serializedTxnWithoutHash, signersArray[i].privateKey, signersArray[i].publicKey);
      authData.signature.push(signature); // Add signature directly to existing auth
    } catch (error) {
      throw new Error(`Failed to sign transaction with input ${i}: ${(error as Error).message}`);
    }
  }

  // Step 10: Marshal the transaction with signatures
  const serializedTxnWithSignatures = toBinary(CoinTXNSchema, coinTxn);

  // Step 11: Hash the serialized data with signatures
  const hash = createTransactionHash(serializedTxnWithSignatures);

  // Step 12: Add the hash to the existing transaction
  const baseData = coinTxn.base || {} as Partial<BaseTXN>;
  baseData.hash = hash;

  return coinTxn;
}

/**
 * Sends a CoinTXN transaction to the ZERA Network via gRPC.
 * 
 * This function submits a completed transaction to the network for processing.
 * The transaction must be properly signed and have a valid hash before submission.
 * 
 * @param coinTxn - The complete CoinTXN transaction to submit
 * @param grpcConfig - Optional gRPC configuration for network communication
 * @returns Promise that resolves to the transaction hash on successful submission
 * 
 * @example
 * ```typescript
 * const transaction = await createCoinTXN(inputs, outputs, '$ZRA+0000');
 * const txHash = await sendCoinTXN(transaction);
 * console.log('Transaction submitted:', txHash);
 * ```
 * 
 * @throws {NetworkError} When network communication fails
 * @throws {TransactionError} When transaction submission fails
 * @throws {ValidationError} When transaction is invalid or incomplete
 * 
 * @since 1.0.0
 */
export async function sendCoinTXN(coinTxn: CoinTXN, grpcConfig: GRPCConfig = {}): Promise<string> {
  try {
    const client = createTransactionClient(grpcConfig);
    const response = await client.submitCoinTransaction(coinTxn);
    
    // Return transaction hash on success
    return coinTxn.base?.hash ? 
      Buffer.from(coinTxn.base.hash).toString('hex') : 
      'Transaction sent successfully (no hash available)';
  } catch (error) {
    // Preserve the original error type for proper error handling
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to submit coin transaction: ${(error as Error).message}`);
  }
}
