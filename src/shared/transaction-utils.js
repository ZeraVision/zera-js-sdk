/**
 * Shared Transaction Utilities for ZERA JS SDK
 * Common utilities for transaction operations (transfer, mint, etc.)
 */

// Import protobuf enums directly
import { 
  TRANSACTION_TYPE, 
  CONTRACT_FEE_TYPE,
  TXN_STATUS,
  GOVERNANCE_TYPE,
  CONTRACT_TYPE,
  LANGUAGE,
  PROPOSAL_PERIOD,
  VARIABLE_TYPE
} from './protobuf-enums.js';

// Re-export for external use
export { 
  TRANSACTION_TYPE, 
  CONTRACT_FEE_TYPE,
  TXN_STATUS,
  GOVERNANCE_TYPE,
  CONTRACT_TYPE,
  LANGUAGE,
  PROPOSAL_PERIOD,
  VARIABLE_TYPE
};

/**
 * Transaction validation utilities
 */
export class TransactionValidator {
  /**
   * Validate transaction amount
   * @param {number|string} amount - Transaction amount
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  static validateAmount(amount, options = {}) {
    const { minAmount = 0, maxAmount = Number.MAX_SAFE_INTEGER, decimals = 18 } = options;
    
    // Convert to number if string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      return { valid: false, error: 'Amount must be a valid number' };
    }
    
    if (numAmount <= 0) {
      return { valid: false, error: 'Amount must be greater than zero' };
    }
    
    if (numAmount < minAmount) {
      return { valid: false, error: `Amount must be at least ${minAmount}` };
    }
    
    if (numAmount > maxAmount) {
      return { valid: false, error: `Amount must not exceed ${maxAmount}` };
    }
    
    // Check decimal precision
    const decimalPlaces = (numAmount.toString().split('.')[1] || '').length;
    if (decimalPlaces > decimals) {
      return { valid: false, error: `Amount cannot have more than ${decimals} decimal places` };
    }
    
    return { valid: true, amount: numAmount };
  }

  /**
   * Validate wallet address format
   * @param {string} address - Wallet address
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  static validateAddress(address, options = {}) {
    const { required = true, format = 'zera' } = options;
    
    if (!address && !required) {
      return { valid: true };
    }
    
    if (!address) {
      return { valid: false, error: 'Address is required' };
    }
    
    if (typeof address !== 'string') {
      return { valid: false, error: 'Address must be a string' };
    }
    
    // Basic format validation
    if (format === 'zera') {
      // ZERA address format validation (adjust based on actual format)
      if (!address.startsWith('zera') || address.length < 20) {
        return { valid: false, error: 'Invalid ZERA address format' };
      }
    }
    
    return { valid: true, address: address.trim() };
  }

  /**
   * Validate transaction memo/note
   * @param {string} memo - Transaction memo
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  static validateMemo(memo, options = {}) {
    const { maxLength = 256, allowEmpty = true } = options;
    
    if (!memo && allowEmpty) {
      return { valid: true };
    }
    
    if (!memo && !allowEmpty) {
      return { valid: false, error: 'Memo is required' };
    }
    
    if (typeof memo !== 'string') {
      return { valid: false, error: 'Memo must be a string' };
    }
    
    if (memo.length > maxLength) {
      return { valid: false, error: `Memo cannot exceed ${maxLength} characters` };
    }
    
    return { valid: true, memo: memo.trim() };
  }

  /**
   * Validate transaction fee
   * @param {number|string} fee - Transaction fee
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  static validateFee(fee, options = {}) {
    const { minFee = 0, maxFee = Number.MAX_SAFE_INTEGER, decimals = 18 } = options;
    
    const numFee = typeof fee === 'string' ? parseFloat(fee) : fee;
    
    if (isNaN(numFee)) {
      return { valid: false, error: 'Fee must be a valid number' };
    }
    
    if (numFee < minFee) {
      return { valid: false, error: `Fee must be at least ${minFee}` };
    }
    
    if (numFee > maxFee) {
      return { valid: false, error: `Fee must not exceed ${maxFee}` };
    }
    
    return { valid: true, fee: numFee };
  }
}

/**
 * Transaction formatting utilities
 */
export class TransactionFormatter {
  /**
   * Format amount with proper decimal places
   * @param {number|string} amount - Amount to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted amount
   */
  static formatAmount(amount, options = {}) {
    const { decimals = 18, showSymbol = false, symbol = 'ZERA' } = options;
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      return '0';
    }
    
    const formatted = numAmount.toFixed(decimals).replace(/\.?0+$/, '');
    return showSymbol ? `${formatted} ${symbol}` : formatted;
  }

  /**
   * Format transaction ID for display
   * @param {string} txId - Transaction ID
   * @param {Object} options - Formatting options
   * @returns {string} Formatted transaction ID
   */
  static formatTransactionId(txId, options = {}) {
    const { showFull = false, prefixLength = 8, suffixLength = 8 } = options;
    
    if (!txId || typeof txId !== 'string') {
      return 'Unknown';
    }
    
    if (showFull || txId.length <= prefixLength + suffixLength) {
      return txId;
    }
    
    return `${txId.substring(0, prefixLength)}...${txId.substring(txId.length - suffixLength)}`;
  }

