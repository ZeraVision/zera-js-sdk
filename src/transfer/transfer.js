/**
 * Transfer Module - Go-like Protobuf Integration
 * Uses actual generated protobuf classes for structured data access
 */

// Import the actual generated protobuf classes
import {
  TransferSchema as Transfer, 
  CoinTXNSchema as CoinTXN, 
  InputTransfersSchema as InputTransfers, 
  OutputTransfersSchema as OutputTransfers
} from '../../proto/generated/txn_pb.js';
import { create, toBinary, fromBinary, toJson } from '@bufbuild/protobuf';
import { 
  toAmountString, 
  toSmallestUnits, 
  fromSmallestUnits,
  validateAmountBalance,
  addAmounts,
  areAmountsEqual,
  Decimal
} from '../shared/amount-utils.js';
import { getTokenDecimals } from '../shared/token-config.js';

/**
 * Create Transfer protobuf messages with exact decimal arithmetic
 * 
 * @param {string|Array} from - Single sender or array of senders
 * @param {string|Array} to - Single receiver or array of receivers  
 * @param {Decimal|string|number|Array} amount - Single amount or array of amounts (user-friendly format like "1.5")
 * @param {Object} feeConfig - Fee configuration object
 * @param {string} feeConfig.baseFeeId - Base fee instrument (required, e.g., '$ZRA+0000')
 * @param {string} [feeConfig.contractFeeId] - Contract fee instrument (optional, defaults to baseFeeId)
 * @param {string} [feeConfig.baseFee] - Base fee amount (optional)
 * @param {string} [feeConfig.contractFee] - Contract fee amount (optional)
 * @param {string|Array} transferMemo - Transfer-specific memo or array of memos (optional)
 * @returns {proto.zera_txn.Transfer|Array} Single protobuf message instance or array of protobuf message instances
 */
export function transfer(from, to, amount, feeConfig = { baseFeeId: '$ZRA+0000' }, transferMemo = '') {
  // Extract fee configuration with defaults
  const {
    baseFeeId = '$ZRA+0000',
    contractFeeId = baseFeeId,
    baseFee,
    contractFee
  } = feeConfig;
  
  // Handle single transfer (1-1)
  if (typeof from === 'string' && typeof to === 'string') {
    const finalAmount = toSmallestUnits(amount, baseFeeId);
    const transferData = {
      recipientAddress: new Uint8Array(Buffer.from(to, 'utf8')), // Convert string to bytes
      amount: finalAmount,
      contractId: baseFeeId,
      baseFeeId: baseFeeId
    };
    
    // Add optional fee amounts if provided
    if (contractFeeId !== baseFeeId) {
      transferData.contractFeeId = contractFeeId;
    }
    if (contractFee !== undefined) {
      transferData.contractFeeAmount = contractFee;
    }
    if (baseFee !== undefined) {
      transferData.baseFeeAmount = baseFee;
    }
    if (transferMemo && transferMemo.toString().trim() !== '') {
      transferData.memo = transferMemo.toString();
    }
    
    return create(Transfer, transferData);
  }
  
  // Handle array transfers
  if (Array.isArray(from) && Array.isArray(to) && Array.isArray(amount)) {
    return from.map((f, i) => {
      const finalAmount = toSmallestUnits(amount[i], baseFeeId);
      const transferData = {
        recipientAddress: new Uint8Array(Buffer.from(to[i], 'utf8')),
        amount: finalAmount,
        contractId: baseFeeId,
        baseFeeId: baseFeeId
      };
      
      // Add optional fee amounts if provided
      if (contractFeeId !== baseFeeId) {
        transferData.contractFeeId = contractFeeId;
      }
      if (contractFee !== undefined) {
        transferData.contractFeeAmount = contractFee;
      }
      if (baseFee !== undefined) {
        transferData.baseFeeAmount = baseFee;
      }
      
      const memo = Array.isArray(transferMemo) ? (transferMemo[i] || '') : transferMemo.toString();
      if (memo && memo.trim() !== '') {
        transferData.memo = memo;
      }
      
      return create(Transfer, transferData);
    });
  }
  
  // Handle 1-M pattern (one sender, multiple receivers)
  if (typeof from === 'string' && Array.isArray(to) && Array.isArray(amount)) {
    return to.map((t, i) => {
      const finalAmount = toSmallestUnits(amount[i], baseFeeId);
      const transferData = {
        recipientAddress: new Uint8Array(Buffer.from(t, 'utf8')),
        amount: finalAmount,
        contractId: baseFeeId,
        baseFeeId: baseFeeId
      };
      
      // Add optional fee amounts if provided
      if (contractFeeId !== baseFeeId) {
        transferData.contractFeeId = contractFeeId;
      }
      if (contractFee !== undefined) {
        transferData.contractFeeAmount = contractFee;
      }
      if (baseFee !== undefined) {
        transferData.baseFeeAmount = baseFee;
      }
      
      const memo = Array.isArray(transferMemo) ? (transferMemo[i] || '') : transferMemo.toString();
      if (memo && memo.trim() !== '') {
        transferData.memo = memo;
      }
      
      return create(Transfer, transferData);
    });
  }
  
  throw new Error('Invalid transfer parameters');
}


