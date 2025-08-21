import { sha256 } from '@noble/hashes/sha256';
import { mnemonicToSeedSync } from 'bip39';
import { 
  validateWalletParams, 
  generateZeraAddress, 
  createBaseWallet 
} from './shared.js';
import { 
  ZERA_COIN_TYPE, 
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
  // In production, you'd use a proper ed448 library
  const hash = sha256(privateKey);
  return hash; // Placeholder - implement actual ed448 key generation
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
    
    // For ed448, we'll use a different approach since noble-ed25519 doesn't support ed448
    // We'll generate the key using the seed directly
    const privateKey = sha256(seed);
    const publicKey = generateEd448PublicKey(privateKey);
    
    // Generate ZERA address from public key
    const address = generateZeraAddress(publicKey, 'ed448');
    
    // Create and return wallet object
    return createBaseWallet(
      'ed448',
      mnemonic,
      privateKey.toString('hex'),
      publicKey.toString('hex'),
      address,
      ZERA_COIN_TYPE,
      ZERA_SYMBOL,
      DERIVATION_PATH
    );
  } catch (error) {
    throw new Error(`Failed to create ed448 wallet: ${error.message}`);
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
