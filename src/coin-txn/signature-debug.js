/**
 * Signature Debug Utilities
 * 
 * This module provides utilities for debugging signature validation issues
 * by extracting and verifying signatures from CoinTXN protobuf messages.
 */

import { toBinary } from '@bufbuild/protobuf';
import { CoinTXNSchema as CoinTXN, BaseTXNSchema as BaseTXN } from '../../proto/generated/txn_pb.js';
import { create } from '@bufbuild/protobuf';
import { Ed25519KeyPair, Ed448KeyPair } from '../wallet-creation/crypto-core.js';
import { getKeyTypeFromPublicKey } from '../shared/crypto/address-utils.js';
import bs58 from 'bs58';

/**
 * Debug signature validation by extracting and verifying signatures
 * @param {object} coinTxn - CoinTXN protobuf message
 * @param {Array} expectedPublicKeys - Array of expected public key identifiers
 * @returns {object} Debug results with verification status and details
 */
export function debugSignatureValidation(coinTxn, expectedPublicKeys = []) {
  const results = {
    transactionHash: null,
    signatures: [],
    publicKeys: [],
    verificationResults: [],
    errors: [],
    debugInfo: {}
  };

  try {
    // Extract transaction hash
    if (coinTxn.base?.hash) {
      results.transactionHash = Buffer.from(coinTxn.base.hash).toString('hex');
    }

    // Extract signatures and public keys
    if (coinTxn.auth?.signature) {
      results.signatures = coinTxn.auth.signature.map(sig => ({
        raw: sig,
        hex: Buffer.from(sig).toString('hex'),
        length: sig.length
      }));
    }

    if (coinTxn.auth?.publicKey) {
      results.publicKeys = coinTxn.auth.publicKey.map(pk => {
        const identifier = Buffer.from(pk.single).toString('utf8');
        return {
          identifier,
          keyType: getKeyTypeFromPublicKey(identifier),
          raw: pk.single
        };
      });
    }

    // Create transaction without hash and signatures for verification
    const txnWithoutHashAndSigs = createTransactionWithoutHashAndSignatures(coinTxn);
    const serializedTxnForVerification = toBinary(CoinTXN, txnWithoutHashAndSigs);

    results.debugInfo.transactionForVerification = {
      serializedLength: serializedTxnForVerification.length,
      serializedHex: Buffer.from(serializedTxnForVerification).toString('hex').substring(0, 100) + '...'
    };

    // Verify each signature
    for (let i = 0; i < results.signatures.length; i++) {
      const signature = results.signatures[i].raw;
      const publicKeyInfo = results.publicKeys[i];
      
      if (!publicKeyInfo) {
        results.errors.push(`No public key found for signature ${i}`);
        continue;
      }

      try {
        const isValid = verifySignature(
          serializedTxnForVerification,
          signature,
          publicKeyInfo.identifier,
          publicKeyInfo.keyType
        );

        results.verificationResults.push({
          signatureIndex: i,
          publicKeyIdentifier: publicKeyInfo.identifier,
          keyType: publicKeyInfo.keyType,
          isValid,
          signatureHex: results.signatures[i].hex,
          error: null
        });

      } catch (error) {
        results.verificationResults.push({
          signatureIndex: i,
          publicKeyIdentifier: publicKeyInfo.identifier,
          keyType: publicKeyInfo.keyType,
          isValid: false,
          signatureHex: results.signatures[i].hex,
          error: error.message
        });
        results.errors.push(`Signature ${i} verification failed: ${error.message}`);
      }
    }

    // Check if expected public keys match
    if (expectedPublicKeys.length > 0) {
      const actualIdentifiers = results.publicKeys.map(pk => pk.identifier);
      const missingKeys = expectedPublicKeys.filter(expected => !actualIdentifiers.includes(expected));
      const extraKeys = actualIdentifiers.filter(actual => !expectedPublicKeys.includes(actual));
      
      if (missingKeys.length > 0) {
        results.errors.push(`Missing expected public keys: ${missingKeys.join(', ')}`);
      }
      if (extraKeys.length > 0) {
        results.errors.push(`Unexpected public keys: ${extraKeys.join(', ')}`);
      }
    }

    // Overall validation status
    results.isValid = results.verificationResults.every(r => r.isValid) && results.errors.length === 0;

  } catch (error) {
    results.errors.push(`Debug validation failed: ${error.message}`);
    results.isValid = false;
  }

  return results;
}

/**
 * Create a transaction copy without hash and signatures for verification
 * @param {object} coinTxn - Original CoinTXN protobuf message
 * @returns {object} CoinTXN without hash and signatures
 */
