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

/**
 * Create Transfer protobuf messages - Go-like structured data approach
 * 
 * @param {string|Array} from - Single sender or array of senders
 * @param {string|Array} to - Single receiver or array of receivers  
 * @param {number|Array} amount - Single amount or array of amounts
 * @param {string} feeId - Fee instrument (e.g., '$ZRA+0000', '$ABZ+0123') - defaults to '$ZRA+0000'
 * @param {string} baseMemo - Base memo for the transaction (optional)
 * @param {string|Array} transferMemo - Transfer-specific memo or array of memos (optional)
 * @returns {proto.zera_txn.Transfer|Array} Single protobuf message instance or array of protobuf message instances
 */
export function transfer(from, to, amount, feeId = '$ZRA+0000', baseMemo = '', transferMemo = '') {
  // Handle single transfer (1-1)
  if (typeof from === 'string' && typeof to === 'string' && typeof amount === 'number') {
    return create(Transfer, {
      recipientAddress: new Uint8Array(Buffer.from(to, 'utf8')), // Convert string to bytes
      amount: amount.toString(),
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
    return from.map((f, i) => create(Transfer, {
      recipientAddress: new Uint8Array(Buffer.from(to[i], 'utf8')),
      amount: amount[i].toString(),
      contractId: feeId,
      contractFeeAmount: '100',
      contractFeeId: feeId,
      baseFeeAmount: '1000000',
      baseFeeId: feeId,
      memo: Array.isArray(transferMemo) ? (transferMemo[i] || '') : transferMemo.toString()
    }));
  }
  
  // Handle 1-M pattern (one sender, multiple receivers)
  if (typeof from === 'string' && Array.isArray(to) && Array.isArray(amount)) {
    return to.map((t, i) => create(Transfer, {
      recipientAddress: new Uint8Array(Buffer.from(t, 'utf8')),
      amount: amount[i].toString(),
      contractId: feeId,
      contractFeeAmount: '100',
      contractFeeId: feeId,
      baseFeeAmount: '1000000',
      baseFeeId: feeId,
      memo: Array.isArray(transferMemo) ? (transferMemo[i] || '') : transferMemo.toString()
    }));
  }
  
  throw new Error('Invalid transfer parameters');
}

/**
 * Create a complete CoinTXN with Transfer messages - Go-like approach
 * This creates the full transaction structure that matches the protobuf schema
 */
export function createCoinTXN(from, to, amount, feeId = '$ZRA+0000', baseMemo = '', transferMemo = '') {
  const transfers = transfer(from, to, amount, feeId, baseMemo, transferMemo);
  const transferArray = Array.isArray(transfers) ? transfers : [transfers];
  
  // Create input transfers (from the sender)
  const inputTransfers = transferArray.map((_, index) => 
    create(InputTransfers, {
      index: index,
      amount: Array.isArray(amount) ? amount[index].toString() : amount.toString(),
      feePercent: 100000000 // 100%
    })
  );
  
  // Create output transfers (to the recipients)
  const outputTransfers = transferArray.map((transfer, index) => 
    create(OutputTransfers, {
      walletAddress: transfer.recipientAddress,
      amount: transfer.amount,
      memo: Array.isArray(transferMemo) ? (transferMemo[index] || '') : transferMemo.toString()
    })
  );
  
  // Create the main CoinTXN structure
  const coinTxn = create(CoinTXN, {
    contractId: feeId,
    contractFeeId: feeId,
    contractFeeAmount: '100',
    inputTransfers: inputTransfers,
    outputTransfers: outputTransfers
  });
  
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
