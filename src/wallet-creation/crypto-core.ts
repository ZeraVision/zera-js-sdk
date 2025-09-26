import { sha256, sha512 } from '@noble/hashes/sha2';
import { sha3_256 } from '@noble/hashes/sha3';
import { hmac } from '@noble/hashes/hmac';
import { ed25519 } from '@noble/curves/ed25519.js';
import { ed448 } from '@noble/curves/ed448.js';
import bs58 from 'bs58';
import { EXTENDED_KEY_VERSIONS } from './constants.js';
import type { KeyType } from '../types/index.js';

// SLIP-0010 constants
const SLIP0010_HARDENED_OFFSET = 0x80000000;
const SLIP0010_SEED_KEY = 'ZERA seed'; // Custom seed key for ZERA network isolation
const SLIP0010_PRIVATE_KEY_LENGTH = 32;
const SLIP0010_CHAIN_CODE_LENGTH = 32;

/**
 * Utility functions for byte manipulation
 */
const ByteUtils = {
  /**
   * Convert Uint8Array to Uint32
   */
  bytesToUint32(bytes: Uint8Array, littleEndian: boolean = false): number {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return view.getUint32(0, littleEndian);
  },

  /**
   * Convert Uint32 to Uint8Array
   */
  uint32ToBytes(value: number, littleEndian: boolean = false): Uint8Array {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, value, littleEndian);
    return new Uint8Array(buffer);
  },

  /**
   * Generate cryptographically secure random bytes
   */
  randomBytes(length: number): Uint8Array {
    const array = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for Node.js
      const crypto = require('crypto');
      crypto.randomFillSync(array);
    }
    return array;
  },

  /**
   * Compare two byte arrays for equality
   */
  equals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  },

  /**
   * Convert bytes to hex string
   */
  toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },

  /**
   * Convert hex string to bytes
   */
  fromHex(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  },

  /**
   * Concatenate multiple byte arrays
   */
  concat(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  },

  /**
   * Secure memory clearing
   */
  secureClear(bytes: Uint8Array): void {
    if (bytes && bytes.length > 0) {
      bytes.fill(0);
    }
  }
};

/**
 * SLIP-0010 HD Wallet implementation for EdDSA curves
 */
export class SLIP0010HDWallet {
  public readonly seed: Uint8Array;
  public readonly derivationPath: string;
  public readonly keyType: KeyType;
  public readonly depth: number;
  public readonly index: number;
  public readonly chainCode: Uint8Array;
  public readonly privateKey: Uint8Array;
  public readonly publicKey: Uint8Array;

  constructor(seed: Uint8Array, derivationPath: string, keyType: KeyType) {
    this.seed = seed;
    this.derivationPath = derivationPath;
    this.keyType = keyType;
    
    // Parse derivation path
    const pathParts = this.parseDerivationPath(derivationPath);
    this.depth = pathParts.length - 1;
    this.index = pathParts[pathParts.length - 1]!;
    
    // Derive keys
    const derived = this.deriveKeys(seed, pathParts);
    this.chainCode = derived.chainCode;
    this.privateKey = derived.privateKey;
    this.publicKey = derived.publicKey;
  }

  /**
   * Parse derivation path into array of indices
   */
  private parseDerivationPath(path: string): number[] {
    if (!path.startsWith('m/')) {
      throw new Error('Invalid derivation path: must start with "m/"');
    }
    
    const parts = path.split('/').slice(1);
    return parts.map(part => {
      if (part.endsWith("'")) {
        return parseInt(part.slice(0, -1)) + SLIP0010_HARDENED_OFFSET;
      } else {
        return parseInt(part);
      }
    });
  }

  /**
   * Derive keys using SLIP-0010
   */
  private deriveKeys(seed: Uint8Array, pathIndices: number[]): {
    chainCode: Uint8Array;
    privateKey: Uint8Array;
    publicKey: Uint8Array;
  } {
    let currentSeed = seed;
    let currentChainCode = new Uint8Array(SLIP0010_CHAIN_CODE_LENGTH);
    
    // Initial key derivation
    const initialKey = this.deriveKeyFromSeed(currentSeed);
    currentSeed = initialKey.privateKey;
    currentChainCode = initialKey.chainCode as Uint8Array<ArrayBuffer>;
    
    // Derive through path
    for (const index of pathIndices) {
      const derived = this.deriveChildKey(currentSeed, currentChainCode, index);
      currentSeed = derived.privateKey;
      currentChainCode = derived.chainCode as Uint8Array<ArrayBuffer>;
    }
    
    // Generate public key
    const publicKey = this.generatePublicKey(currentSeed);
    
    return {
      chainCode: currentChainCode,
      privateKey: currentSeed,
      publicKey
    };
  }

