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
import { TXNService } from '../../proto/generated/txn_pb.js';
import {
  toSmallestUnits,
  validateAmountBalance,
  Decimal
} from '../shared/utils/amount-utils.js';
import { getPublicKeyBytes } from '../shared/crypto/address-utils.js';
import { signTransactionData, createTransactionHash } from '../shared/crypto/signature-utils.js';
import { getNonces } from '../shared/utils/nonce-manager.js';
import { UniversalFeeCalculator } from '../shared/fee-calculators/universal-fee-calculator.js';
import { TRANSACTION_TYPE } from '../shared/protobuf-enums.js';
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
 * @param {string} baseFeeId - Base fee ID
 * @param {string} contractId - Contract ID
 * @returns {Promise<Object>} Processed input data
 */
async function processInputs(inputs, baseFeeId, contractId) {
  const publicKeys = [];
  const inputTransfers = [];
  const addresses = [];
  
  try {
    // Extract addresses for nonce requests
    for (const input of inputs) {
      if (!input.publicKey) {
        throw new Error(`Input ${inputs.indexOf(input)} is missing publicKey`);
      }
      const address = getPublicKeyBytes(input.publicKey);
      addresses.push(bs58.encode(address));
    }
    
    // Get nonces for all inputs (as Decimals)
    const nonceDecimals = await getNonces(addresses, contractId);
    
    // Process each input
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      
      // Store the full public key identifier (e.g., "A_c_pubkeybytes")
      const publicKeyObj = create(PublicKey, { single: new Uint8Array(Buffer.from(input.publicKey, 'utf8')) });
      publicKeys.push(publicKeyObj);
      
      // Create input transfer
      const finalAmount = toSmallestUnits(input.amount, baseFeeId);
      const feePercent = input.feePercent !== undefined ? input.feePercent : '100';
      const scaledFeePercent = new Decimal(feePercent).mul(1000000).toNumber();
      
      inputTransfers.push(create(InputTransfers, {
        index: BigInt(i), // Convert to BigInt for uint64 field
        amount: finalAmount,
        feePercent: scaledFeePercent
      }));
    }
    
    // Convert Decimal nonces to BigInt for protobuf uint64 fields
    const nonces = nonceDecimals.map(nonce => BigInt(nonce.toString()));
    
    return { publicKeys, inputTransfers, nonces };
  } catch (error) {
    console.error('Error in processInputs:', error);
    throw error;
  }
}

/**
 * Process outputs
 * @param {Array} outputs - Output objects
 * @param {string} baseFeeId - Base fee ID
 * @returns {Array} Processed output transfers
 */
