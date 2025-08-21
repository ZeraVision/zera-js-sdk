import { randomBytes } from 'crypto';
import { entropyToMnemonic, mnemonicToEntropy, validateMnemonic } from 'bip39';

/**
 * Generate a cryptographically secure BIP39 mnemonic phrase
 * @param {number} strength - Word count: 12 (128 bits), 15 (160 bits), 18 (192 bits), 21 (224 bits), 24 (256 bits)
 * @returns {string} BIP39 mnemonic phrase
 */
export function generateMnemonic(strength = 24) {
  const wordCounts = [12, 15, 18, 21, 24];
  if (!wordCounts.includes(strength)) {
    throw new Error('Invalid strength. Must be one of: 12, 15, 18, 21, 24');
  }
  
  // BIP39 standard entropy sizes in bytes for each word count
  const entropyMap = {
    12: 16,   // 128 bits = 16 bytes
    15: 20,   // 160 bits = 20 bytes
    18: 24,   // 192 bits = 24 bytes
    21: 28,   // 224 bits = 28 bytes
    24: 32    // 256 bits = 32 bytes
  };
  
  const entropyBytes = entropyMap[strength];
  const entropy = randomBytes(entropyBytes);
  
  return entropyToMnemonic(entropy);
}

/**
 * Convert entropy bytes to mnemonic phrase
 * @param {Buffer} entropy - Random entropy bytes
 * @returns {string} BIP39 mnemonic phrase
 */
export function entropyToMnemonicPhrase(entropy) {
  return entropyToMnemonic(entropy);
}

/**
 * Convert mnemonic phrase back to entropy bytes
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @returns {Buffer} Entropy bytes
 */
export function mnemonicToEntropyBytes(mnemonic) {
  return Buffer.from(mnemonicToEntropy(mnemonic));
}

/**
 * Validate a BIP39 mnemonic phrase
 * @param {string} mnemonic - Mnemonic phrase to validate
 * @returns {boolean} True if valid
 */
export function validateMnemonicPhrase(mnemonic) {
  return validateMnemonic(mnemonic);
}

/**
 * Get the strength (word count) of a mnemonic phrase
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @returns {number} Number of words
 */
export function getMnemonicStrength(mnemonic) {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }
  
  const words = mnemonic.trim().split(/\s+/);
  return words.length;
}

/**
 * Get the entropy strength in bits for a mnemonic phrase
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @returns {number} Entropy strength in bits
 */
export function getEntropyStrength(mnemonic) {
  const wordCount = getMnemonicStrength(mnemonic);
  
  // Map word count to entropy bits
  const strengthMap = {
    12: 128,
    15: 160,
    18: 192,
    21: 224,
    24: 256
  };
  
  return strengthMap[wordCount] || 0;
}

/**
 * Generate a random passphrase with specified length
 * @param {number} length - Length of passphrase (default: 32)
 * @returns {string} Random passphrase
 */
export function generatePassphrase(length = 32) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let passphrase = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    passphrase += charset[randomIndex];
  }
  
  return passphrase;
}

/**
 * Check if a passphrase meets security requirements
 * @param {string} passphrase - Passphrase to check
 * @returns {Object} Security assessment
 */
export function assessPassphraseSecurity(passphrase) {
  const hasLowercase = /[a-z]/.test(passphrase);
  const hasUppercase = /[A-Z]/.test(passphrase);
  const hasNumbers = /\d/.test(passphrase);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(passphrase);
  const length = passphrase.length;
  
  let score = 0;
  let feedback = [];
  
  // Length scoring
  if (length >= 12) score += 2;
  else if (length >= 8) score += 1;
  else feedback.push('Consider using at least 8 characters');
  
  // Character variety scoring
  if (hasLowercase) score += 1;
  if (hasUppercase) score += 1;
  if (hasNumbers) score += 1;
  if (hasSpecialChars) score += 1;
  
  // Feedback
  if (!hasLowercase) feedback.push('Add lowercase letters');
  if (!hasUppercase) feedback.push('Add uppercase letters');
  if (!hasNumbers) feedback.push('Add numbers');
  if (!hasSpecialChars) feedback.push('Add special characters');
  
  let strength = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 2) strength = 'medium';
  
  return {
    score,
    strength,
    length,
    hasLowercase,
    hasUppercase,
    hasNumbers,
    hasSpecialChars,
    feedback
  };
}