  /**
   * Derive initial key from seed
   */
  private deriveKeyFromSeed(seed: Uint8Array): {
    privateKey: Uint8Array;
    chainCode: Uint8Array;
  } {
    const hmacKey = new TextEncoder().encode(SLIP0010_SEED_KEY);
    const hmacResult = hmac(sha512, hmacKey, seed);
    
    return {
      privateKey: hmacResult.slice(0, SLIP0010_PRIVATE_KEY_LENGTH),
      chainCode: hmacResult.slice(SLIP0010_PRIVATE_KEY_LENGTH)
    };
  }

  /**
   * Derive child key
   */
  private deriveChildKey(
    privateKey: Uint8Array, 
    chainCode: Uint8Array, 
    index: number
  ): {
    privateKey: Uint8Array;
    chainCode: Uint8Array;
  } {
    const indexBytes = ByteUtils.uint32ToBytes(index, true);
    const data = ByteUtils.concat(indexBytes, privateKey);
    const hmacResult = hmac(sha512, chainCode, data);
    
    return {
      privateKey: hmacResult.slice(0, SLIP0010_PRIVATE_KEY_LENGTH),
      chainCode: hmacResult.slice(SLIP0010_PRIVATE_KEY_LENGTH)
    };
  }

  /**
   * Generate public key from private key
   */
  private generatePublicKey(privateKey: Uint8Array): Uint8Array {
    if (this.keyType === 'ed25519') {
      return ed25519.getPublicKey(privateKey);
    } else if (this.keyType === 'ed448') {
      // For ED448, we need to expand the 32-byte SLIP-0010 seed to 57-byte private key
      const ed448KeyPair = new Ed448KeyPair(privateKey);
      return ed448KeyPair.publicKey;
    } else {
      throw new Error(`Unsupported key type: ${this.keyType}`);
    }
  }

  /**
   * Get wallet address
   */
  getAddress(): string {
    // This would typically involve address generation logic
    // For now, return a placeholder
    return bs58.encode(this.publicKey);
  }

  /**
   * Get extended private key
   */
  getExtendedPrivateKey(): string {
    const version = EXTENDED_KEY_VERSIONS.PRIVATE;
    const versionBytes = ByteUtils.uint32ToBytes(version, false);
    const depthByte = new Uint8Array([this.depth]);
    const indexBytes = ByteUtils.uint32ToBytes(this.index, false);
    const chainCodeBytes = this.chainCode;
    const privateKeyBytes = this.privateKey;
    
    const extendedKey = ByteUtils.concat(
      versionBytes,
      depthByte,
      indexBytes,
      chainCodeBytes,
      privateKeyBytes
    );
    
    return bs58.encode(extendedKey);
  }

  /**
   * Get extended public key
   */
  getExtendedPublicKey(): string {
    const version = EXTENDED_KEY_VERSIONS.PUBLIC;
    const versionBytes = ByteUtils.uint32ToBytes(version, false);
    const depthByte = new Uint8Array([this.depth]);
    const indexBytes = ByteUtils.uint32ToBytes(this.index, false);
    const chainCodeBytes = this.chainCode;
    const publicKeyBytes = this.publicKey;
    
    const extendedKey = ByteUtils.concat(
      versionBytes,
      depthByte,
      indexBytes,
      chainCodeBytes,
      publicKeyBytes
    );
    
    return bs58.encode(extendedKey);
  }

  /**
   * Get private key in base58 format
   */
  getPrivateKeyBase58(): string {
    return bs58.encode(this.privateKey);
  }

  /**
   * Get fingerprint
   */
  getFingerprint(keyType: KeyType): string {
    const hash = sha256(this.publicKey);
    return ByteUtils.toHex(hash.slice(0, 4));
  }

  /**
   * Secure memory clearing
   */
  secureClear(): void {
    ByteUtils.secureClear(this.seed);
    ByteUtils.secureClear(this.privateKey);
    ByteUtils.secureClear(this.chainCode);
  }
}

/**
 * Ed25519 Key Pair implementation
 */
export class Ed25519KeyPair {
  private readonly privateKey: Uint8Array;
  public readonly publicKey: Uint8Array;

  constructor(privateKey?: Uint8Array) {
    if (privateKey) {
      this.privateKey = privateKey;
      this.publicKey = ed25519.getPublicKey(privateKey);
    } else {
      this.privateKey = ed25519.utils.randomSecretKey();
      this.publicKey = ed25519.getPublicKey(this.privateKey);
    }
  }

  /**
   * Create from HD wallet node
   */
  static fromHDNode(hdNode: SLIP0010HDWallet): Ed25519KeyPair {
    return new Ed25519KeyPair(hdNode.privateKey);
  }

  /**
   * Create from private key bytes
   */
  static fromPrivateKey(privateKey: Uint8Array): Ed25519KeyPair {
    return new Ed25519KeyPair(privateKey);
  }

  /**
   * Get private key as base58
   */
  getPrivateKeyBase58(): string {
    return bs58.encode(this.privateKey);
  }

