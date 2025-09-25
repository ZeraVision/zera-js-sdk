/**
 * Protobuf Enums - ZERA Network Constants
 * 
 * This file contains all the protobuf enum values used throughout the ZERA Network.
 * These enums are generated from the protobuf definitions and provide type safety.
 */

/**
 * Transaction Type Enum
 * Defines the different types of transactions supported by the ZERA Network
 */
export const TRANSACTION_TYPE = {
  COIN_TXN: 0,           // Coin transaction
  CONTRACT_TXN: 1,        // Contract transaction
  GOVERNANCE_TXN: 2,      // Governance transaction
  VALIDATOR_TXN: 3,       // Validator transaction
  DELEGATION_TXN: 4,      // Delegation transaction
  UNDELEGATION_TXN: 5,    // Undelegation transaction
  REWARD_TXN: 6,          // Reward transaction
  SLASHING_TXN: 7,        // Slashing transaction
  UPGRADE_TXN: 8,         // Upgrade transaction
  CROSS_CHAIN_TXN: 9,     // Cross-chain transaction
  BRIDGE_TXN: 10,         // Bridge transaction
  NFT_TXN: 11,            // NFT transaction
  MULTI_SIG_TXN: 12,      // Multi-signature transaction
  TIMELOCK_TXN: 13,       // Timelock transaction
  CONDITIONAL_TXN: 14,    // Conditional transaction
  BATCH_TXN: 15           // Batch transaction
} as const;

/**
 * Contract Fee Type Enum
 * Defines the different types of contract fees
 */
export const CONTRACT_FEE_TYPE = {
  FIXED: 0,               // Fixed fee amount
  PERCENTAGE: 1,          // Percentage-based fee
  CUR_EQUIVALENT: 2,      // Currency equivalent fee (USD-based)
  NONE: 3,                // No fee
  DYNAMIC: 4,             // Dynamic fee based on network conditions
  TIERED: 5,              // Tiered fee structure
  VOLUME_BASED: 6,        // Volume-based fee
  TIME_BASED: 7,          // Time-based fee
  COMPLEXITY_BASED: 8,    // Complexity-based fee
  GAS_BASED: 9,           // Gas-based fee
  CUSTOM: 10              // Custom fee structure
} as const;

/**
 * Transaction Status Enum
 * Defines the different states a transaction can be in
 */
export const TXN_STATUS = {
  PENDING: 0,             // Transaction is pending
  CONFIRMED: 1,           // Transaction is confirmed
  FAILED: 2,              // Transaction failed
  REJECTED: 3,            // Transaction was rejected
  EXPIRED: 4,             // Transaction expired
  CANCELLED: 5,           // Transaction was cancelled
  PROCESSING: 6,          // Transaction is being processed
  QUEUED: 7,              // Transaction is queued
  VALIDATING: 8,          // Transaction is being validated
  EXECUTING: 9,           // Transaction is being executed
  COMPLETED: 10,          // Transaction completed successfully
  PARTIAL: 11,            // Transaction partially completed
  ROLLBACK: 12,           // Transaction was rolled back
  RETRY: 13,              // Transaction is being retried
  TIMEOUT: 14             // Transaction timed out
} as const;

/**
 * Governance Type Enum
 * Defines the different types of governance actions
 */
export const GOVERNANCE_TYPE = {
  PROPOSAL: 0,            // Governance proposal
  VOTE: 1,                // Vote on proposal
  DELEGATE: 2,            // Delegate voting power
  UNDELEGATE: 3,          // Undelegate voting power
  PARAMETER_CHANGE: 4,    // Parameter change proposal
  UPGRADE_PROPOSAL: 5,    // Upgrade proposal
  TEXT_PROPOSAL: 6,       // Text proposal
  COMMUNITY_POOL: 7,      // Community pool proposal
  EMERGENCY_PROPOSAL: 8,  // Emergency proposal
  CUSTOM_PROPOSAL: 9      // Custom proposal type
} as const;

/**
 * Contract Type Enum
 * Defines the different types of smart contracts
 */
export const CONTRACT_TYPE = {
  STANDARD: 0,            // Standard contract
  MULTI_SIG: 1,           // Multi-signature contract
  TIMELOCK: 2,            // Timelock contract
  ESCROW: 3,              // Escrow contract
  AUCTION: 4,             // Auction contract
  LOTTERY: 5,             // Lottery contract
  GAME: 6,                // Game contract
  NFT: 7,                 // NFT contract
  TOKEN: 8,               // Token contract
  EXCHANGE: 9,            // Exchange contract
  LENDING: 10,            // Lending contract
  STAKING: 11,            // Staking contract
  GOVERNANCE: 12,         // Governance contract
  BRIDGE: 13,             // Bridge contract
  ORACLE: 14,             // Oracle contract
  CUSTOM: 15              // Custom contract type
} as const;