  /**
   * Format timestamp for display
   * @param {number|Date} timestamp - Timestamp to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted timestamp
   */
  static formatTimestamp(timestamp, options = {}) {
    const { format = 'relative', locale = 'en-US' } = options;
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    switch (format) {
      case 'relative':
        return this.getRelativeTime(date);
      case 'iso':
        return date.toISOString();
      case 'local':
        return date.toLocaleString(locale);
      default:
        return date.toString();
    }
  }

  /**
   * Get relative time string
   * @param {Date} date - Date to compare
   * @returns {string} Relative time string
   */
  static getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

/**
 * Transaction fee calculation utilities
 */
export class FeeCalculator {
  /**
   * Calculate transaction fee
   * @param {Object} params - Fee calculation parameters
   * @param {number} params.amount - Transaction amount
   * @param {string} params.feeType - Fee type (fixed, percentage, dynamic)
   * @param {number} params.feeValue - Fee value
   * @param {Object} params.options - Additional options
   * @returns {Object} Fee calculation result
   */
  static calculateFee(params, options = {}) {
    const { amount, feeType, feeValue } = params;
    const { minFee = 0, maxFee = Number.MAX_SAFE_INTEGER } = options;
    
    let calculatedFee = 0;
    
    switch (feeType) {
      case FEE_TYPE.FIXED:
        calculatedFee = feeValue;
        break;
      case FEE_TYPE.PERCENTAGE:
        calculatedFee = (amount * feeValue) / 100;
        break;
      case FEE_TYPE.DYNAMIC:
        // Dynamic fee calculation based on network conditions
        calculatedFee = this.calculateDynamicFee(params, options);
        break;
      default:
        throw new Error(`Unsupported fee type: ${feeType}`);
    }
    
    // Apply min/max constraints
    calculatedFee = Math.max(minFee, Math.min(maxFee, calculatedFee));
    
    return {
      fee: calculatedFee,
      feeType,
      feeValue,
      totalAmount: amount + calculatedFee
    };
  }

  /**
   * Calculate dynamic fee based on network conditions
   * @param {Object} params - Fee calculation parameters
   * @param {Object} options - Additional options
   * @returns {number} Calculated dynamic fee
   */
  static calculateDynamicFee(params, options = {}) {
    const { amount, networkCongestion = 1.0, baseFee = 0.001 } = options;
    
    // Simple dynamic fee calculation
    // In a real implementation, this would consider network congestion, gas prices, etc.
    return baseFee * networkCongestion * Math.log(amount + 1);
  }
}

/**
 * Transaction builder utilities
 */
export class TransactionBuilder {
  /**
   * Build base transaction object
   * @param {Object} params - Transaction parameters
   * @returns {Object} Base transaction object
   */
  static buildBaseTransaction(params) {
    const {
      from,
      to,
      amount,
      memo = '',
      fee = 0,
      type = TRANSACTION_TYPE.TRANSFER
    } = params;
    
    return {
      id: this.generateTransactionId(),
      type,
      from,
      to,
      amount,
      memo,
      fee,
      status: TRANSACTION_STATUS.PENDING,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Generate unique transaction ID
   * @returns {string} Transaction ID
   */
  static generateTransactionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `tx_${timestamp}_${random}`;
  }

  /**
   * Add signature to transaction
   * @param {Object} transaction - Transaction object
   * @param {string} signature - Transaction signature
   * @returns {Object} Transaction with signature
   */
  static addSignature(transaction, signature) {
    return {
      ...transaction,
      signature,
      signedAt: new Date().toISOString()
    };
  }

  /**
   * Update transaction status
   * @param {Object} transaction - Transaction object
   * @param {string} status - New status
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Updated transaction
   */
  static updateStatus(transaction, status, metadata = {}) {
    return {
      ...transaction,
      status,
      updatedAt: new Date().toISOString(),
      ...metadata
    };
  }
}

/**
 * Transaction serialization utilities
 */
export class TransactionSerializer {
  /**
   * Serialize transaction for network transmission
   * @param {Object} transaction - Transaction object
   * @param {Object} options - Serialization options
   * @returns {string} Serialized transaction
   */
  static serialize(transaction, options = {}) {
    const { format = 'json', includeSignature = true } = options;
    
    const serializable = { ...transaction };
    
    if (!includeSignature) {
      delete serializable.signature;
    }
    
    switch (format) {
      case 'json':
        return JSON.stringify(serializable);
      case 'base64':
        return Buffer.from(JSON.stringify(serializable)).toString('base64');
      default:
        throw new Error(`Unsupported serialization format: ${format}`);
    }
  }

  /**
   * Deserialize transaction from network data
   * @param {string} data - Serialized transaction data
   * @param {Object} options - Deserialization options
   * @returns {Object} Deserialized transaction
   */
  static deserialize(data, options = {}) {
    const { format = 'json' } = options;
    
    let parsed;
    
    switch (format) {
      case 'json':
        parsed = JSON.parse(data);
        break;
      case 'base64':
        parsed = JSON.parse(Buffer.from(data, 'base64').toString());
        break;
      default:
        throw new Error(`Unsupported deserialization format: ${format}`);
    }
    
    return parsed;
  }
}

// Export all utilities (classes are already exported above)

export default {
  TXN_STATUS,
  TRANSACTION_TYPE,
  CONTRACT_FEE_TYPE,
  TransactionValidator,
  TransactionFormatter,
  FeeCalculator,
  TransactionBuilder,
  TransactionSerializer
};
