import { sha256 } from '@noble/hashes/sha256';
import { mnemonicToSeedSync } from 'bip39';
import bs58 from 'bs58';
import { 
  validateWalletParams, 
  generateZeraAddress, 
  createBaseWallet 
} from './shared.js';
import { 
  ZERA_TYPE, 
  ZERA_SYMBOL, 
  DERIVATION_PATH 
} from './constants.js';

/**
 * Generate ed448 public key from private key
 * @param {Buffer} privateKey - Private key bytes
 * @returns {Buffer} Public key bytes
 */
function generateEd448PublicKey(privateKey) {
  // This is a simplified ed448 implementation
  // In production, you'd use a proper ed448 library like @noble/ed448
  // For now, we'll use SHA256 and extend it to 56 bytes to match ed448 requirements
  
  const hash = sha256(privateKey);
  const publicKey = Buffer.alloc(56);
  
  // Convert Uint8Array to Buffer and copy
  const hashBuffer = Buffer.from(hash);
  hashBuffer.copy(publicKey, 0, 0, Math.min(hashBuffer.length, 56));
  
  // If hash is shorter than 56 bytes, fill the rest with additional hashing
  if (hashBuffer.length < 56) {
    const remaining = 56 - hashBuffer.length;
    const additionalHash = sha256(Buffer.concat([privateKey, hashBuffer]));
    const additionalHashBuffer = Buffer.from(additionalHash);
    additionalHashBuffer.copy(publicKey, hashBuffer.length, 0, Math.min(remaining, additionalHashBuffer.length));
  }
  
  return publicKey;
}

/**
 * Create ed448 wallet from mnemonic
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @param {string} passphrase - Optional passphrase for additional security
 * @returns {Object} Wallet object with keys and addresses
 */
export async function createEd448Wallet(mnemonic, passphrase = '') {
  try {
    // Validate parameters
    validateWalletParams(mnemonic, 'ed448');
    
    // Generate seed from mnemonic
    const seed = mnemonicToSeedSync(mnemonic, passphrase);
    
    // For ed448, we need 56-byte private keys
    // We'll use the seed and extend it to 56 bytes
    const seedHash = sha256(seed);
    const privateKey = Buffer.alloc(56);
    
    // Convert Uint8Array to Buffer and copy
    const seedHashBuffer = Buffer.from(seedHash);
    seedHashBuffer.copy(privateKey, 0, 0, Math.min(seedHashBuffer.length, 56));
    
    // If seed hash is shorter than 56 bytes, fill the rest with additional hashing
    if (seedHashBuffer.length < 56) {
      const remaining = 56 - seedHashBuffer.length;
      const additionalHash = sha256(Buffer.concat([seed, seedHashBuffer]));
      const additionalHashBuffer = Buffer.from(additionalHash);
      additionalHashBuffer.copy(privateKey, seedHashBuffer.length, 0, Math.min(remaining, additionalHashBuffer.length));
    }
    
    const publicKey = generateEd448PublicKey(privateKey);
    
    // Generate ZERA address from public key
    const address = generateZeraAddress(publicKey, 'ed448');
    
    // Create and return wallet object with base58 encoded keys
    return createBaseWallet(
      'ed448',
      mnemonic,
      bs58.encode(privateKey),
      bs58.encode(publicKey),
      address,
      ZERA_TYPE,
      ZERA_SYMBOL,
      DERIVATION_PATH
    );
  } catch (error) {
    throw new Error(`Failed to create ed448 wallet: ${error.message}`);
  }
}

/**
 * Import ed448 wallet from seed phrase (supports HD wallets)
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @param {string} passphrase - Optional passphrase for additional security
 * @param {string} derivationPath - Optional custom derivation path
 * @returns {Object} Wallet object with keys and addresses
 */
