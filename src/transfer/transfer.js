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
 * @param {string} feeId - Fee instrument (e.g., '$ZRA+0000', '$ABZ+0123') - defaults to '$ZRA+0000'
 * @param {string} baseMemo - Base memo for the transaction (optional)
 * @param {string|Array} transferMemo - Transfer-specific memo or array of memos (optional)
 * @returns {proto.zera_txn.Transfer|Array} Single protobuf message instance or array of protobuf message instances
 */
export function transfer(from, to, amount, feeId = '$ZRA+0000', baseMemo = '', transferMemo = '') {
  // Handle single transfer (1-1)
  if (typeof from === 'string' && typeof to === 'string') {
    const finalAmount = toSmallestUnits(amount, feeId);
    return create(Transfer, {
      recipientAddress: new Uint8Array(Buffer.from(to, 'utf8')), // Convert string to bytes
      amount: finalAmount,
      contractId: feeId,
      contractFeeAmount: '100', // Optional contract fee
      contractFeeId: feeId, // Optional contract fee ID
      baseFeeAmount: '1000000', // 0.001 in smallest units
      baseFeeId: feeId,
      memo: transferMemo.toString() // Transfer-specific memo
    });
  }
  
  // Handle array transfers
  if (Array.isArray(from) && Array.isArray(to) && Array.isArray(amount)) {
    return from.map((f, i) => {
      const finalAmount = toSmallestUnits(amount[i], feeId);
      return create(Transfer, {
        recipientAddress: new Uint8Array(Buffer.from(to[i], 'utf8')),
        amount: finalAmount,
        contractId: feeId,
        contractFeeAmount: '100',
        contractFeeId: feeId,
        baseFeeAmount: '1000000',
        baseFeeId: feeId,
        memo: Array.isArray(transferMemo) ? (transferMemo[i] || '') : transferMemo.toString()
      });
    });
  }
  
  // Handle 1-M pattern (one sender, multiple receivers)
  if (typeof from === 'string' && Array.isArray(to) && Array.isArray(amount)) {
    return to.map((t, i) => {
      const finalAmount = toSmallestUnits(amount[i], feeId);
      return create(Transfer, {
        recipientAddress: new Uint8Array(Buffer.from(t, 'utf8')),
        amount: finalAmount,
        contractId: feeId,
        contractFeeAmount: '100',
        contractFeeId: feeId,
        baseFeeAmount: '1000000',
        baseFeeId: feeId,
        memo: Array.isArray(transferMemo) ? (transferMemo[i] || '') : transferMemo.toString()
      });
    });
  }
  
  throw new Error('Invalid transfer parameters');
}

/**
 * Create a complete CoinTXN with Transfer messages using exact decimal arithmetic
 * 
 * @param {string|Array} from - Single sender or array of senders
 * @param {string|Array} to - Single receiver or array of receivers  
 * @param {Decimal|string|number|Array} amount - Single amount or array of amounts (user-friendly format like "1.5")
 * @param {string} feeId - Fee instrument (e.g., '$ZRA+0000', '$ABZ+0123')
 * @param {string} baseMemo - Base memo for the transaction (optional)
 * @param {string|Array} transferMemo - Transfer-specific memo or array of memos (optional)
 * @param {string|Array} feePercent - Fee percentage for each input (0-100, scaled to 100000000 for 100%, nil if 0)
 * @param {string|undefined} feeAmount - Contract fee amount (optional, nil if not supplied)
 * @returns {proto.zera_txn.CoinTXN} Complete CoinTXN protobuf message
 */
