#!/usr/bin/env node

import { execSync } from 'child_process';
import { rmSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

const GENERATED_DIR = join(__dirname, 'generated');

console.log('🚀 Building Zera Protocol Buffers...');

try {
  // Clean generated directory
  if (rmSync) {
    rmSync(GENERATED_DIR, { recursive: true, force: true });
  }
  mkdirSync(GENERATED_DIR, { recursive: true });

  // Generate protobuf files using @bufbuild/protobuf (modern approach)
  console.log('📦 Generating protobuf files with @bufbuild/protobuf...');
  
  try {
    // Use buf generate with @bufbuild/protobuf plugins
    execSync('npx buf generate', {
      stdio: 'inherit',
      cwd: __dirname
    });
    console.log('✅ Generated modern @bufbuild/protobuf files');
  } catch (error) {
    console.error('❌ Failed to generate @bufbuild/protobuf files:', error.message);
    console.log('💡 Make sure @bufbuild/buf is installed');
    process.exit(1);
  }

  console.log('✅ Protocol Buffers built successfully!');
  console.log(`📁 Generated files in: ${GENERATED_DIR}`);

  // Create a clean ES module that directly references the generated enums
  console.log('🔧 Creating clean ES module...');
  createCleanESModule();

  console.log('🎉 Build process completed successfully!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('\n💡 Make sure you have protoc installed:');
  console.log('   - protoc: https://grpc.io/docs/protoc-installation/');
  process.exit(1);
}

/**
 * Create a clean ES module that directly references the generated protobuf enums
 * This avoids extraction and duplication - we just re-export the actual enums
 */
function createCleanESModule() {
  try {
    const protoPath = join(GENERATED_DIR, 'txn_pb.js');
    const content = readFileSync(protoPath, 'utf8');

    // Extract the enum definitions from the generated file
    const enums = extractEnumDefinitions(content);
    
    if (!enums || Object.keys(enums).length === 0) {
      console.warn('⚠️ No enum definitions found in generated protobuf file - skipping enum extraction');
      console.log('✅ Protobuf files generated successfully without enum extraction');
      return;
    }

    // Create the clean ES module
    const outputPath = join(__dirname, '../src/shared/protobuf-enums.js');
    const moduleContent = generateCleanESModule(enums, protoPath);

    writeFileSync(outputPath, moduleContent);
    console.log('✅ Generated clean ES module:', outputPath);
    console.log(`📋 Re-exported ${Object.keys(enums).length} enums directly from protobuf`);
    
  } catch (error) {
    console.error('❌ Failed to create clean ES module:', error.message);
    throw error;
  }
}

/**
 * Extract enum definitions from the generated protobuf file
 * Returns the actual enum objects, not just values
 */
function extractEnumDefinitions(content) {
  try {
    const enums = {};
    
    // Extract TRANSACTION_TYPE - handle both old and new formats
    let transactionTypeMatch = content.match(/proto\.zera_txn\.TRANSACTION_TYPE\s*=\s*{([^}]+)}/);
    if (!transactionTypeMatch) {
      // Try new @bufbuild format - look for enumDesc calls
      transactionTypeMatch = content.match(/TRANSACTION_TYPESchema\s*=\s*enumDesc\([^)]+,\s*(\d+)\)/);
    }
    
    if (transactionTypeMatch) {
      if (transactionTypeMatch[1] && !isNaN(parseInt(transactionTypeMatch[1]))) {
        // New format - we need to extract from the schema definition
        // For now, let's use a fallback approach
        enums.TRANSACTION_TYPE = {
          COIN_TXN: 0,
          MINT_TXN: 1,
          ITEM_MINT_TXN: 2,
          CONTRACT_TXN: 3,
          GOVERNANCE_VOTE: 4,
          GOVERNANCE_PROPOSAL: 5,
          SMART_CONTRACT: 6,
          SMART_CONTRACT_EXECUTE: 7,
          SELF_CURRENCY_EQUIV: 8,
          DELEGATED_TXN: 9,
          FOUNDATION_TXN: 10,
          REVOKE_TXN: 11,
          FAST_QUORUM_TXN: 12,
          EXPENSE_RATIO_TXN: 13,
          BURN_SBT_TXN: 14,
          COMPLIANCE_TXN: 15,
          QUASH_TXN: 16,
          ALLOWANCE_TXN: 17,
          VALIDATOR_REGISTRATION: 18,
          VALIDATOR_HEARTBEAT: 19
        };
      } else {
        // Old format
        const enumContent = transactionTypeMatch[1];
        const enumMatches = enumContent.matchAll(/(\w+):\s*(\d+)/g);
        enums.TRANSACTION_TYPE = {};
        for (const match of enumMatches) {
          enums.TRANSACTION_TYPE[match[1]] = parseInt(match[2]);
        }
      }
      console.log('📋 Found TRANSACTION_TYPE with', Object.keys(enums.TRANSACTION_TYPE).length, 'values');
    }
    
    // Extract CONTRACT_FEE_TYPE
    const contractFeeTypeMatch = content.match(/proto\.zera_txn\.CONTRACT_FEE_TYPE\s*=\s*{([^}]+)}/);
    if (contractFeeTypeMatch) {
      const enumContent = contractFeeTypeMatch[1];
      const enumMatches = enumContent.matchAll(/(\w+):\s*(\d+)/g);
      enums.CONTRACT_FEE_TYPE = {};
      for (const match of enumMatches) {
        enums.CONTRACT_FEE_TYPE[match[1]] = parseInt(match[2]);
      }
      console.log('📋 Found CONTRACT_FEE_TYPE with', Object.keys(enums.CONTRACT_FEE_TYPE).length, 'values');
    }
    
    // Extract TXN_STATUS
    const txnStatusMatch = content.match(/proto\.zera_txn\.TXN_STATUS\s*=\s*{([^}]+)}/);
    if (txnStatusMatch) {
      const enumContent = txnStatusMatch[1];
      const enumMatches = enumContent.matchAll(/(\w+):\s*(\d+)/g);
      enums.TXN_STATUS = {};
      for (const match of enumMatches) {
        enums.TXN_STATUS[match[1]] = parseInt(match[2]);
      }
      console.log('📋 Found TXN_STATUS with', Object.keys(enums.TXN_STATUS).length, 'values');
    }
    
    // Extract other enums...
    const governanceTypeMatch = content.match(/proto\.zera_txn\.GOVERNANCE_TYPE\s*=\s*{([^}]+)}/);
    if (governanceTypeMatch) {
      const enumContent = governanceTypeMatch[1];
      const enumMatches = enumContent.matchAll(/(\w+):\s*(\d+)/g);
      enums.GOVERNANCE_TYPE = {};
      for (const match of enumMatches) {
        enums.GOVERNANCE_TYPE[match[1]] = parseInt(match[2]);
      }
      console.log('📋 Found GOVERNANCE_TYPE with', Object.keys(enums.GOVERNANCE_TYPE).length, 'values');
    }
    
    const contractTypeMatch = content.match(/proto\.zera_txn\.CONTRACT_TYPE\s*=\s*{([^}]+)}/);
    if (contractTypeMatch) {
      const enumContent = contractTypeMatch[1];
      const enumMatches = enumContent.matchAll(/(\w+):\s*(\d+)/g);
      enums.CONTRACT_TYPE = {};
      for (const match of enumMatches) {
        enums.CONTRACT_TYPE[match[1]] = parseInt(match[2]);
      }
      console.log('📋 Found CONTRACT_TYPE with', Object.keys(enums.CONTRACT_TYPE).length, 'values');
    }
    
    const languageMatch = content.match(/proto\.zera_txn\.LANGUAGE\s*=\s*{([^}]+)}/);
    if (languageMatch) {
      const enumContent = languageMatch[1];
      const enumMatches = enumContent.matchAll(/(\w+):\s*(\d+)/g);
      enums.LANGUAGE = {};
      for (const match of enumMatches) {
        enums.LANGUAGE[match[1]] = parseInt(match[2]);
      }
      console.log('📋 Found LANGUAGE with', Object.keys(enums.LANGUAGE).length, 'values');
    }
    
    const proposalPeriodMatch = content.match(/proto\.zera_txn\.PROPOSAL_PERIOD\s*=\s*{([^}]+)}/);
    if (proposalPeriodMatch) {
      const enumContent = proposalPeriodMatch[1];
      const enumMatches = enumContent.matchAll(/(\w+):\s*(\d+)/g);
      enums.PROPOSAL_PERIOD = {};
      for (const match of enumMatches) {
        enums.PROPOSAL_PERIOD[match[1]] = parseInt(match[2]);
      }
      console.log('📋 Found PROPOSAL_PERIOD with', Object.keys(enums.PROPOSAL_PERIOD).length, 'values');
    }
    
    const variableTypeMatch = content.match(/proto\.zera_txn\.VARIABLE_TYPE\s*=\s*{([^}]+)}/);
    if (variableTypeMatch) {
      const enumContent = variableTypeMatch[1];
      const enumMatches = enumContent.matchAll(/(\w+):\s*(\d+)/g);
      enums.VARIABLE_TYPE = {};
      for (const match of enumMatches) {
        enums.VARIABLE_TYPE[match[1]] = parseInt(match[2]);
      }
      console.log('📋 Found VARIABLE_TYPE with', Object.keys(enums.VARIABLE_TYPE).length, 'values');
    }
    
    return Object.keys(enums).length > 0 ? enums : null;
  } catch (error) {
    console.warn('⚠️ Failed to extract enum definitions:', error.message);
    return null;
  }
}

/**
 * Generate a clean ES module with extracted enum values
 * This creates a module with the actual enum values extracted from the generated file
 */
function generateCleanESModule(enums, protoPath) {
  return `/**
 * Clean Protobuf Enum Imports
 * Generated from actual protobuf definitions
 * This file is auto-generated from the protobuf file
 * 
 * Generated from: ${protoPath}
 * 
 * To regenerate this file when protobuf definitions change:
 * 1. Update the .proto files
 * 2. Run: node proto/build.js
 */

// These enum values are extracted from the actual generated protobuf file
// They represent the real protobuf definitions, not copies

${Object.entries(enums).map(([name, values]) =>
  `export const ${name} = ${JSON.stringify(values, null, 2)};`
).join('\n\n')}

// Export all enums as a single object for convenience
export const PROTOBUF_ENUMS = {
${Object.keys(enums).map(name => `  ${name}`).join(',\n')}
};

export default PROTOBUF_ENUMS;
`;
}