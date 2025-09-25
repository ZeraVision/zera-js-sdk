import {
  KEY_TYPE,
  HASH_TYPE,
  VALID_KEY_TYPES,
  VALID_HASH_TYPES,
  MNEMONIC_LENGTHS,
  isValidKeyType,
  isValidHashType,
  isValidMnemonicLength
} from '../constants.js';

export function testEnumConstants(): void {
  console.log('🧪 Testing enum constants...');
  
  console.log('📋 Constants:');
  console.log('   KEY_TYPE.ED25519:', KEY_TYPE.ED25519);
  console.log('   KEY_TYPE.ED448:', KEY_TYPE.ED448);
  console.log('   HASH_TYPE.SHA3_256:', HASH_TYPE.SHA3_256);
  console.log('   HASH_TYPE.BLAKE3:', HASH_TYPE.BLAKE3);
  console.log('   VALID_KEY_TYPES:', VALID_KEY_TYPES);
  console.log('   VALID_HASH_TYPES:', VALID_HASH_TYPES);
  console.log('   MNEMONIC_LENGTHS:', MNEMONIC_LENGTHS);
  
  // Verify constants are arrays
  if (!Array.isArray(VALID_KEY_TYPES)) throw new Error('VALID_KEY_TYPES should be an array');
  if (!Array.isArray(VALID_HASH_TYPES)) throw new Error('VALID_HASH_TYPES should be an array');
  if (!Array.isArray(MNEMONIC_LENGTHS)) throw new Error('MNEMONIC_LENGTHS should be an array');
  
  console.log('✅ All enum constants are properly defined');
}

export function testValidationFunctions(): void {
  console.log('🧪 Testing validation functions...');
  
  console.log('✅ Validation Tests:');
  console.log('   isValidKeyType(KEY_TYPE.ED25519):', isValidKeyType(KEY_TYPE.ED25519));
  console.log('   isValidKeyType("ed25519"):', isValidKeyType("ed25519"));
  console.log('   isValidKeyType("invalid"):', isValidKeyType("invalid"));
  console.log('   isValidHashType(HASH_TYPE.BLAKE3):', isValidHashType(HASH_TYPE.BLAKE3));
  console.log('   isValidHashType("blake3"):', isValidHashType("blake3"));
  console.log('   isValidMnemonicLength(12):', isValidMnemonicLength(12));
  console.log('   isValidMnemonicLength(13):', isValidMnemonicLength(13));
  
  // Test validation logic
  if (!isValidKeyType(KEY_TYPE.ED25519)) throw new Error('ED25519 should be valid');
  if (!isValidKeyType(KEY_TYPE.ED448)) throw new Error('ED448 should be valid');
  if (isValidKeyType("invalid")) throw new Error('Invalid key type should not be valid');
  
  if (!isValidHashType(HASH_TYPE.SHA3_256)) throw new Error('SHA3_256 should be valid');
  if (!isValidHashType(HASH_TYPE.BLAKE3)) throw new Error('BLAKE3 should be valid');
  if (isValidHashType("invalid-hash")) throw new Error('Invalid hash type should not be valid');
  
  if (!isValidMnemonicLength(12)) throw new Error('12 should be valid mnemonic length');
  if (!isValidMnemonicLength(24)) throw new Error('24 should be valid mnemonic length');
  if (isValidMnemonicLength(13)) throw new Error('13 should not be valid mnemonic length');
  
  console.log('✅ All validation functions work correctly');
}

export function testEnumSystem(): void {
  console.log('🧪 Testing complete enum system...');
  
  // Test that all constants are accessible
  const allConstants = {
    keyTypes: VALID_KEY_TYPES,
    hashTypes: VALID_HASH_TYPES,
    mnemonicLengths: MNEMONIC_LENGTHS
  };
  
  console.log('📊 Enum System Summary:');
  console.log('   Supported Key Types:', allConstants.keyTypes.length);
  console.log('   Supported Hash Types:', allConstants.hashTypes.length);
  console.log('   Supported Mnemonic Lengths:', allConstants.mnemonicLengths.length);
  
  // Verify we have the expected number of each
  if (allConstants.keyTypes.length !== 2) throw new Error('Expected 2 key types');
  if (allConstants.hashTypes.length !== 3) throw new Error('Expected 3 hash types');
  if (allConstants.mnemonicLengths.length !== 5) throw new Error('Expected 5 mnemonic lengths');
  
  console.log('🎉 Enum system is working correctly!');
}
