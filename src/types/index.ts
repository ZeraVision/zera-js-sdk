/**
 * Core Type Definitions for ZERA JS SDK
 * 
 * Simple, practical TypeScript types focused on real benefits:
 * - Better error handling with Result types
 * - Proper generics instead of 'any'
 * - Basic utility types for common patterns
 */

import { Decimal } from 'decimal.js';

// Simple error types
export class ZeraError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ZeraError';
  }
}

export class ValidationError extends ZeraError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends ZeraError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class CryptoError extends ZeraError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CRYPTO_ERROR', details);
    this.name = 'CryptoError';
  }
}

export class TransactionError extends ZeraError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'TRANSACTION_ERROR', details);
    this.name = 'TransactionError';
  }
}

// Simple Result type for better error handling
export type Result<T, E = Error> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// Simple utility functions
export function createSuccess<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function createError<E>(error: E): Result<never, E> {
  return { success: false, error };
}

export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

export function isError<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

/**
 * Supported key types for wallet creation
 */
export const KEY_TYPE = {
  ED25519: 'ed25519',
  ED448: 'ed448'
} as const;

export type KeyType = typeof KEY_TYPE[keyof typeof KEY_TYPE];

/**
 * Supported hash algorithms
 */
export const HASH_TYPE = {
  SHA3_256: 'sha3-256',
  SHA3_512: 'sha3-512',
  BLAKE3: 'blake3'
} as const;

export type HashType = typeof HASH_TYPE[keyof typeof HASH_TYPE];

/**
 * Valid key types array
 */
export const VALID_KEY_TYPES: readonly KeyType[] = Object.values(KEY_TYPE);

/**
 * Valid hash types array
 */
export const VALID_HASH_TYPES: readonly HashType[] = Object.values(HASH_TYPE);

/**
 * Supported mnemonic lengths
 */
export const MNEMONIC_LENGTHS = [12, 15, 18, 21, 24] as const;

export type MnemonicLength = typeof MNEMONIC_LENGTHS[number];

// ============================================================================
// WALLET TYPES
// ============================================================================

/**
 * HD wallet derivation options
 */
export interface HDOptions {
  /** Account index (default: 0) */
  accountIndex?: number;
  /** Change index - 0 for external, 1 for internal (default: 0) */
  changeIndex?: 0 | 1;
  /** Address index (default: 0) */
  addressIndex?: number;
}

/**
 * Wallet creation options
 */
export interface WalletOptions {
  /** Key type from KEY_TYPE enum */
  keyType: KeyType;
  /** Array of hash types from HASH_TYPE enum (required) */
  hashTypes: HashType[];
  /** BIP39 mnemonic phrase (required) */
  mnemonic: string;
  /** Optional passphrase for additional security */
  passphrase?: string;
  /** HD wallet derivation options */
  hdOptions?: HDOptions;
}

/**
 * Wallet object returned from createWallet
 */
export interface Wallet {
  /** Wallet type identifier */
  type: 'hd';
  /** BIP39 mnemonic phrase */
  mnemonic: string;
  /** Private key in base58 format */
  privateKey: string;
  /** Wallet address */
  address: string;
  /** Public key identifier */
  publicKey: string;
  /** Public key package (comprehensive binary format) */
  publicKeyPackage: string;
  /** Coin type identifier */
  coinType: number;
  /** Currency symbol */
  symbol: string;
  /** Currency name */
  name: string;
  /** SLIP-0010 derivation path */
  derivationPath: string;
  /** Key type used */
  keyType: KeyType;
  /** Hash types used */
  hashTypes: HashType[];
  /** Extended private key */
  extendedPrivateKey: string;
  /** Extended public key */
  extendedPublicKey: string;
  /** Fingerprint */
  fingerprint: string;
  /** HD depth */
  depth: number;
  /** HD index */
  index: number;
  /** Secure memory clearing method */
  secureClear: () => void;
}

/**
 * Multiple wallet derivation options
 */
