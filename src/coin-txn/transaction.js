/**
 * Transaction Module - CoinTXN
 */

import {
  CoinTXNSchema as CoinTXN,
  InputTransfersSchema as InputTransfers,
  OutputTransfersSchema as OutputTransfers,
  BaseTXNSchema as BaseTXN,
  TransferAuthenticationSchema as TransferAuthentication,
  PublicKeySchema as PublicKey
} from '../../proto/generated/txn_pb.js';
import { create } from '@bufbuild/protobuf';
import { toBinary } from '@bufbuild/protobuf';
import { protoInt64 } from '@bufbuild/protobuf';
import { createSanitized, sanitizeProtobufObject } from '../shared/utils/protobuf-utils.js';
import {
  toSmallestUnits,
  validateAmountBalance,
  Decimal
} from '../shared/utils/amount-utils.js';
import { getPublicKeyBytes, generateAddressFromPublicKey } from '../shared/crypto/address-utils.js';
import { signTransactionData, createTransactionHash } from '../shared/crypto/signature-utils.js';
import { getNonces } from '../api/validator/nonce/index.js';
import { UniversalFeeCalculator } from '../shared/fee-calculators/universal-fee-calculator.js';
import { createTransactionClient } from '../grpc/transaction/transaction-client.js';
import bs58 from 'bs58';

/**
 * Validate contractID format
 * ContractID should follow the format: $[letters]+[4 digits]
 * Examples: $ZRA+0000, $BTC+1234, $ETH+9999
 * @param {string} contractId - Contract ID to validate
 * @returns {boolean} True if valid format
 */
export function validateContractId(contractId) {
  if (!contractId || typeof contractId !== 'string') {
    return false;
  }
  
  // Regex: $ followed by one or more letters, then + followed by exactly 4 digits
  const contractIdRegex = /^\$[A-Za-z]+\+\d{4}$/;
  return contractIdRegex.test(contractId);
}

/**
 * Process inputs and create authentication data
 * @param {Array} inputs - Input objects
 * @param {string} contractID - Contract ID
 * @param {Object} options - Nonce options
 * @returns {Promise<Object>} Processed input data
 */