  /**
   * Get public key as base58
   */
  getPublicKeyBase58(): string {
    return bs58.encode(this.publicKey);
  }

  /**
   * Sign data
   */
  sign(data: Uint8Array): Uint8Array {
    return ed25519.sign(data, this.privateKey);
  }

  /**
   * Verify signature
   */
  verify(signature: Uint8Array, data: Uint8Array): boolean {
    return ed25519.verify(signature, data, this.publicKey);
  }

  /**
   * Secure memory clearing
   */
  secureClear(): void {
    ByteUtils.secureClear(this.privateKey);
  }
}

/**
 * Ed448 Key Pair implementation
 */
export class Ed448KeyPair {
  private readonly privateKey: Uint8Array;
  public readonly publicKey: Uint8Array;

  constructor(privateKey?: Uint8Array) {
    if (privateKey) {
      // Handle both 32-byte SLIP0010 seeds and 57-byte ED448 private keys
      if (privateKey.length === 32) {
        // Expand 32-byte SLIP0010 seed to 57-byte ED448 private key using SHA3-256
        this.privateKey = this.expandSeedToPrivateKey(privateKey);
      } else if (privateKey.length === 57) {
        // Direct 57-byte ED448 private key
        this.privateKey = privateKey;
      } else {
        throw new Error(`Invalid private key length: ${privateKey.length}. Expected 32 (SLIP0010 seed) or 57 (ED448 private key) bytes.`);
      }
      this.publicKey = ed448.getPublicKey(this.privateKey);
    } else {
      this.privateKey = ed448.utils.randomSecretKey();
      this.publicKey = ed448.getPublicKey(this.privateKey);
    }
  }

  /**
   * Expand 32-byte SLIP0010 seed to 57-byte ED448 private key
   * This follows the original JavaScript implementation using SHA3-256 + HMAC-SHA512
   */
  private expandSeedToPrivateKey(privateKey: Uint8Array): Uint8Array {
    // Validate input
    if (privateKey.length !== 32) {
      throw new Error('SLIP-0010 private key must be 32 bytes');
    }
    
    // Step 1: Create deterministic seed using SHA3-256
    const seed = sha3_256(privateKey);
    
    // Step 2: Secure key expansion using HMAC-SHA512
    const expanded = hmac(sha512, seed, 'ed448-expansion');
    const expanded57 = expanded.slice(0, 57);
    
    // Step 3: Apply Ed448 clamping (clear bits 0 and 1 of the last byte)
    const clamped = new Uint8Array(expanded57);
    if (clamped.length >= 57) {
      clamped[56] = (clamped[56] || 0) & 0xFC; // Clear bits 0 and 1
    }
    
    return clamped;
  }

  /**
   * Create from HD wallet node
   */
  static fromHDNode(hdNode: SLIP0010HDWallet): Ed448KeyPair {
    return new Ed448KeyPair(hdNode.privateKey);
  }

  /**
   * Create from private key bytes
   */
  static fromPrivateKey(privateKey: Uint8Array): Ed448KeyPair {
    return new Ed448KeyPair(privateKey);
  }

  /**
   * Get private key as base58
   */
  getPrivateKeyBase58(): string {
    return bs58.encode(this.privateKey);
  }

  /**
   * Get public key as base58
   */
  getPublicKeyBase58(): string {
    return bs58.encode(this.publicKey);
  }

  /**
   * Sign data
   */
  sign(data: Uint8Array): Uint8Array {
    return ed448.sign(data, this.privateKey);
  }

  /**
   * Verify signature
   */
  verify(signature: Uint8Array, data: Uint8Array): boolean {
    return ed448.verify(signature, data, this.publicKey);
  }

  /**
   * Secure memory clearing
   */
  secureClear(): void {
    ByteUtils.secureClear(this.privateKey);
  }
}

/**
 * Cryptographic utilities
 */
export const CryptoUtils = {
  /**
   * Generate random private key
   */
  randomPrivateKey(keyType: KeyType): Uint8Array {
    if (keyType === 'ed25519') {
      return ed25519.utils.randomSecretKey();
    } else if (keyType === 'ed448') {
      return ed448.utils.randomSecretKey();
    } else {
      throw new Error(`Unsupported key type: ${keyType}`);
    }
  },

  /**
   * Generate public key from private key
   */
  getPublicKey(privateKey: Uint8Array, keyType: KeyType): Uint8Array {
    if (keyType === 'ed25519') {
      return ed25519.getPublicKey(privateKey);
    } else if (keyType === 'ed448') {
      return ed448.getPublicKey(privateKey);
    } else {
      throw new Error(`Unsupported key type: ${keyType}`);
    }
  },

  /**
   * Secure memory clearing
   */
  secureClear(data: Uint8Array): void {
    ByteUtils.secureClear(data);
  }
};
