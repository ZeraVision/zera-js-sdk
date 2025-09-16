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
import { TXNService } from '../../proto/generated/txn_pb.js';
import {
  toSmallestUnits,
  validateAmountBalance,
  Decimal
} from '../shared/utils/amount-utils.js';
import { getPublicKeyBytes } from '../shared/crypto/address-utils.js';
import { signTransactionData, createTransactionHash } from '../shared/crypto/signature-utils.js';
import { getNonces, nonceToBigInt } from '../shared/utils/nonce-manager.js';
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
  
  // Extract addresses for nonce requests
  for (const input of inputs) {
    const address = getPublicKeyBytes(input.publicKey);
    addresses.push(bs58.encode(address));
  }
  
  // Get nonces for all inputs (as Decimals)
  const nonceDecimals = await getNonces(addresses, contractId);
  
  // Process each input
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    
    // Extract public key bytes
    const publicKeyBytes = getPublicKeyBytes(input.publicKey);
    publicKeys.push(create(PublicKey, { single: publicKeyBytes }));
    
    // Create input transfer
    const finalAmount = toSmallestUnits(input.amount, baseFeeId);
    const feePercent = input.feePercent !== undefined ? input.feePercent : '100';
    const scaledFeePercent = new Decimal(feePercent).mul(1000000).toNumber();
    
    inputTransfers.push(create(InputTransfers, {
      index: BigInt(i),
      amount: finalAmount,
      feePercent: scaledFeePercent
    }));
  }
  
  // Convert Decimal nonces to bigint for protobuf
  const nonces = nonceDecimals.map(nonce => nonceToBigInt(nonce));
  
  return { publicKeys, inputTransfers, nonces };
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
function createTransferAuth(publicKeys, signatures, nonces) {
  return create(TransferAuthentication, {
    publicKey: publicKeys,
    signature: signatures,
    nonce: nonces
  });
}

/**
 * Create timestamp for protobuf
 * @returns {Object} Timestamp object with seconds and nanos
 */
function createTimestamp() {
  const now = Date.now();
  const seconds = Math.floor(now / 1000);
  const nanos = (now % 1000) * 1000000; // Convert milliseconds to nanoseconds
  
  return {
    seconds: BigInt(seconds),
    nanos: nanos
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
 * @property {string} baseFeeId - Base fee instrument (e.g., '$ZRA+0000')
 * @property {string} [contractFeeId] - Contract fee instrument (defaults to baseFeeId)
 * @property {Decimal|string|number} baseFee - Base fee amount in user-friendly units (will be converted to smallest units) - required, cannot be 0
 * @property {Decimal|string|number} [contractFee] - Contract fee amount in user-friendly units (will be converted to smallest units)
 */

/**
 * Create a CoinTXN with inputs and outputs using exact decimal arithmetic
 * @param {Array} inputs - Array of input objects {privateKey: string, publicKey: string, amount: Decimal|string|number, feePercent?: string, keyType?: string}
 * @param {Array} outputs - Array of output objects {to: string, amount: Decimal|string|number, memo?: string}
 * @param {string} contractId - Contract ID (e.g., '$ZRA+0000') - must follow format $[letters]+[4 digits]
 * @param {FeeConfig} feeConfig - Fee configuration object with the following properties:
 *   - baseFeeId (string, optional): The fee instrument ID (defaults to '$ZRA+0000')
 *   - contractFeeId (string, optional): Contract fee instrument, defaults to contractId if not provided
 *   - baseFee (Decimal|string|number, required): Base fee amount in user-friendly units (converted to smallest units) - cannot be 0
 *   - contractFee (Decimal|string|number, optional): Contract fee amount in user-friendly units (converted to smallest units)
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
    contractFeeId = contractId,
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

  // Step 5: Create base transaction
  const txnBase = createBaseTransaction(baseFeeId, baseFee, baseMemo);

  // Step 6: Create initial transaction (without signatures)
  const coinTxnData = {
    base: txnBase,
    contractId,
    auth: createTransferAuth(publicKeys, [], nonces), // Empty signatures initially
    inputTransfers,
    outputTransfers
  };

  if (contractFee !== undefined) {
    coinTxnData.contractFeeAmount = toSmallestUnits(contractFee, contractFeeId);
    coinTxnData.contractFeeId = contractFeeId;
  }

  let coinTxn = create(CoinTXN, coinTxnData);

  // Step 7: Sign transaction
  const signatures = [];
  const serializedTxn = coinTxn.toBinary();
  
  for (let i = 0; i < inputs.length; i++) {
    try {
      const signature = signTransactionData(serializedTxn, inputs[i].privateKey, inputs[i].publicKey);
      signatures.push(signature);
    } catch (error) {
      throw new Error(`Failed to sign transaction with input ${i}: ${error.message}`);
    }
  }

  // Step 8: Create final transaction with signatures
  const finalAuth = createTransferAuth(publicKeys, signatures, nonces);
  const finalCoinTxnData = {
    ...coinTxnData,
    auth: finalAuth
  };

  coinTxn = create(CoinTXN, finalCoinTxnData);

  // Step 9: Add transaction hash
  const finalSerializedTxn = coinTxn.toBinary();
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
  const {
    endpoint,
    host = 'routing.zeravision.ca',
    port = 50052,
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