async function processInputs(inputs, contractID, nonceOptions = {}) {
  const publicKeys = [];
  const inputTransfers = [];
  const addresses = [];

  var isAllowance = false;
  
  try {
    // Extract addresses for nonce requests
    for (const input of inputs) {

      if (!input.publicKey && !input.allowanceAddress) {
        throw new Error(`Input ${inputs.indexOf(input)} is missing publicKey`);
      } else if (input.allowanceAddress) {
        isAllowance = true;
      }

      var address = "";

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
    const nonceDecimals = await getNonces(addresses, nonceOptions);

    // For allowance transactions, split the results more efficiently
    let allowanceNonceDecimals = [];
    let allowanceAddresses = [];
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

      // Add public key for auth
      if (input.publicKey) {
        const publicKeyObj = create(PublicKey, { single: getPublicKeyBytes(input.publicKey) });
        publicKeys.push(publicKeyObj);
      } else if (!input.publicKey && !isAllowance) {
        throw new Error(`Input ${inputs.indexOf(input)} is missing publicKey`);
      } 

      // Allowance authorizor does not have an input
      if (isAllowance && input.publicKey) {
        continue;
      }
      
      // Create input transfer
      const finalAmount = toSmallestUnits(input.amount, contractID);
      const feePercent = input.feePercent !== undefined ? input.feePercent : '100';
      const scaledFeePercent = new Decimal(feePercent).mul(1000000).toNumber();
      
      const inputTransferData = {
        index: i,
        amount: finalAmount,
        feePercent: scaledFeePercent
      };
      
      inputTransfers.push(create(InputTransfers, inputTransferData));
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
 * @param {Array} outputs - Output objects
 * @param {string} contractId - Contract ID
 * @returns {Array} Processed output transfers
 */
function processOutputs(outputs, contractId) {
  return outputs.map(output => {
    const finalAmount = toSmallestUnits(output.amount, contractId);
    const data = {
      walletAddress: bs58.decode(output.to)
    };
    
    // Only include amount if it's not '0' or empty
    if (finalAmount && finalAmount !== '0' && finalAmount !== 0) {
      data.amount = finalAmount;
    }
    
    if (output.memo && output.memo.trim() !== '') {
      data.memo = output.memo;
    }
    return create(OutputTransfers, data);
  });
}

/**
 * Create transfer authentication
 * @param {Array} publicKeys - Public keys
 * @param {Array} signatures - Signatures
 * @param {Array} nonces - Nonces
 * @returns {Object} Transfer authentication
 */
function createTransferAuth(
  publicKeys,
  signatures,
  nonces,
  allowanceAddresses = null,
  allowanceNonces = null
) {
  const authData = {};
  if (publicKeys && publicKeys.length > 0) authData.publicKey = publicKeys;
  if (nonces && nonces.length > 0) authData.nonce = nonces;
  if (signatures && signatures.length > 0) authData.signature = signatures;
  if (allowanceAddresses && allowanceAddresses.length > 0) authData.allowanceAddress = allowanceAddresses;
  if (allowanceNonces && allowanceNonces.length > 0) authData.allowanceNonce = allowanceNonces;
  return create(TransferAuthentication, authData);
}

/**
 * Create timestamp for protobuf
 * @returns {Object} Timestamp object with seconds and nanos
 */
function createTimestamp() {
  const now = Date.now();
  const seconds = Math.floor(now / 1000);
  
  return {
    seconds: seconds, // Use number instead of BigInt for serialization compatibility
    nanos: 0
  };
}

/**
 * Create base transaction for CoinTXN
 * Note: CoinTXN base only has timestamp, feeAmount, and feeId (no public key or nonce)
 * @param {string} baseFeeId - Base fee ID
 * @param {string} baseFee - Base fee amount
 * @param {string} baseMemo - Base memo
 * @returns {Object} Base transaction
 */
function createBaseTransaction(baseFeeId, baseFee, baseMemo) {
  // Validate base fee is not 0
  if (!baseFee || baseFee === '0' || baseFee === 0) {
    throw new Error('Base fee must be provided and cannot be 0');
  }

  const baseData = {
    timestamp: createTimestamp(),
    feeAmount: toSmallestUnits(baseFee, baseFeeId),
    feeId: baseFeeId
  };
  
  if (baseMemo && baseMemo.trim() !== '') {
    baseData.memo = baseMemo;
  }
  
  return create(BaseTXN, baseData);
}

/**
 * @typedef {Object} FeeConfig
 * @property {string} [baseFeeId='$ZRA+0000'] - Base fee instrument (e.g., '$ZRA+0000') - if provided, automatic fee calculation uses this instrument
 * @property {string} [contractFeeId] - Contract fee instrument (defaults to contractId) - if provided, automatic fee calculation uses this instrument
 * @property {Decimal|string|number} [baseFee] - Base fee amount in user-friendly units (converted to smallest units) - if not provided, automatic fee calculation is used
 * @property {Decimal|string|number} [contractFee] - Contract fee amount in user-friendly units (converted to smallest units) - if not provided, automatic fee calculation is used
 */

/**
 * Create a CoinTXN with inputs and outputs using exact decimal arithmetic
 * Uses automatic fee calculation by default unless fee amounts are explicitly provided
 * @param {Array} inputs - Array of input objects {privateKey: string, publicKey: string, amount: Decimal|string|number, feePercent?: string, keyType?: string}
 * @param {Array} outputs - Array of output objects {to: string, amount: Decimal|string|number, memo?: string}
 * @param {string} contractId - Contract ID (e.g., '$ZRA+0000') - must follow format $[letters]+[4 digits]
 * @param {FeeConfig} feeConfig - Fee configuration object with the following properties:
 *   - baseFeeId (string, optional): The fee instrument ID (defaults to '$ZRA+0000') - if provided, automatic fee calculation uses this instrument
 *   - contractFeeId (string, optional): Contract fee instrument, defaults to contractId if not provided - if provided, automatic fee calculation uses this instrument
 *   - baseFee (Decimal|string|number, optional): Base fee amount in user-friendly units (converted to smallest units) - if not provided, automatic fee calculation is used
 *   - contractFee (Decimal|string|number, optional): Contract fee amount in user-friendly units (converted to smallest units) - if not provided, automatic fee calculation is used
 * @param {string} [baseMemo] - Base memo for the transaction (optional)
 * @returns {Promise<proto.zera_txn.CoinTXN>} Signed and hashed transaction
 */
export async function createCoinTXN(inputs, outputs, contractId, feeConfig = {}, baseMemo = '', nonceOptions = {}) {
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
    interfaceAddress
  } = feeConfig;

  // Step 1: Process inputs (includes nonce generation)
  const { publicKeys, inputTransfers, nonces, allowanceAddresses, allowanceNonces } = await processInputs(inputs, contractId, nonceOptions);

  // Used for signatures at bottom, accounts for allowance inputs (filtered to exclude allowance-based inputs)
  const signersArray = JSON.parse(JSON.stringify(inputs)).filter(input => !input.allowanceAddress);

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
  const totalFeePercent = inputTransfers.reduce((sum, t) => new Decimal(sum).add(t.feePercent).toNumber(), 0);
  if (totalFeePercent !== 100000000) {
    throw new Error(`Fee percentages must sum to exactly 100% (100,000,000). Current sum: ${totalFeePercent}`);
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
      auth: createTransferAuth(publicKeys, null, nonces, allowanceAddresses, allowanceNonces), // No signatures initially
      inputTransfers,
      outputTransfers
    };

    // Only include contract fee fields if there's actually a contract fee
    if (finalContractFee !== undefined && finalContractFee !== null) {
      tempCoinTxnData.contractFeeId = contractFeeId;
      tempCoinTxnData.contractFeeAmount = toSmallestUnits(finalContractFee, contractFeeId);
    } else {
      // Explicitly set to undefined instead of letting protobuf assign empty strings
      tempCoinTxnData.contractFeeId = undefined;
      tempCoinTxnData.contractFeeAmount = undefined;
    }

    const tempCoinTxn = create(CoinTXN, tempCoinTxnData);

    // Use UniversalFeeCalculator unified fee calculation
    try {
      const feeResult = await UniversalFeeCalculator.calculateFee({
        protoObject: tempCoinTxn,
        baseFeeId,
        contractFeeId: shouldUseAutoContractFee ? contractFeeId : undefined,
        interfaceFeeAmount: shouldUseInterfaceFee ? interfaceFeeAmount : undefined,
        interfaceFeeId: shouldUseInterfaceFee ? interfaceFeeId : undefined,
        interfaceAddress: shouldUseInterfaceFee ? interfaceAddress : undefined
      });
      
      if (shouldUseAutoBaseFee) {
        finalBaseFee = feeResult.networkFee;
      } else { // check if their fee is valid...
        if (baseFee < feeResult.networkFee) {
          console.warn(`WARNING: Base fee ${baseFee} is less than the calculated base fee ${feeResult.BaseFee}. Transaction expected to be rejected by network.`);
        }
      }

      if (shouldUseAutoContractFee) {
        finalContractFee = feeResult.contractFee;
      }
    } catch (error) {
      throw new Error(`Failed to calculate automatic fee: ${error.message}`);
    }
  }
  
  // Validate base fee is not 0
  if (!finalBaseFee || finalBaseFee === '0' || finalBaseFee === 0) {
    throw new Error('Base fee must be provided and cannot be 0');
  }

  // Step 7: Create final base transaction with correct fees
  const txnBase = createBaseTransaction(baseFeeId, finalBaseFee, baseMemo);

  // Add interface fees to base transaction if specified
  if (shouldUseInterfaceFee) {
    txnBase.interfaceFee = toSmallestUnits(interfaceFeeAmount, interfaceFeeId);
    txnBase.interfaceFeeId = interfaceFeeId;
    if (interfaceAddress) {
      txnBase.interfaceAddress = bs58.decode(interfaceAddress);
    }
  }

  // Step 8: Create initial transaction (without signatures and without hash) - Match Go SDK
  const coinTxnData = {
    base: txnBase, // This base doesn't have hash yet
    contractId,
    auth: createTransferAuth(publicKeys, null, nonces, allowanceAddresses, allowanceNonces), // Only add fields that have values
    inputTransfers,
    outputTransfers
  };

  // Only include contract fee fields if there's actually a contract fee
  if (finalContractFee !== undefined && finalContractFee !== null) {
    coinTxnData.contractFeeId = contractFeeId;
    coinTxnData.contractFeeAmount = toSmallestUnits(finalContractFee, contractFeeId);
  } else {
    // Explicitly set to undefined instead of letting protobuf assign empty strings
    coinTxnData.contractFeeId = undefined;
    coinTxnData.contractFeeAmount = undefined;
  }

  let coinTxn = create(CoinTXN, coinTxnData);

  // Step 9: Sign transaction (without hash) - Match Go SDK process exactly
  const serializedTxnWithoutHash = toBinary(CoinTXN, coinTxn);
  
  // Sign and add signatures directly to the existing transaction (like Go SDK)
  // Initialize signature array if it doesn't exist (field was not present initially)
  if (!coinTxn.auth.signature) {
    coinTxn.auth.signature = [];
  }
  
  for (let i = 0; i < signersArray.length; i++) {
    try {
      const signature = signTransactionData(serializedTxnWithoutHash, signersArray[i].privateKey, signersArray[i].publicKey);
      coinTxn.auth.signature.push(signature); // Add signature directly to existing auth
    } catch (error) {
      throw new Error(`Failed to sign transaction with input ${i}: ${error.message}`);
    }
  }

  // Step 10: Marshal the transaction with signatures
  const serializedTxnWithSignatures = toBinary(CoinTXN, coinTxn);

  // Step 11: Hash the serialized data with signatures
  const hash = createTransactionHash(serializedTxnWithSignatures);

  // Step 12: Add the hash to the existing transaction
  coinTxn.base.hash = hash;

  // Sanitize the final result to convert empty strings to undefined
  coinTxn = sanitizeProtobufObject(coinTxn, { removeEmptyFields: true });

  return coinTxn;
}


/**
 * Send a CoinTXN via gRPC using Connect client
 * @param {object} coinTxn - CoinTXN protobuf message
 * @param {object} [grpcConfig] - gRPC configuration object
 * @param {string} [grpcConfig.endpoint] - Full endpoint URL (e.g., 'http://host:50052' or 'host:50052')
 * @param {string} [grpcConfig.host='routing.zerascan.io'] - Host address
 * @param {number} [grpcConfig.port=50052] - Port number
 * @param {('http'|'https')} [grpcConfig.protocol='http'] - Protocol to use
 * @param {object} [grpcConfig.nodeOptions] - Additional Node.js options for the transport
 * @returns {Promise<string>} Transaction hash on success
 * @throws {Error} Error message with failure reason
 */
export async function sendCoinTXN(coinTxn, grpcConfig = {}) {

  try {
    const client = createTransactionClient(grpcConfig);
    const response = await client.submitCoinTransaction(coinTxn);
    
    // Return transaction hash on success
    return coinTxn.base?.hash ? 
      Buffer.from(coinTxn.base.hash).toString('hex') : 
      'Transaction sent successfully (no hash available)';
  } catch (error) {
    throw new Error(`Failed to submit coin transaction: ${error.message}`);
  }
}