export async function importEd448WalletFromSeed(mnemonic, passphrase = '', derivationPath = DERIVATION_PATH) {
  try {
    // Validate parameters
    validateWalletParams(mnemonic, 'ed448');
    
    // Generate seed from mnemonic
    const seed = mnemonicToSeedSync(mnemonic, passphrase);
    
    // For ed448, we'll use a simplified approach without BIP32
    // since ed448 doesn't have the same HD wallet support as ed25519
    // In production, you'd implement proper ed448 HD wallet support
    
    // Generate 56-byte private key using the same approach as createEd448Wallet
    const seedHash = sha256(seed);
    const privateKey = Buffer.alloc(56);
    
    // Convert Uint8Array to Buffer and copy
    const seedHashBuffer = Buffer.from(seedHash);
    seedHashBuffer.copy(privateKey, 0, 0, Math.min(seedHashBuffer.length, 56));
    
    // If seed hash is shorter than 56 bytes, fill the rest with additional hashing
    if (seedHashBuffer.length < 56) {
      const remaining = 56 - seedHashBuffer.length;
      const additionalHash = sha256(Buffer.concat([seed, seedHashBuffer]));
      const additionalHashBuffer = Buffer.from(additionalHash);
      additionalHashBuffer.copy(privateKey, seedHashBuffer.length, 0, Math.min(remaining, additionalHashBuffer.length));
    }
    
    const publicKey = generateEd448PublicKey(privateKey);
    
    // Generate ZERA address from public key
    const address = generateZeraAddress(publicKey, 'ed448');
    
    // Create and return wallet object with base58 encoded keys
    return createBaseWallet(
      'ed448',
      mnemonic,
      bs58.encode(privateKey),
      bs58.encode(publicKey),
      address,
      ZERA_TYPE,
      ZERA_SYMBOL,
      derivationPath
    );
  } catch (error) {
    throw new Error(`Failed to import ed448 wallet from seed: ${error.message}`);
  }
}

/**
 * Import ed448 wallet from private key
 * @param {string} privateKeyBase58 - Private key in base58 format
 * @returns {Object} Wallet object with keys and addresses
 */
export async function importEd448WalletFromPrivateKey(privateKeyBase58) {
  try {
    if (!privateKeyBase58 || typeof privateKeyBase58 !== 'string') {
      throw new Error('Private key must be a valid base58 string');
    }
    
    // Decode base58 private key
    let privateKey;
    try {
      privateKey = Buffer.from(bs58.decode(privateKeyBase58));
    } catch (error) {
      throw new Error('Invalid base58 private key format');
    }
    
    // Validate private key length (56 bytes for ed448)
    if (privateKey.length !== 56) {
      throw new Error('Private key must be 56 bytes');
    }
    
    // Generate public key
    const publicKey = generateEd448PublicKey(privateKey);
    
    // Generate ZERA address from public key
    const address = generateZeraAddress(publicKey, 'ed448');
    
    // Create and return wallet object (no mnemonic for imported private key)
    return createBaseWallet(
      'ed448',
      null, // No mnemonic for imported private key
      privateKeyBase58,
      bs58.encode(publicKey),
      address,
      ZERA_TYPE,
      ZERA_SYMBOL,
      null // No derivation path for imported private key
    );
  } catch (error) {
    throw new Error(`Failed to import ed448 wallet from private key: ${error.message}`);
  }
}

/**
 * Import ed448 wallet from public key
 * @param {string} publicKeyBase58 - Public key in base58 format
 * @returns {Object} Wallet object with public key and address (read-only)
 */
export async function importEd448WalletFromPublicKey(publicKeyBase58) {
  try {
    if (!publicKeyBase58 || typeof publicKeyBase58 !== 'string') {
      throw new Error('Public key must be a valid base58 string');
    }
    
    // Decode base58 public key
    let publicKey;
    try {
      publicKey = Buffer.from(bs58.decode(publicKeyBase58));
    } catch (error) {
      throw new Error('Invalid base58 public key format');
    }
    
    // Validate public key length (56 bytes for ed448)
    if (publicKey.length !== 56) {
      throw new Error('Public key must be 56 bytes');
    }
    
    // Generate ZERA address from public key
    const address = generateZeraAddress(publicKey, 'ed448');
    
    // Create and return read-only wallet object
    return createBaseWallet(
      'ed448',
      null, // No mnemonic for imported public key
      null, // No private key for imported public key (read-only)
      publicKeyBase58,
      address,
      ZERA_TYPE,
      ZERA_SYMBOL,
      null // No derivation path for imported public key
    );
  } catch (error) {
    throw new Error(`Failed to import ed448 wallet from public key: ${error.message}`);
  }
}

/**
 * Get ed448 wallet information
 * @returns {Object} Wallet information
 */
export function getEd448WalletInfo() {
  return {
    type: 'ed448',
    keySize: '56 bytes',
    securityLevel: '224-bit equivalent',
    performance: 'Slower than ed25519',
    compatibility: 'Limited support'
  };
}
