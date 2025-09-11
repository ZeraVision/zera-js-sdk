# Zera Protocol Buffers

This folder contains all Protocol Buffer definitions and build tools for the Zera JavaScript SDK using the **modern @bufbuild/protobuf approach**.

## Modern @bufbuild/protobuf Integration

This SDK uses the modern @bufbuild/protobuf runtime for JavaScript protobuf integration:

- ✅ **Actual protobuf message instances** with direct property access
- ✅ **Real protobuf methods** via utility functions from @bufbuild/protobuf
- ✅ **Generated schemas** for type-safe message creation
- ✅ **Binary serialization** using `toBinary()` and `fromBinary()` functions
- ✅ **JSON conversion** using `toJson()` function
- ✅ **Modern ES6 modules** with clean import/export syntax

## Structure

```
proto/
├── txn.proto           # Main transaction definitions
├── buf.yaml           # Buf configuration for modern protobuf generation
├── buf.gen.yaml       # Buf generation configuration
├── package.json        # Dependencies and build scripts
├── build.js           # Build automation script using @bufbuild/protobuf
├── README.md          # This file
└── generated/         # Generated JavaScript files (after building)
    ├── txn_pb.js     # Modern @bufbuild/protobuf classes
    ├── txn_pb.ts     # TypeScript definitions
    └── txn_connect.js # Connect service definitions
```

## Prerequisites

### 1. Install Modern Protobuf Tools

**Install @bufbuild/protobuf:**
```bash
npm install --save-dev @bufbuild/protobuf @bufbuild/buf @bufbuild/protoc-gen-es @bufbuild/protoc-gen-connect-es
```

**Install Buf CLI:**
```bash
npm install --save-dev @bufbuild/buf
```

**Install protoc (if needed):**
- Windows: `choco install protoc`
- macOS: `brew install protobuf`
- Linux: `sudo apt-get install protobuf-compiler`

### 2. Install Node.js Dependencies

```bash
cd proto
npm install
```

## Building Protocol Buffers

### Quick Build

```bash
cd proto
node build.js
```

This single command will:
1. Generate modern @bufbuild/protobuf JavaScript and TypeScript files
2. Create protobuf schemas and utility functions for message creation
3. Extract enum values for easy importing
4. Provide a modern JavaScript protobuf development experience

## Modern Usage with @bufbuild/protobuf

The generated protobuf files provide a modern JavaScript protobuf experience:

```javascript
import { TransferSchema } from './generated/txn_pb.js';
import { create, toBinary, fromBinary, toJson } from '@bufbuild/protobuf';

// Create a protobuf message instance
const message = create(TransferSchema, {
  recipientAddress: new Uint8Array(Buffer.from('bob', 'utf8')),
  amount: '100',
  contractId: '$ZRA+0000',
  memo: 'payment'
});

// Serialize to binary
const binary = toBinary(TransferSchema, message);

// Convert to JSON
const json = toJson(TransferSchema, message);

// Deserialize from binary
const deserialized = fromBinary(TransferSchema, binary);

// Access properties directly
console.log(message.amount); // "100"
console.log(message.$typeName); // "zera_txn.Transfer"
```

## Generated Files

After building, the following files will be generated:

### In `generated/` directory:
- `txn_pb.js` - Main protobuf schemas and message definitions (modern ES6 format)
- `txn_pb.ts` - TypeScript definitions for type safety

### In `src/shared/` directory:
- `protobuf-enums.js` - Clean ES module with extracted enum values

## Why Extract Enums Instead of Direct Reference?

The build process extracts enum values from the generated protobuf file instead of directly importing them. This is necessary because:

1. **Modern ES6 Format**: The generated protobuf file uses modern ES6 exports with complex schema structures
2. **Clean ES Module**: We need a clean ES module that can be imported without complex schema dependencies
3. **Enum Accessibility**: Direct enum access is simpler than navigating schema structures
4. **Automatic Sync**: When protobuf definitions change, the enum values are automatically updated

**The extraction approach is not duplication** - it's **build-time synchronization** that ensures we always have the actual protobuf enum values in a clean, importable format.

### What Gets Extracted

The following enums are extracted and made available as clean ES module exports:

- `TRANSACTION_TYPE` - Transaction type constants (COIN_TYPE, MINT_TYPE, etc.)
- `CONTRACT_FEE_TYPE` - Contract fee type constants (FIXED, PERCENTAGE, etc.)
- `TXN_STATUS` - Transaction status constants (OK, INVALID_PARAMETERS, etc.)
- `GOVERNANCE_TYPE` - Governance type constants (STAGED, CYCLE, etc.)
- `CONTRACT_TYPE` - Contract type constants (TOKEN, NFT, SBT)
- `LANGUAGE` - Language constants (COMPILED, PYTHON, JAVASCRIPT)
- `PROPOSAL_PERIOD` - Proposal period constants (DAYS, MONTHS)
- `VARIABLE_TYPE` - Variable type constants (INT, STRING, BOOL, etc.)

## Usage

### Using Protobuf Enums

```javascript
// Import the clean enum module
import { TRANSACTION_TYPE, TXN_STATUS, CONTRACT_FEE_TYPE } from '../src/shared/protobuf-enums.js';

// Use the enums
console.log(TRANSACTION_TYPE.COIN_TYPE); // 0
console.log(TXN_STATUS.OK); // 0
console.log(CONTRACT_FEE_TYPE.FIXED); // 0
```

### Using Protobuf Messages

```javascript
// Import schemas and utility functions
import { CoinTXNSchema, BaseTXNSchema } from './proto/generated/txn_pb.js';
import { create, toBinary, fromBinary } from '@bufbuild/protobuf';

// Create a new transaction
const baseTxn = create(BaseTXNSchema, {
  feeAmount: "1000000",
  feeId: "ZERA"
});

const coinTxn = create(CoinTXNSchema, {
  base: baseTxn,
  contractId: "contract123"
});

// Serialize to binary
const binary = toBinary(CoinTXNSchema, coinTxn);

// Deserialize from binary
const deserialized = fromBinary(CoinTXNSchema, binary);

// Access properties directly
console.log(coinTxn.contractId); // "contract123"
console.log(coinTxn.$typeName); // "zera_txn.CoinTXN"
```

## Clean Build

To clean generated files and rebuild:

```bash
cd proto
node build.js
```

The build script automatically cleans the generated directory before rebuilding.

## Troubleshooting

### Common Issues

1. **protoc not found**: Ensure protoc is installed and in your PATH
2. **Import errors**: Make sure you're using the correct import path
3. **Missing dependencies**: Run `npm install` in the proto folder
4. **Permission errors**: Ensure you have write permissions in the proto folder

### Build Verification

After building, verify that:
- `generated/` folder exists
- `txn_pb.js` file is present
- `src/shared/protobuf-enums.js` file is created
- No build errors in console output

### Testing the Build

```bash
# Test that the extracted enums work
node -e "import('./src/shared/protobuf-enums.js').then(m => console.log('✅ Enums working:', m.TRANSACTION_TYPE.COIN_TYPE))"
```