function processOutputs(outputs, baseFeeId) {
  return outputs.map(output => {
    const finalAmount = toSmallestUnits(output.amount, baseFeeId);
    const data = {
      walletAddress: bs58.decode(output.to),
      amount: finalAmount
    };
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
function createTransferAuth(publicKeys, signatures, nonces, allowanceAddresses = [], allowanceNonces = []) {
  return create(TransferAuthentication, {
    publicKey: publicKeys,
    signature: signatures,
    nonce: nonces,
    allowanceAddress: allowanceAddresses,
    allowanceNonce: allowanceNonces
  });
}

/**
 * Create timestamp for protobuf
 * @returns {Object} Timestamp object with seconds and nanos
 */
function createTimestamp() {
  const now = Date.now();
  const seconds = Math.floor(now / 1000);
  
  return {
    seconds: BigInt(seconds), // Convert to BigInt for uint64 field
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
export async function createCoinTXN(inputs, outputs, contractId, feeConfig = {}, baseMemo = '') {
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
    contractFee
  } = feeConfig;

  // Step 1: Process inputs (includes nonce generation)
  const { publicKeys, inputTransfers, nonces } = await processInputs(inputs, baseFeeId, contractId);

  // Step 2: Process outputs
  const outputTransfers = processOutputs(outputs, baseFeeId);

  // Step 3: Validate balance
  const inputAmounts = inputs.map(i => toSmallestUnits(i.amount, baseFeeId));
  const outputAmounts = outputs.map(o => toSmallestUnits(o.amount, baseFeeId));
  validateAmountBalance(inputAmounts, outputAmounts);

  // Step 4: Validate fee percentages
  const totalFeePercent = inputTransfers.reduce((sum, t) => new Decimal(sum).add(t.feePercent).toNumber(), 0);
  if (totalFeePercent !== 100000000) {
    throw new Error(`Fee percentages must sum to exactly 100% (100,000,000). Current sum: ${totalFeePercent}`);
  }

  // Step 5: Determine fee calculation strategy
  const shouldUseAutoBaseFee = baseFee === undefined;
  const shouldUseAutoContractFee = contractFee === undefined;
  
  // Step 6: Create initial transaction without fees (for fee calculation)
  let finalBaseFee = baseFee;
  let finalContractFee = contractFee;
  
  if (shouldUseAutoBaseFee || shouldUseAutoContractFee) {
    // Create a temporary transaction without fees for size calculation
    const tempTxnBase = createBaseTransaction(baseFeeId, '1', baseMemo); // Use 1 fee temporarily
    const tempCoinTxnData = {
      base: tempTxnBase,
      contractId,
      auth: createTransferAuth(publicKeys, [], nonces), // Empty signatures initially
      inputTransfers,
      outputTransfers
    };

    if (finalContractFee !== undefined) {
      tempCoinTxnData.contractFeeAmount = toSmallestUnits(finalContractFee, contractFeeId);
      tempCoinTxnData.contractFeeId = contractFeeId;
    }

    const tempCoinTxn = create(CoinTXN, tempCoinTxnData);

    // Use UniversalFeeCalculator with the protobuf object
    try {
      const feeResult = await UniversalFeeCalculator.calculateNetworkFee({
        protoObject: tempCoinTxn,
        baseFeeId
      });
      
      if (shouldUseAutoBaseFee) {
        finalBaseFee = feeResult.fee;
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

  // Step 8: Create initial transaction (without signatures)
  const coinTxnData = {
    base: txnBase,
    contractId,
    auth: createTransferAuth(publicKeys, [], nonces), // Empty signatures initially
    inputTransfers,
    outputTransfers
  };

  if (finalContractFee !== undefined) {
    coinTxnData.contractFeeAmount = toSmallestUnits(finalContractFee, contractFeeId);
    coinTxnData.contractFeeId = contractFeeId;
  }

  let coinTxn = create(CoinTXN, coinTxnData);

  // Step 9: Sign transaction
  const signatures = [];
  const serializedTxn = toBinary(CoinTXN, coinTxn);
  
  for (let i = 0; i < inputs.length; i++) {
    try {
      const signature = signTransactionData(serializedTxn, inputs[i].privateKey, inputs[i].publicKey);
      signatures.push(signature);
    } catch (error) {
      throw new Error(`Failed to sign transaction with input ${i}: ${error.message}`);
    }
  }

  // Step 10: Create final transaction with signatures
  const finalAuth = createTransferAuth(publicKeys, signatures, nonces);
  const finalCoinTxnData = {
    ...coinTxnData,
    auth: finalAuth
  };

  coinTxn = create(CoinTXN, finalCoinTxnData);

  // Step 11: Add transaction hash
  const finalSerializedTxn = toBinary(CoinTXN, coinTxn);
  const hash = createTransactionHash(finalSerializedTxn);

  const finalBaseData = {
    ...txnBase,
    hash
  };

  const finalTxnBase = create(BaseTXN, finalBaseData);
  const finalTransactionData = {
    ...finalCoinTxnData,
    base: finalTxnBase
  };

  return create(CoinTXN, finalTransactionData);
}

/**
 * Enhanced CoinTXN creation with automatic fee calculation and detailed fee information
 * This version returns both the transaction and detailed fee calculation information
 * @param {Array} inputs - Array of input objects {privateKey: string, publicKey: string, amount: Decimal|string|number, feePercent?: string, keyType?: string}
 * @param {Array} outputs - Array of output objects {to: string, amount: Decimal|string|number, memo?: string}
 * @param {string} contractId - Contract ID (e.g., '$ZRA+0000') - must follow format $[letters]+[4 digits]
 * @param {Object} [feeConfig] - Fee configuration object
 * @param {string} [feeConfig.baseFeeId='$ZRA+0000'] - Base fee instrument ID
 * @param {string} [feeConfig.contractFeeId] - Contract fee instrument, defaults to contractId
 * @param {Decimal|string|number} [feeConfig.contractFee] - Contract fee amount (optional)
 * @param {Decimal|string|number} [feeConfig.baseFee] - Manual base fee amount (optional)
 * @param {string} [baseMemo] - Base memo for the transaction (optional)
 * @returns {Promise<Object>} Result object with transaction and fee information
 */
export async function createCoinTXNWithAutoFee(inputs, outputs, contractId, feeConfig = {}, baseMemo = '') {
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
    contractFeeId,
    baseFee,
    contractFee
  } = feeConfig;

  // Determine fee calculation strategy
  const shouldUseAutoBaseFee = baseFee === undefined;
  const shouldUseAutoContractFee = contractFee === undefined;
  
  // Step 1: Process inputs (includes nonce generation)
  const { publicKeys, inputTransfers, nonces } = await processInputs(inputs, baseFeeId, contractId);

  // Step 2: Process outputs
  const outputTransfers = processOutputs(outputs, baseFeeId);

  // Step 3: Validate balance
  const inputAmounts = inputs.map(i => toSmallestUnits(i.amount, baseFeeId));
  const outputAmounts = outputs.map(o => toSmallestUnits(o.amount, baseFeeId));
  validateAmountBalance(inputAmounts, outputAmounts);

  // Step 4: Validate fee percentages
  const totalFeePercent = inputTransfers.reduce((sum, t) => new Decimal(sum).add(t.feePercent).toNumber(), 0);
  if (totalFeePercent !== 100000000) {
    throw new Error(`Fee percentages must sum to exactly 100% (100,000,000). Current sum: ${totalFeePercent}`);
  }

  // Step 5: Calculate automatic fees if needed
  let calculatedBaseFee = null;
  let calculatedContractFee = null;
  let feeCalculationInfo = null;
  
  if (shouldUseAutoBaseFee || shouldUseAutoContractFee) {
    // Create a temporary transaction without fees for size calculation
    const tempTxnBase = createBaseTransaction(baseFeeId, '0', baseMemo); // Use 0 fee temporarily
    const tempCoinTxnData = {
      base: tempTxnBase,
      contractId,
      auth: createTransferAuth(publicKeys, [], nonces), // Empty signatures initially
      inputTransfers,
      outputTransfers
    };

    if (contractFee !== undefined) {
      tempCoinTxnData.contractFeeAmount = toSmallestUnits(contractFee, contractFeeId);
      tempCoinTxnData.contractFeeId = contractFeeId;
    }

    const tempCoinTxn = create(CoinTXN, tempCoinTxnData);

    // Use UniversalFeeCalculator with the protobuf object
    try {
      const feeResult = await UniversalFeeCalculator.calculateNetworkFee({
        protoObject: tempCoinTxn,
        baseFeeId
      });
      
      if (shouldUseAutoBaseFee) {
        calculatedBaseFee = feeResult.fee;
      }
      
      feeCalculationInfo = {
        size: feeResult.size,
        feeBreakdown: feeResult.breakdown,
        autoCalculated: true
      };
    } catch (error) {
      throw new Error(`Failed to calculate automatic fee: ${error.message}`);
    }
  }
  
  // Use calculated fees or provided fees
  const finalBaseFee = calculatedBaseFee || baseFee;
  const finalContractFee = calculatedContractFee || contractFee;
  
  // Validate base fee is not 0
  if (!finalBaseFee || finalBaseFee === '0' || finalBaseFee === 0) {
    throw new Error('Base fee must be provided and cannot be 0');
  }

  // Step 6: Create final base transaction with correct fees
  const txnBase = createBaseTransaction(baseFeeId, finalBaseFee, baseMemo);

  // Step 7: Create initial transaction (without signatures)
  const coinTxnData = {
    base: txnBase,
    contractId,
    auth: createTransferAuth(publicKeys, [], nonces), // Empty signatures initially
    inputTransfers,
    outputTransfers
  };

  if (finalContractFee !== undefined) {
    coinTxnData.contractFeeAmount = toSmallestUnits(finalContractFee, contractFeeId);
    coinTxnData.contractFeeId = contractFeeId;
  }

  let coinTxn = create(CoinTXN, coinTxnData);

  // Step 8: Sign transaction
  const signatures = [];
  const serializedTxn = toBinary(CoinTXN, coinTxn);
  
  for (let i = 0; i < inputs.length; i++) {
    try {
      const signature = signTransactionData(serializedTxn, inputs[i].privateKey, inputs[i].publicKey);
      signatures.push(signature);
    } catch (error) {
      throw new Error(`Failed to sign transaction with input ${i}: ${error.message}`);
    }
  }

  // Step 9: Create final transaction with signatures
  const finalAuth = createTransferAuth(publicKeys, signatures, nonces);
  const finalCoinTxnData = {
    ...coinTxnData,
    auth: finalAuth
  };

  coinTxn = create(CoinTXN, finalCoinTxnData);

  // Step 10: Add transaction hash
  const finalSerializedTxn = toBinary(CoinTXN, coinTxn);
  const hash = createTransactionHash(finalSerializedTxn);

  const finalBaseData = {
    ...txnBase,
    hash
  };

  const finalTxnBase = create(BaseTXN, finalBaseData);
  const finalTransactionData = {
    ...finalCoinTxnData,
    base: finalTxnBase
  };

  const finalTransaction = create(CoinTXN, finalTransactionData);

  // Return result with transaction and fee information
  return {
    transaction: finalTransaction,
    feeInfo: {
      baseFee: finalBaseFee,
      baseFeeId,
      contractFee: finalContractFee,
      contractFeeId: contractFeeId || contractId,
      autoCalculated: shouldUseAutoBaseFee || shouldUseAutoContractFee,
      calculationInfo: feeCalculationInfo
    }
  };
}

/**
 * Send a CoinTXN via gRPC using Connect client
 * @param {object} coinTxnInput - CoinTXN protobuf message or plain object
 * @param {object} [grpcConfig]
 * @param {string} [grpcConfig.endpoint] - 'http://host:50052' or 'host:50052'
 * @param {string} [grpcConfig.host='routing.zeravision.ca']
 * @param {number} [grpcConfig.port=50052]
 * @param {('http'|'https')} [grpcConfig.protocol='http']
 * @param {object} [grpcConfig.nodeOptions]
 * @returns {Promise<void>}
 */
export async function sendCoinTXN(coinTxnInput, grpcConfig = {}) {
  // Parse GRPC_ADDR environment variable if available
  const grpcAddr = process.env.GRPC_ADDR;
  let defaultHost = 'routing.zeravision.ca';
  let defaultPort = 50052;
  
  if (grpcAddr) {
    const [hostPart, portPart] = grpcAddr.split(':');
    if (hostPart) defaultHost = hostPart;
    if (portPart) defaultPort = parseInt(portPart, 10);
  }
  
  const {
    endpoint,
    host = defaultHost,
    port = defaultPort,
    protocol = 'http',
    nodeOptions
  } = grpcConfig;

  const resolved = endpoint ?? `${host}:${port}`;
  const baseUrl = resolved.startsWith('http') ? resolved : `${protocol}://${resolved}`;

  const coinTxnMessage = coinTxnInput?.$typeName === 'zera_txn.CoinTXN'
    ? coinTxnInput
    : create(CoinTXN, coinTxnInput ?? {});

  const { createPromiseClient } = await import('@connectrpc/connect');
  const { createGrpcTransport } = await import('@connectrpc/connect-node');
  const transport = createGrpcTransport({ baseUrl, nodeOptions });
  const client = createPromiseClient(TXNService, transport);
  await client.coin(coinTxnMessage);
}