function createTransactionWithoutHashAndSignatures(coinTxn) {
  // Create base transaction without hash
  const baseWithoutHash = create(BaseTXN, {
    timestamp: coinTxn.base?.timestamp,
    feeAmount: coinTxn.base?.feeAmount,
    feeId: coinTxn.base?.feeId,
    memo: coinTxn.base?.memo,
    interfaceFee: coinTxn.base?.interfaceFee,
    interfaceFeeId: coinTxn.base?.interfaceFeeId,
    interfaceAddress: coinTxn.base?.interfaceAddress
    // Deliberately excluding hash
  });

  // Create auth without signatures
  const authWithoutSignatures = {
    publicKey: coinTxn.auth?.publicKey || null,
    signature: null, // No signatures
    nonce: coinTxn.auth?.nonce || null
  };
  
  // Only include allowance fields if they exist
  if (coinTxn.auth?.allowanceAddress && coinTxn.auth.allowanceAddress.length > 0) {
    authWithoutSignatures.allowanceAddress = coinTxn.auth.allowanceAddress;
  }
  if (coinTxn.auth?.allowanceNonce && coinTxn.auth.allowanceNonce.length > 0) {
    authWithoutSignatures.allowanceNonce = coinTxn.auth.allowanceNonce;
  }

  // Create transaction without hash and signatures
  return create(CoinTXN, {
    base: baseWithoutHash,
    contractId: coinTxn.contractId,
    auth: authWithoutSignatures,
    inputTransfers: coinTxn.inputTransfers || [],
    outputTransfers: coinTxn.outputTransfers || [],
    contractFeeAmount: coinTxn.contractFeeAmount,
    contractFeeId: coinTxn.contractFeeId
  });
}

/**
 * Verify a signature against transaction data
 * @param {Uint8Array} data - Transaction data to verify against
 * @param {Uint8Array} signature - Signature to verify
 * @param {string} publicKeyIdentifier - Public key identifier
 * @param {string} keyType - Key type ('ed25519' or 'ed448')
 * @returns {boolean} True if signature is valid
 */
function verifySignature(data, signature, publicKeyIdentifier, keyType) {
  try {
    // Extract raw public key bytes
    const lastUnderscoreIndex = publicKeyIdentifier.lastIndexOf('_');
    if (lastUnderscoreIndex === -1) {
      throw new Error('Invalid public key identifier: no underscore found');
    }
    
    const base58Part = publicKeyIdentifier.substring(lastUnderscoreIndex + 1);
    const publicKeyBytes = bs58.decode(base58Part);

    if (keyType === 'ed25519') {
      const keyPair = Ed25519KeyPair.fromPrivateKey(new Uint8Array(32)); // Dummy private key, we only need public key
      keyPair.publicKey = publicKeyBytes;
      return keyPair.verify(data, signature);
    } else if (keyType === 'ed448') {
      const keyPair = Ed448KeyPair.fromPrivateKey(new Uint8Array(32)); // Dummy private key, we only need public key
      keyPair.publicKey = publicKeyBytes;
      return keyPair.verify(data, signature);
    } else {
      throw new Error(`Unsupported key type: ${keyType}`);
    }
  } catch (error) {
    throw new Error(`Signature verification failed: ${error.message}`);
  }
}

/**
 * Print debug results in a readable format
 * @param {object} results - Results from debugSignatureValidation
 */
export function printDebugResults(results) {
  console.log('\n🔍 Signature Debug Results');
  console.log('=' .repeat(50));
  
  console.log(`\n📊 Overall Status: ${results.isValid ? '✅ VALID' : '❌ INVALID'}`);
  
  if (results.transactionHash) {
    console.log(`\n🔗 Transaction Hash: ${results.transactionHash}`);
  }
  
  console.log(`\n🔑 Public Keys (${results.publicKeys.length}):`);
  results.publicKeys.forEach((pk, i) => {
    console.log(`  ${i}: ${pk.identifier} (${pk.keyType})`);
  });
  
  console.log(`\n✍️  Signatures (${results.signatures.length}):`);
  results.signatures.forEach((sig, i) => {
    console.log(`  ${i}: ${sig.hex.substring(0, 20)}... (${sig.length} bytes)`);
  });
  
  console.log(`\n🔍 Verification Results:`);
  results.verificationResults.forEach((result, i) => {
    const status = result.isValid ? '✅' : '❌';
    console.log(`  ${status} Signature ${i}: ${result.publicKeyIdentifier}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors:`);
    results.errors.forEach((error, i) => {
      console.log(`  ${i + 1}: ${error}`);
    });
  }
  
  if (results.debugInfo.transactionForVerification) {
    console.log(`\n📋 Debug Info:`);
    console.log(`  Serialized length: ${results.debugInfo.transactionForVerification.serializedLength} bytes`);
    console.log(`  Serialized preview: ${results.debugInfo.transactionForVerification.serializedHex}`);
  }
  
  console.log('\n' + '=' .repeat(50));
}

/**
 * Test signature validation with a sample transaction
 * @param {object} coinTxn - CoinTXN to test
 * @param {Array} expectedPublicKeys - Expected public key identifiers
 */
export function testSignatureValidation(coinTxn, expectedPublicKeys = []) {
  console.log('🧪 Testing Signature Validation...');
  
  const results = debugSignatureValidation(coinTxn, expectedPublicKeys);
  printDebugResults(results);
  
  return results;
}
