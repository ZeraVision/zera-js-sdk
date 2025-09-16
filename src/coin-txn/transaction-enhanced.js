/**
 * Enhanced CoinTXN Creation with Automatic Fee Calculation
 * This version automatically calculates fees based on transaction size
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
import { UniversalFeeCalculator } from '../shared/fee-calculators/universal-fee-calculator.js';
import { TRANSACTION_TYPE } from '../shared/protobuf-enums.js';
import bs58 from 'bs58';

/**
 * Enhanced CoinTXN creation with automatic fee calculation
 * @param {Array} inputs - Array of input objects {privateKey: string, publicKey: string, amount: Decimal|string|number, feePercent?: string, keyType?: string}
 * @param {Array} outputs - Array of output objects {to: string, amount: Decimal|string|number, memo?: string}
 * @param {string} contractId - Contract ID (e.g., '$ZRA+0000') - must follow format $[letters]+[4 digits]
 * @param {Object} [feeConfig] - Fee configuration object
 * @param {string} [feeConfig.baseFeeId='$ZRA+0000'] - Base fee instrument ID
 * @param {string} [feeConfig.contractFeeId] - Contract fee instrument, defaults to contractId
 * @param {Decimal|string|number} [feeConfig.contractFee] - Contract fee amount (optional)
 * @param {boolean} [feeConfig.autoCalculateFee=true] - Whether to automatically calculate base fee based on size
 * @param {Decimal|string|number} [feeConfig.baseFee] - Manual base fee amount (used only if autoCalculateFee is false)
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
    contractFeeId = contractId,
    contractFee,
    autoCalculateFee = true,
    baseFee
  } = feeConfig;

  // Step 1: Calculate automatic fee if enabled
  let calculatedFee = null;
  let feeCalculationInfo = null;
  
  if (autoCalculateFee) {
    try {
      const feeResult = await UniversalFeeCalculator.calculateCoinTXNFee({
        inputs,
        outputs,
        contractId,
        baseFeeId,
        baseMemo,
        contractFeeId,
        contractFee,
        transactionType: TRANSACTION_TYPE.COIN_TYPE
      });
      
      calculatedFee = feeResult.fee;
      feeCalculationInfo = {
        size: feeResult.size,
        iterations: feeResult.iterations,
        converged: feeResult.converged,
        breakdown: feeResult.breakdown
      };
    } catch (error) {
      throw new Error(`Failed to calculate automatic fee: ${error.message}`);
    }
  } else if (!baseFee) {
    throw new Error('Either autoCalculateFee must be true or baseFee must be provided');
  }

  // Use calculated fee or provided fee
  const finalBaseFee = calculatedFee || baseFee;
  
  // Validate base fee is not 0
  if (!finalBaseFee || finalBaseFee === '0' || finalBaseFee === 0) {
    throw new Error('Base fee must be provided and cannot be 0');
  }

  // Step 2: Process inputs (includes nonce generation)
  const { publicKeys, inputTransfers, nonces } = await processInputs(inputs, baseFeeId, contractId);

  // Step 3: Process outputs
  const outputTransfers = processOutputs(outputs, baseFeeId);

  // Step 4: Validate balance
  const inputAmounts = inputs.map(i => toSmallestUnits(i.amount, baseFeeId));
  const outputAmounts = outputs.map(o => toSmallestUnits(o.amount, baseFeeId));
  validateAmountBalance(inputAmounts, outputAmounts);

  // Step 5: Validate fee percentages
  const totalFeePercent = inputTransfers.reduce((sum, t) => new Decimal(sum).add(t.feePercent).toNumber(), 0);
  if (totalFeePercent !== 100000000) {
    throw new Error(`Fee percentages must sum to exactly 100% (100,000,000). Current sum: ${totalFeePercent}`);
  }

  // Step 6: Create base transaction
  const txnBase = createBaseTransaction(baseFeeId, finalBaseFee, baseMemo);

  // Step 7: Create initial transaction (without signatures)
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

  // Step 8: Sign transaction
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

  // Step 9: Create final transaction with signatures
  const finalAuth = createTransferAuth(publicKeys, signatures, nonces);
  const finalCoinTxnData = {
    ...coinTxnData,
    auth: finalAuth
  };

  coinTxn = create(CoinTXN, finalCoinTxnData);

  // Step 10: Add transaction hash
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

  const finalTransaction = create(CoinTXN, finalTransactionData);

  // Return result with transaction and fee information
  return {
    transaction: finalTransaction,
    feeInfo: {
      baseFee: finalBaseFee,
      baseFeeId,
      contractFee: contractFee,
      contractFeeId: contractFeeId,
      autoCalculated: autoCalculateFee,
      calculationInfo: feeCalculationInfo
    }
  };
}

/**
 * Helper function to create base transaction (reused from original)
 * @param {string} baseFeeId - Base fee ID
 * @param {string} baseFee - Base fee amount
 * @param {string} baseMemo - Base memo
 * @returns {Object} Base transaction
 */
function createBaseTransaction(baseFeeId, baseFee, baseMemo) {
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
 * Helper function to create timestamp (reused from original)
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
 * Helper function to create transfer authentication (reused from original)
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
 * Helper function to process inputs (reused from original)
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
 * Helper function to process outputs (reused from original)
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
 * Helper function to validate contract ID (reused from original)
 * @param {string} contractId - Contract ID to validate
 * @returns {boolean} True if valid format
 */
function validateContractId(contractId) {
  if (!contractId || typeof contractId !== 'string') {
    return false;
  }
  
  // Regex: $ followed by one or more letters, then + followed by exactly 4 digits
  const contractIdRegex = /^\$[A-Za-z]+\+\d{4}$/;
  return contractIdRegex.test(contractId);
}
