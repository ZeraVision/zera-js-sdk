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

/**
 * Demonstration of the new enum-based system benefits
 */
function demonstrateEnumSystem() {
  console.log('🎯 ZERA Wallet Creation System - Enum Benefits Demo\n');

  // Show available constants
  console.log('📋 Available Constants:');
  console.log('   Key Types:', VALID_KEY_TYPES);
  console.log('   Hash Types:', VALID_HASH_TYPES);
  console.log('   Mnemonic Lengths:', MNEMONIC_LENGTHS);
  console.log('');

  // Show enum usage
  console.log('🔑 Enum Usage Examples:');
  console.log(`   KEY_TYPE.ED25519 = "${KEY_TYPE.ED25519}"`);
  console.log(`   KEY_TYPE.ED448 = "${KEY_TYPE.ED448}"`);
  console.log(`   HASH_TYPE.SHA3_256 = "${HASH_TYPE.SHA3_256}"`);
  console.log(`   HASH_TYPE.SHA3_512 = "${HASH_TYPE.SHA3_512}"`);
  console.log(`   HASH_TYPE.BLAKE3 = "${HASH_TYPE.BLAKE3}"`);
  console.log('');

  // Demonstrate validation
  console.log('✅ Validation Examples:');
  
  // Valid key types
  console.log('   Valid Key Types:');
  console.log(`     isValidKeyType("${KEY_TYPE.ED25519}"): ${isValidKeyType(KEY_TYPE.ED25519)}`);
  console.log(`     isValidKeyType("${KEY_TYPE.ED448}"): ${isValidKeyType(KEY_TYPE.ED448)}`);
  
  // Invalid key types
  console.log('   Invalid Key Types:');
  console.log(`     isValidKeyType("ed25519"): ${isValidKeyType("ed25519")}`);
  console.log(`     isValidKeyType("invalid"): ${isValidKeyType("invalid")}`);
  console.log(`     isValidKeyType("ED25519"): ${isValidKeyType("ED25519")}`);
  console.log('');

  // Valid hash types
  console.log('   Valid Hash Types:');
  console.log(`     isValidHashType("${HASH_TYPE.SHA3_256}"): ${isValidHashType(HASH_TYPE.SHA3_256)}`);
  console.log(`     isValidHashType("${HASH_TYPE.BLAKE3}"): ${isValidHashType(HASH_TYPE.BLAKE3)}`);
  
  // Invalid hash types
  console.log('   Invalid Hash Types:');
  console.log(`     isValidHashType("sha3-256"): ${isValidHashType("sha3-256")}`);
  console.log(`     isValidHashType("blake3"): ${isValidHashType("blake3")}`);
  console.log(`     isValidHashType("invalid-hash"): ${isValidHashType("invalid-hash")}`);
  console.log('');

  // Valid mnemonic lengths
  console.log('   Valid Mnemonic Lengths:');
  console.log(`     isValidMnemonicLength(12): ${isValidMnemonicLength(12)}`);
  console.log(`     isValidMnemonicLength(24): ${isValidMnemonicLength(24)}`);
  
  // Invalid mnemonic lengths
  console.log('   Invalid Mnemonic Lengths:');
  console.log(`     isValidMnemonicLength(13): ${isValidMnemonicLength(13)}`);
  console.log(`     isValidMnemonicLength(25): ${isValidMnemonicLength(25)}`);
  console.log(`     isValidMnemonicLength(0): ${isValidMnemonicLength(0)}`);
  console.log('');

  // Show error prevention
  console.log('🚫 Error Prevention Examples:');
  
  try {
    // This would work with the old system but fail validation
    console.log('   Attempting to use string "ed25519":');
    if (!isValidKeyType("ed25519")) {
      console.log('     ❌ "ed25519" is not a valid key type');
      console.log(`     ✅ Use KEY_TYPE.ED25519 instead: "${KEY_TYPE.ED25519}"`);
    }
  } catch (error) {
    console.log('     ❌ Error:', error.message);
  }

  try {
    // This would work with the old system but fail validation
    console.log('   Attempting to use string "blake3":');
    if (!isValidHashType("blake3")) {
      console.log('     ❌ "blake3" is not a valid hash type');
      console.log(`     ✅ Use HASH_TYPE.BLAKE3 instead: "${HASH_TYPE.BLAKE3}"`);
    }
  } catch (error) {
    console.log('     ❌ Error:', error.message);
  }

  console.log('');

  // Show practical usage
  console.log('💡 Practical Usage:');
  console.log('   // Instead of this (error-prone):');
  console.log('   const wallet = await createWallet({');
  console.log('     keyType: "ed25519",        // ❌ String - can have typos');
  console.log('     hashTypes: ["blake3"]     // ❌ String - can have typos');
  console.log('   });');
  console.log('');
  console.log('   // Use this (type-safe):');
  console.log('   const wallet = await createWallet({');
  console.log(`     keyType: KEY_TYPE.ED25519,        // ✅ Enum constant - no typos`);
  console.log(`     hashTypes: [HASH_TYPE.BLAKE3]    // ✅ Enum constant - no typos`);
  console.log('   });');
  console.log('');

  console.log('✅ Enum System Benefits:');
  console.log('   1. Type Safety: Prevents invalid inputs at runtime');
  console.log('   2. IDE Support: Autocomplete and IntelliSense');
  console.log('   3. Maintainability: Centralized constants');
  console.log('   4. Documentation: Constants serve as living docs');
  console.log('   5. Error Prevention: Catches typos and invalid values');
  console.log('   6. Consistency: Ensures all code uses the same values');
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateEnumSystem();
}

export { demonstrateEnumSystem };