/**
 * Create a CoinTXN with inputs and outputs using exact decimal arithmetic
 * This allows for complex transactions like: Alice(1.5) + Bob(2.25) -> Charlie(2.0) + David(1.75)
 * 
 * @param {Array} inputs - Array of input objects {from: string, amount: Decimal|string|number, feePercent?: string}
 * @param {Array} outputs - Array of output objects {to: string, amount: Decimal|string|number, memo?: string}
 * @param {Object} feeConfig - Fee configuration object
 * @param {string} feeConfig.baseFeeId - Base fee instrument (required, e.g., '$ZRA+0000')
 * @param {string} [feeConfig.contractFeeId] - Contract fee instrument (optional, defaults to baseFeeId)
 * @param {string} [feeConfig.contractFee] - Contract fee amount (optional)
 * @param {string} [baseMemo] - Base memo for the transaction (optional)
 * @returns {proto.zera_txn.CoinTXN} Complete CoinTXN protobuf message
 */
export function createCoinTXN(inputs, outputs, feeConfig = { baseFeeId: '$ZRA+0000' }, baseMemo = '') {
  if (!Array.isArray(inputs) || !Array.isArray(outputs)) {
    throw new Error('Inputs and outputs must be arrays');
  }
  
  if (inputs.length === 0 || outputs.length === 0) {
    throw new Error('Must have at least one input and one output');
  }
  
  // Extract fee configuration with defaults
  const {
    baseFeeId = '$ZRA+0000',
    contractFeeId = baseFeeId,
    contractFee
  } = feeConfig;
  
  // Validate input/output balance (convert to smallest units)
  const inputAmounts = inputs.map(input => input.amount);
  const outputAmounts = outputs.map(output => output.amount);
  
  const inputAmountsInSmallestUnits = inputAmounts.map(inputAmount => 
    toSmallestUnits(inputAmount, baseFeeId)
  );
  const outputAmountsInSmallestUnits = outputAmounts.map(outputAmount => 
    toSmallestUnits(outputAmount, baseFeeId)
  );
  validateAmountBalance(inputAmountsInSmallestUnits, outputAmountsInSmallestUnits);
  
  // Create input transfers and validate fee percentages
  const inputTransfers = inputs.map((input, index) => {
    const finalAmount = toSmallestUnits(input.amount, baseFeeId);
    const feePercent = input.feePercent !== undefined ? input.feePercent : '100';
    
    // Scale fee percent using decimal.js for exact arithmetic: 0-100 -> 0-100000000
    const feePercentDecimal = new Decimal(feePercent);
    const scaledFeePercent = feePercentDecimal.mul(1000000).toNumber();
    
    return create(InputTransfers, {
      walletAddress: new Uint8Array(Buffer.from(input.from, 'utf8')),
      index: index,
      amount: finalAmount,
      feePercent: scaledFeePercent
    });
  });
  
  // Validate that fee percentages sum to exactly 100% (100,000,000) using decimal.js
  const totalFeePercent = inputTransfers.reduce((sum, transfer) => {
    return new Decimal(sum).add(transfer.feePercent).toNumber();
  }, 0);
  
  if (totalFeePercent !== 100000000) {
    throw new Error(`Fee percentages must sum to exactly 100% (100,000,000). Current sum: ${totalFeePercent}`);
  }
  
  // Create output transfers
  const outputTransfers = outputs.map((output, index) => {
    const finalAmount = toSmallestUnits(output.amount, baseFeeId);
    const outputData = {
      walletAddress: new Uint8Array(Buffer.from(output.to, 'utf8')),
      amount: finalAmount
    };
    
    // Only add memo if it's not empty
    if (output.memo && output.memo.trim() !== '') {
      outputData.memo = output.memo;
    }
    
    return create(OutputTransfers, outputData);
  });
  
  // Create the main CoinTXN structure
  const coinTxnData = {
    contractId: baseFeeId,
    contractFeeId: contractFeeId,
    inputTransfers: inputTransfers,
    outputTransfers: outputTransfers
  };
  
  // Add fee amounts if provided
  if (contractFee !== undefined) {
    coinTxnData.contractFeeAmount = contractFee;
  }
  
  const coinTxn = create(CoinTXN, coinTxnData);
  
  return coinTxn;
}