/**
 * Language Enum
 * Defines the programming languages supported for smart contracts
 */
export const LANGUAGE = {
  SOLIDITY: 0,            // Solidity
  VYPER: 1,               // Vyper
  RUST: 2,                // Rust
  GO: 3,                  // Go
  JAVASCRIPT: 4,          // JavaScript
  TYPESCRIPT: 5,          // TypeScript
  PYTHON: 6,              // Python
  C_PLUS_PLUS: 7,         // C++
  C_SHARP: 8,             // C#
  JAVA: 9,                // Java
  KOTLIN: 10,             // Kotlin
  SWIFT: 11,              // Swift
  ASSEMBLY: 12,           // Assembly
  BYTECODE: 13,           // Bytecode
  WASM: 14,               // WebAssembly
  CUSTOM: 15              // Custom language
} as const;

/**
 * Proposal Period Enum
 * Defines the different periods for governance proposals
 */
export const PROPOSAL_PERIOD = {
  DEPOSIT: 0,             // Deposit period
  VOTING: 1,              // Voting period
  TALLYING: 2,            // Tallying period
  EXECUTION: 3,           // Execution period
  COMPLETED: 4,           // Completed
  FAILED: 5,              // Failed
  EXPIRED: 6,             // Expired
  CANCELLED: 7,           // Cancelled
  REJECTED: 8,            // Rejected
  PASSED: 9,              // Passed
  EXECUTED: 10,           // Executed
  PENDING: 11             // Pending
} as const;

/**
 * Variable Type Enum
 * Defines the different types of variables in smart contracts
 */
export const VARIABLE_TYPE = {
  UINT8: 0,               // 8-bit unsigned integer
  UINT16: 1,              // 16-bit unsigned integer
  UINT32: 2,              // 32-bit unsigned integer
  UINT64: 3,              // 64-bit unsigned integer
  UINT128: 4,             // 128-bit unsigned integer
  UINT256: 5,             // 256-bit unsigned integer
  INT8: 6,                // 8-bit signed integer
  INT16: 7,               // 16-bit signed integer
  INT32: 8,               // 32-bit signed integer
  INT64: 9,               // 64-bit signed integer
  INT128: 10,             // 128-bit signed integer
  INT256: 11,             // 256-bit signed integer
  BOOL: 12,               // Boolean
  STRING: 13,             // String
  BYTES: 14,              // Bytes
  ADDRESS: 15,            // Address
  ARRAY: 16,              // Array
  MAPPING: 17,            // Mapping
  STRUCT: 18,             // Struct
  ENUM: 19,               // Enum
  CUSTOM: 20              // Custom type
} as const;

/**
 * Combined Protobuf Enums Object
 * Contains all enum definitions for easy access
 */
export const PROTOBUF_ENUMS = {
  TRANSACTION_TYPE,
  CONTRACT_FEE_TYPE,
  TXN_STATUS,
  GOVERNANCE_TYPE,
  CONTRACT_TYPE,
  LANGUAGE,
  PROPOSAL_PERIOD,
  VARIABLE_TYPE
} as const;

// Type definitions for better TypeScript support
export type TransactionType = typeof TRANSACTION_TYPE[keyof typeof TRANSACTION_TYPE];
export type ContractFeeType = typeof CONTRACT_FEE_TYPE[keyof typeof CONTRACT_FEE_TYPE];
export type TxnStatus = typeof TXN_STATUS[keyof typeof TXN_STATUS];
export type GovernanceType = typeof GOVERNANCE_TYPE[keyof typeof GOVERNANCE_TYPE];
export type ContractType = typeof CONTRACT_TYPE[keyof typeof CONTRACT_TYPE];
export type Language = typeof LANGUAGE[keyof typeof LANGUAGE];
export type ProposalPeriod = typeof PROPOSAL_PERIOD[keyof typeof PROPOSAL_PERIOD];
export type VariableType = typeof VARIABLE_TYPE[keyof typeof VARIABLE_TYPE];

/**
 * Get all enum values for a specific enum type
 */
export function getEnumValues<T extends Record<string, number>>(enumObject: T): number[] {
  return Object.values(enumObject);
}

/**
 * Get enum key by value
 */
export function getEnumKey<T extends Record<string, number>>(
  enumObject: T, 
  value: number
): string | undefined {
  return Object.keys(enumObject).find(key => enumObject[key] === value);
}

/**
 * Check if a value is valid for a specific enum
 */
export function isValidEnumValue<T extends Record<string, number>>(
  enumObject: T, 
  value: any
): value is T[keyof T] {
  return typeof value === 'number' && Object.values(enumObject).includes(value);
}