export function createCoinTXN(from, to, amount, feeId = '$ZRA+0000', baseMemo = '', transferMemo = '', feePercent = '100', feeAmount = undefined) {
  const transfers = transfer(from, to, amount, feeId, baseMemo, transferMemo);
  const transferArray = Array.isArray(transfers) ? transfers : [transfers];
  
  // Prepare amounts for validation (convert to smallest units)
  const inputAmounts = Array.isArray(amount) ? amount : [amount];
  const outputAmounts = transferArray.map(t => t.amount);
  
  // Convert input amounts to smallest units for validation
  const inputAmountsInSmallestUnits = inputAmounts.map(inputAmount => 
    toSmallestUnits(inputAmount, feeId)
  );
  validateAmountBalance(inputAmountsInSmallestUnits, outputAmounts);
  
  // Prepare fee percentages
  const feePercentages = Array.isArray(feePercent) ? feePercent : [feePercent];
  
  // Create input transfers (from the sender)
  const inputTransfers = transferArray.map((_, index) => {
    const inputAmount = Array.isArray(amount) ? amount[index] : amount;
    const finalAmount = toSmallestUnits(inputAmount, feeId);
    const inputFeePercent = feePercentages[index] || feePercentages[0] || '100';
    
    // Scale fee percent using decimal.js for exact arithmetic: 0-100 -> 0-100000000
    const feePercentDecimal = new Decimal(inputFeePercent);
    const scaledFeePercent = feePercentDecimal.mul(1000000).toNumber();
    
    return create(InputTransfers, {
      index: index,
      amount: finalAmount,
      feePercent: scaledFeePercent
    });
  });
  
  // Create output transfers (to the recipients)
  const outputTransfers = transferArray.map((transfer, index) => {
    const memo = Array.isArray(transferMemo) ? (transferMemo[index] || '') : transferMemo.toString();
    const outputData = {
      walletAddress: transfer.recipientAddress,
      amount: transfer.amount
    };
    
    // Only add memo if it's not empty
    if (memo && memo.trim() !== '') {
      outputData.memo = memo;
    }
    
    return create(OutputTransfers, outputData);
  });
  
  // Create the main CoinTXN structure
  const coinTxnData = {
    contractId: feeId,
    contractFeeId: feeId,
    inputTransfers: inputTransfers,
    outputTransfers: outputTransfers
  };
  
  // Only add contractFeeAmount if it's provided
  if (feeAmount !== undefined) {
    coinTxnData.contractFeeAmount = feeAmount;
  }
  
  const coinTxn = create(CoinTXN, coinTxnData);
  
  return coinTxn;
}

/**
 * Create a CoinTXN with multiple inputs and outputs using exact decimal arithmetic
 * This allows for complex transactions like: Alice(1.5) + Bob(2.25) -> Charlie(2.0) + David(1.75)
 * 
 * @param {Array} inputs - Array of input objects {from: string, amount: Decimal|string|number, feePercent?: number}
 * @param {Array} outputs - Array of output objects {to: string, amount: Decimal|string|number, memo?: string}
 * @param {string} feeId - Fee instrument (e.g., '$ZRA+0000', '$ABZ+0123')
 * @param {string} baseMemo - Base memo for the transaction (optional)
 * @param {string|undefined} feeAmount - Contract fee amount (optional, nil if not supplied)
 * @returns {proto.zera_txn.CoinTXN} Complete CoinTXN protobuf message
 */
export function createMultiInputOutputCoinTXN(inputs, outputs, feeId = '$ZRA+0000', baseMemo = '', feeAmount = undefined) {
  if (!Array.isArray(inputs) || !Array.isArray(outputs)) {
    throw new Error('Inputs and outputs must be arrays');
  }
  
  if (inputs.length === 0 || outputs.length === 0) {
    throw new Error('Must have at least one input and one output');
  }
  
  // Validate input/output balance (convert to smallest units)
  const inputAmounts = inputs.map(input => input.amount);
  const outputAmounts = outputs.map(output => output.amount);
  
  const inputAmountsInSmallestUnits = inputAmounts.map(inputAmount => 
    toSmallestUnits(inputAmount, feeId)
  );
  const outputAmountsInSmallestUnits = outputAmounts.map(outputAmount => 
    toSmallestUnits(outputAmount, feeId)
  );
  validateAmountBalance(inputAmountsInSmallestUnits, outputAmountsInSmallestUnits);
  
  // Create input transfers and validate fee percentages
  const inputTransfers = inputs.map((input, index) => {
    const finalAmount = toSmallestUnits(input.amount, feeId);
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
    const finalAmount = toSmallestUnits(output.amount, feeId);
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
    contractId: feeId,
    contractFeeId: feeId,
    inputTransfers: inputTransfers,
    outputTransfers: outputTransfers
  };
  
  // Only add contractFeeAmount if it's provided
  if (feeAmount !== undefined) {
    coinTxnData.contractFeeAmount = feeAmount;
  }
  
  const coinTxn = create(CoinTXN, coinTxnData);
  
  return coinTxn;
}

/**
 * Serialize transfer to binary - Go-like binary serialization
 */
export function serializeTransfer(transfer) {
  if (Array.isArray(transfer)) {
    return transfer.map(t => toBinary(Transfer, t));
  }
  return toBinary(Transfer, transfer);
}

/**
 * Deserialize binary data back to Transfer - Go-like deserialization
 */
export function deserializeTransfer(binaryData) {
  if (Array.isArray(binaryData)) {
    return binaryData.map(data => fromBinary(Transfer, data));
  }
  return fromBinary(Transfer, binaryData);
}
