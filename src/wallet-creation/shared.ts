import { 
  KEY_TYPE, 
  HASH_TYPE, 
  KEY_TYPE_PREFIXES, 
  HASH_TYPE_PREFIXES,
  isValidKeyType,
  isValidHashType
} from './constants.js';
import { CryptoUtils } from './crypto-core.js';
import bs58 from 'bs58';
import type { KeyType, HashType } from '../types/index.js';
import { validateHashTypes } from './hash-utils.js';

/**
 * Generate ZERA public key identifier (human-readable format with type prefixes)
 * 
 * This creates a human-readable identifier that includes:
 * - Key type prefix (A_ for Ed25519, B_ for Ed448)
 * - Hash type prefix(es) (a_ for SHA3-256, b_ for SHA3-512, c_ for Blake3)
 * - Base58-encoded public key
 * 
 * Format: KeyPrefix_HashPrefix_PublicKeyBase58
 * Example: "A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb"
 */
export function generateZeraPublicKeyIdentifier(
  publicKey: Uint8Array, 
  keyType: KeyType, 
  hashTypes: HashType[] = []
): string {
  if (!publicKey || !(publicKey instanceof Uint8Array)) {
    throw new Error('Public key must be a Uint8Array');
  }

  if (!isValidKeyType(keyType)) {
    throw new Error(`Invalid key type: ${keyType}`);
  }

  if (!Array.isArray(hashTypes) || hashTypes.length === 0) {
    throw new Error('Hash types must be a non-empty array');
  }

  // Validate all hash types
  for (const hashType of hashTypes) {
    if (!isValidHashType(hashType)) {
      throw new Error(`Invalid hash type: ${hashType}`);
    }
  }

  // Get key type prefix
  const keyPrefix = KEY_TYPE_PREFIXES[keyType];
  
  // Get hash type prefixes (sorted for consistency)
  const sortedHashTypes = [...hashTypes].sort();
  const hashPrefixes = sortedHashTypes.map(hashType => HASH_TYPE_PREFIXES[hashType]).join('');
  
  // Encode public key to base58
  const publicKeyBase58 = bs58.encode(publicKey);
  
  // Combine all parts
  return `${keyPrefix}_${hashPrefixes}_${publicKeyBase58}`;
}

/**
 * Create base wallet object with common properties
 */
export function createBaseWallet(
  type: string,
  mnemonic: string,
  privateKey: string,
  address: string,
  publicKey: string,
  coinType: number,
  symbol: string,
  derivationPath: string,
  keyType: KeyType,
  hashTypes: HashType[]
): {
  type: string;
  mnemonic: string;
  privateKey: string;
  address: string;
  publicKey: string;
  coinType: number;
  symbol: string;
  derivationPath: string;
  keyType: KeyType;
  hashTypes: HashType[];
} {
  return {
    type,
    mnemonic,
    privateKey,
    address,
    publicKey,
    coinType,
    symbol,
    derivationPath,
    keyType,
    hashTypes
  };
}

/**
 * Validate wallet object structure
 */
export function validateWalletObject(wallet: any): wallet is {
  type: string;
  mnemonic: string;
  privateKey: string;
  address: string;
  publicKey: string;
  coinType: number;
  symbol: string;
  derivationPath: string;
  keyType: KeyType;
  hashTypes: HashType[];
} {
  if (!wallet || typeof wallet !== 'object') {
    return false;
  }

  const requiredFields = [
    'type', 'mnemonic', 'privateKey', 'address', 'publicKey',
    'coinType', 'symbol', 'derivationPath', 'keyType', 'hashTypes'
  ];

  for (const field of requiredFields) {
    if (!(field in wallet)) {
      return false;
    }
  }

  // Validate specific field types
  if (typeof wallet.type !== 'string') return false;
  if (typeof wallet.mnemonic !== 'string') return false;
  if (typeof wallet.privateKey !== 'string') return false;
  if (typeof wallet.address !== 'string') return false;
  if (typeof wallet.publicKey !== 'string') return false;
  if (typeof wallet.coinType !== 'number') return false;
  if (typeof wallet.symbol !== 'string') return false;
  if (typeof wallet.derivationPath !== 'string') return false;
  if (!isValidKeyType(wallet.keyType)) return false;
  if (!Array.isArray(wallet.hashTypes) || !validateHashTypes(wallet.hashTypes)) return false;

  return true;
}

/**
 * Sanitize wallet object for safe logging (removes sensitive data)
 */
export function sanitizeWalletForLogging(wallet: any): Record<string, any> {
  if (!wallet || typeof wallet !== 'object') {
    return {};
  }

  return {
    type: wallet.type,
    address: wallet.address,
    publicKey: wallet.publicKey ? `${wallet.publicKey.substring(0, 10)}...` : undefined,
    coinType: wallet.coinType,
    symbol: wallet.symbol,
    derivationPath: wallet.derivationPath,
    keyType: wallet.keyType,
    hashTypes: wallet.hashTypes,
    // Never log sensitive data
    mnemonic: '[REDACTED]',
    privateKey: '[REDACTED]'
  };
}

/**
 * Create wallet summary for display
 */
export function createWalletSummary(wallet: any): string {
  if (!validateWalletObject(wallet)) {
    return 'Invalid wallet object';
  }

  return `Wallet Summary:
  Type: ${wallet.type}
  Address: ${wallet.address}
  Key Type: ${wallet.keyType}
  Hash Types: ${wallet.hashTypes.join(', ')}
  Derivation Path: ${wallet.derivationPath}
  Coin Type: ${wallet.coinType}
  Symbol: ${wallet.symbol}`;
}