export interface MultipleWalletOptions extends WalletOptions {
  /** Number of wallets to derive (default: 1) */
  count?: number;
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

/**
 * CoinTXN input object
 */
export interface CoinTXNInput {
  /** Private key in base58 format */
  privateKey: string;
  /** Public key identifier */
  publicKey: string;
  /** Amount to spend (user-friendly format) */
  amount: AmountInput;
  /** Fee percentage (default: '100') */
  feePercent?: string;
  /** Key type (optional, auto-detected if not provided) */
  keyType?: KeyType;
  /** Allowance address (for allowance transactions) */
  allowanceAddress?: string;
}

/**
 * CoinTXN output object
 */
export interface CoinTXNOutput {
  /** Recipient address */
  to: string;
  /** Amount to send (user-friendly format) */
  amount: AmountInput;
  /** Optional memo for this output */
  memo?: string;
}

/**
 * Fee configuration options
 */
export interface FeeConfig {
  /** Base fee instrument ID (defaults to '$ZRA+0000') */
  baseFeeId?: string;
  /** Base fee amount in user-friendly units (auto-calculated if not provided) */
  baseFee?: AmountInput;
  /** Contract fee instrument (defaults to contractId) */
  contractFeeId?: string;
  /** Contract fee amount in user-friendly units (auto-calculated if not provided) */
  contractFee?: AmountInput;
  /** Interface fee amount (required if interfaceFeeId is specified) */
  interfaceFeeAmount?: AmountInput;
  /** Interface fee contract ID (triggers interface fee calculation) */
  interfaceFeeId?: string;
  /** Interface provider address (required if interfaceFeeId is specified) */
  interfaceAddress?: string;
}

/**
 * gRPC configuration options
 */
export interface GRPCConfig {
  /** Full endpoint URL (overrides host/port if provided) */
  endpoint?: string;
  /** Host address (default: 'routing.zerascan.io') */
  host?: string;
  /** Port number (default: 50052) */
  port?: number;
  /** Protocol to use (default: 'http') */
  protocol?: 'http' | 'https';
  /** Additional Node.js options for the transport */
  nodeOptions?: Record<string, any>;
  /** Connection timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Retry delay in milliseconds (default: 1000) */
  retryDelay?: number;
}

/**
 * gRPC override configuration for specific operations
 */
export interface GRPCOverrideConfig {
  /** Base gRPC configuration */
  grpcConfig?: GRPCConfig;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Maximum retry attempts (default: 2) */
  maxRetries?: number;
  /** Retry delay in milliseconds (default: 500) */
  retryDelay?: number;
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Exchange rate options
 */
export interface ExchangeRateOptions {
  /** Host for the exchange rate service */
  host?: string;
  /** Port for the exchange rate service */
  port?: number;
  /** Protocol to use */
  protocol?: 'http' | 'https';
}

// ============================================================================
// gRPC TYPES
// ============================================================================

/**
 * Generic gRPC client options
 */
export interface GRPCClientOptions {
  /** Path to the .proto file */
  protoFile: string;
  /** Package name in the proto file */
  packageName: string;
  /** Service name in the proto file */
  serviceName: string;
  /** Host to connect to */
  host?: string;
  /** Port to connect to */
  port?: number;
}

/**
 * Generic gRPC client interface
 */
export interface GRPCClient {
  /** The gRPC client instance */
  client: any;
  /** Proto definition */
  proto: any;
  /** Service name */
  serviceName: string;
  /** Host */
  host: string;
  /** Port */
  port: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Base error interface for wallet creation operations
 */
export interface WalletCreationErrorInterface extends Error {
  /** Error code */
  code: string;
  /** Additional error details */
  details?: Record<string, any>;
  /** Error timestamp */
  timestamp: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for amounts that can be converted to Decimal
 */
export type AmountInput = string | number | Decimal;

/**
 * Type for contract IDs (must follow format $[letters]+[4 digits])
 */
export type ContractId = string;

/**
 * Type for base58 encoded addresses
 */
export type Base58Address = string;

/**
 * Type for base58 encoded keys
 */
export type Base58Key = string;

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation result interface
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Additional validation details */
  details?: Record<string, any>;
}

/**
 * Type guard for key type validation
 */
export function isValidKeyType(value: any): value is KeyType {
  return typeof value === 'string' && VALID_KEY_TYPES.includes(value as KeyType);
}

/**
 * Type guard for hash type validation
 */
export function isValidHashType(value: any): value is HashType {
  return typeof value === 'string' && VALID_HASH_TYPES.includes(value as HashType);
}

/**
 * Type guard for mnemonic length validation
 */
export function isValidMnemonicLength(value: any): value is MnemonicLength {
  return typeof value === 'number' && MNEMONIC_LENGTHS.includes(value as MnemonicLength);
}

/**
 * Type guard for contract ID validation
 */
export function isValidContractId(value: any): value is ContractId {
  if (typeof value !== 'string') return false;
  const contractIdRegex = /^\$[A-Za-z]+\+\d{4}$/;
  return contractIdRegex.test(value);
}
